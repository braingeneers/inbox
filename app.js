const s3DemoGlobals = {};

// eslint-disable-next-line no-unused-vars
function signIn(response) {
  const profile = response.getBasicProfile();
  s3DemoGlobals.email = profile.getEmail();
  s3DemoGlobals.name = profile.getName();
  console.log(s3DemoGlobals.email, s3DemoGlobals.name);

  $("#name").html(s3DemoGlobals.name);
  $("#email").html(s3DemoGlobals.email);
  s3DemoGlobals.assumeRoleWithWebIdentity({
    roleArn: "arn:aws:iam::238605363322:role/receiving-browser-role",
    idToken: response.getAuthResponse().id_token,
  });
  $("#fine-uploader-s3").show();
}

function signOut() {
  $("#fine-uploader-s3").hide();
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(console.log("User signed out."));
}

$(function() {
  var assumeRoleWithWebIdentity = function(params) {

    s3DemoGlobals.roleArn = params.roleArn || s3DemoGlobals.roleArn;
    s3DemoGlobals.providerId = params.providerId || s3DemoGlobals.providerId;
    s3DemoGlobals.idToken = params.idToken || s3DemoGlobals.idToken;

    let assumeRoleParams = {
      RoleArn: s3DemoGlobals.roleArn,
      RoleSessionName: "web-identity-federation",
      WebIdentityToken: s3DemoGlobals.idToken
    };

    if (s3DemoGlobals.providerId) {
      assumeRoleParams.ProviderId = s3DemoGlobals.providerId;
    }

    let sts = new AWS.STS();
    sts.assumeRoleWithWebIdentity(assumeRoleParams, params.callback || s3DemoGlobals.updateCredentials);
    s3DemoGlobals.sts = sts;
  },
    getFuCredentials = function(data) {
      return {
        accessKey: data.Credentials.AccessKeyId,
        secretKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken,
        expiration: data.Credentials.Expiration
      };
    };

  s3DemoGlobals.assumeRoleWithWebIdentity = assumeRoleWithWebIdentity;
  s3DemoGlobals.getFuCredentials = getFuCredentials;



  bucketUrl = "https://receiving-treehouse-ucsc-edu.s3-us-west-2.amazonaws.com",
    updateCredentials = function(error, data) {
      if (!error) {
        $('#fine-uploader-s3').fineUploaderS3("setCredentials", s3DemoGlobals.getFuCredentials(data));
      }
      console.log(data.Credentials);
      AWS.config.update({
          credentials: {
            // region: data.Credentials.Region,
            // region: 'us-west-2',
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          }
      });
    },
    hideUploader = function() {
      $("#fine-uploader-s3").hide();
    };

  $("#fine-uploader-s3").fineUploaderS3({
    request: {
      endpoint: bucketUrl,
      // these are undefined at this point but should fill in just in case tags get lost
      // params: {
      //   email: s3DemoGlobals.email,
      //   name: s3DemoGlobals.name,
      // },
    },
    objectProperties: {
      acl: "private",

      // The key for each file will follow this format: {USER_NAME}/{UUID}.{FILE_EXTENSION}
      key: function(id) {
        var filename = this.getName(id), size = this.getSize(id);
        var uuid = getUUIDByString(s3DemoGlobals.email + filename + size.toString());

        // return qq.format("{}/{}.{}.{}", s3DemoGlobals.userName, filename, uuid, qq.getExtension(filename));
        // return qq.format("{}/{}", s3DemoGlobals.email, filename);
        // return qq.format("{}", filename);
        return qq.format("{}", uuid);
      }
    },
    cors: {
      //all requests are expected to be cross-domain requests
      expected: true,

      //if you want cookies to be sent along with the request
      sendCredentials: true
    },
    chunking: {
      enabled: true,
      concurrent: {
        enabled: true
      }
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
        onComplete: function (id, name, responseJSON, xhr) {
          console.log("Finished uploading " + name);
          tags = {
            filename: name,
            uid: this.getKey(id),
            email: s3DemoGlobals.email,
            name: s3DemoGlobals.name,
          }
          console.log(tags);

            let s3 = new AWS.S3({region: "us-west-2"});
						var params = {
              Bucket: 'receiving-treehouse-ucsc-edu',
							Key: this.getKey(id), 
							Tagging: {
							 TagSet: [
									{
								 Key: "filename", 
								 Value: this.getName(id)
								} 
							 ]
							}
						 };
             console.log(params);
						 s3.putObjectTagging(params, function(err, data) {
							 if (err) console.log(err, err.stack); // an error occurred
							 else     console.log(data);           // successful response
						 });
            s3.putObject({
                Bucket: 'receiving-treehouse-ucsc-edu',
                Key: this.getKey(id) + ".json",
                Body: JSON.stringify(tags, null, "  "),
            }, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
            });
        },
        onAllComplete: function (succeeded, failed) {
            console.log("onAllComplete");
            console.log(succeeded, failed);
        }
    }
  })
    .on('complete', function(event, id, name, response, xhr) {
      var $fileEl = $(this).fineUploaderS3("getItemByFileId", id),
        $viewBtn = $fileEl.find(".view-btn"),
        key = $(this).fineUploaderS3("getKey", id);

      if (response.success) {
        $viewBtn.show();
        $viewBtn.attr("href", bucketUrl + "/" + key);
      }
    })
    .on("credentialsExpired", function() {
      var promise = new qq.Promise();

      // Grab new credentials
      s3DemoGlobals.assumeRoleWithWebIdentity({
        callback: function(error, data) {
          if (error) {
            promise.failure("Failed to assume role");
          }
          else {
            promise.success(s3DemoGlobals.getFuCredentials(data));
          }
        }
      });

      return promise;
    });

  s3DemoGlobals.updateCredentials = updateCredentials;

  $(document).on("tokenExpired.s3Demo", hideUploader);
  $(document).on("tokenReceived.s3Demo", function() {
    $("#fine-uploader-s3").show();
  });
  $(document).trigger("tokenExpired.s3Demo");
});
