const s3DemoGlobals = {};

// eslint-disable-next-line no-unused-vars
function signIn(response) {
  const profile = response.getBasicProfile();
  s3DemoGlobals.email = profile.getEmail();
  s3DemoGlobals.name = profile.getName();
  console.log("Logged In:", s3DemoGlobals.email, s3DemoGlobals.name);

  $("#name").html(s3DemoGlobals.name);
  $("#email").html(s3DemoGlobals.email);
  s3DemoGlobals.assumeRoleWithWebIdentity({
    roleArn: "arn:aws:iam::238605363322:role/receiving-browser-role",
    idToken: response.getAuthResponse().id_token,
  });
  $("#fine-uploader-s3").show();
}

// eslint-disable-next-line no-unused-vars
function signOut() {
  $("#fine-uploader-s3").hide();
  // eslint-disable-next-line no-undef
  const auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(console.log("User signed out."));
}

function assumeRoleWithWebIdentity(params) {
  s3DemoGlobals.roleArn = params.roleArn || s3DemoGlobals.roleArn;
  s3DemoGlobals.providerId = params.providerId || s3DemoGlobals.providerId;
  s3DemoGlobals.idToken = params.idToken || s3DemoGlobals.idToken;

  const assumeRoleParams = {
    RoleArn: s3DemoGlobals.roleArn,
    RoleSessionName: "web-identity-federation",
    WebIdentityToken: s3DemoGlobals.idToken,
  };

  if (s3DemoGlobals.providerId) {
    assumeRoleParams.ProviderId = s3DemoGlobals.providerId;
  }

  // eslint-disable-next-line no-undef
  const sts = new AWS.STS();
  sts.assumeRoleWithWebIdentity(assumeRoleParams,
                                params.callback || s3DemoGlobals.updateCredentials);
  s3DemoGlobals.sts = sts;
}

function getFuCredentials(data) {
  return {
    accessKey: data.Credentials.AccessKeyId,
    secretKey: data.Credentials.SecretAccessKey,
    sessionToken: data.Credentials.SessionToken,
    expiration: data.Credentials.Expiration,
  };
}

function updateCredentials(error, data) {
  if (!error) {
    $("#fine-uploader-s3").fineUploaderS3("setCredentials", s3DemoGlobals.getFuCredentials(data));
  }
  // eslint-disable-next-line no-undef
  AWS.config.update({
    credentials: {
      // region: data.Credentials.Region,
      // region: "us-west-2",
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
    },
  });
}

// eslint-disable-next-line prefer-arrow-callback
$(document).ready(function() {
  s3DemoGlobals.assumeRoleWithWebIdentity = assumeRoleWithWebIdentity;
  s3DemoGlobals.getFuCredentials = getFuCredentials;

  $("#fine-uploader-s3").fineUploaderS3({
    request: {
      endpoint: "https://receiving-treehouse-ucsc-edu.s3-us-west-2.amazonaws.com",
      // these are undefined at this point but should fill in just in case tags get lost
      // params: {
      //   email: s3DemoGlobals.email,
      //   name: s3DemoGlobals.name,
      // },
    },
    objectProperties: {
      acl: "private",
      // S3 key = hash of email + original file name + size so
      key: function (id) {
        // eslint-disable-next-line no-undef
        const uuid = getUUIDByString(s3DemoGlobals.email + this.getName(id) + this.getSize(id));
        // eslint-disable-next-line no-undef
        return qq.format("{}", uuid);
      },
    },
    cors: {
      // all requests are expected to be cross-domain requests
      expected: true,

      // if you want cookies to be sent along with the request
      sendCredentials: true,
    },
    chunking: {
      enabled: true,
      concurrent: {
        enabled: true,
      },
    },
    resume: {
      enabled: true,
    },
    validation: {
      itemLimit: 20,
      sizeLimit: 20 * 1073741824,
    },
    maxConnections: 5,
    callbacks: {
      onComplete: function(id, name) {
        const tags = {
          filename: name,
          uuid: this.getKey(id),
          email: s3DemoGlobals.email,
          name: s3DemoGlobals.name,
        };

        // eslint-disable-next-line no-undef
        const s3 = new AWS.S3({region: "us-west-2"});
        const params = {
          Bucket: "receiving-treehouse-ucsc-edu",
          Key: this.getKey(id),
          Tagging: {
            // eslint-disable-next-line prefer-arrow-callback
            TagSet: Object.keys(tags).map(function(key) {
              return {Key: key, Value: tags[key]};
            }),
          },
        };
        console.log(params);
        s3.putObjectTagging(params, (err, data) => {
          if (err) console.log(err, err.stack);
          else console.log("putObjectTagging", data);
        });
        s3.putObject({
          Bucket: "receiving-treehouse-ucsc-edu",
          Key: this.getKey(id) + ".json",
          Body: JSON.stringify(tags, null, "  "),
        }, (err, data) => {
          if (err) console.log(err, err.stack);
          else console.log("putObject", data);
        });
      },
      onAllComplete: (succeeded, failed) => {
        console.log("onAllComplete");
        console.log(succeeded, failed);
      },
    },
  })
  .on("complete", function(event, id, name, response) {
    const $fileEl = $(this).fineUploaderS3("getItemByFileId", id);
    const $viewBtn = $fileEl.find(".view-btn");
    if (response.success) {
      $viewBtn.show();
    }
  })
  .on("credentialsExpired", () => {
    // eslint-disable-next-line no-undef
    const promise = new qq.Promise();

    // Grab new credentials
    s3DemoGlobals.assumeRoleWithWebIdentity({
      callback: (error, data) => {
        if (error) {
          promise.failure("Failed to assume role");
        } else {
          promise.success(s3DemoGlobals.getFuCredentials(data));
        }
      },
    });

    return promise;
  });

  s3DemoGlobals.updateCredentials = updateCredentials;

  $(document).on("tokenExpired.s3Demo", () => {
    $("#fine-uploader-s3").hide();
  });

  $(document).on("tokenReceived.s3Demo", () => {
    $("#fine-uploader-s3").show();
  });

  $(document).trigger("tokenExpired.s3Demo");
});
