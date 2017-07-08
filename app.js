const s3DemoGlobals = {};

// eslint-disable-next-line no-unused-vars
function loginToGoogle(response) {
  const profile = response.getBasicProfile();
  s3DemoGlobals.email = profile.getEmail();
  s3DemoGlobals.name = profile.getName();
  s3DemoGlobals.assumeRoleWithWebIdentity({
    roleArn: "arn:aws:iam::238605363322:role/receiving-browser-role",
    idToken: response.getAuthResponse().id_token,
  });
  $("#fine-uploader-s3").show();
}

$(function() {
  var assumeRoleWithWebIdentity = function(params) {
    var sts = new AWS.STS(),
      assumeRoleParams = {};

    s3DemoGlobals.roleArn = params.roleArn || s3DemoGlobals.roleArn;
    s3DemoGlobals.providerId = params.providerId || s3DemoGlobals.providerId;
    s3DemoGlobals.idToken = params.idToken || s3DemoGlobals.idToken;

    assumeRoleParams = {
      RoleArn: s3DemoGlobals.roleArn,
      RoleSessionName: "web-identity-federation",
      WebIdentityToken: s3DemoGlobals.idToken
    };

    if (s3DemoGlobals.providerId) {
      assumeRoleParams.ProviderId = s3DemoGlobals.providerId;
    }

    sts.assumeRoleWithWebIdentity(assumeRoleParams, params.callback || s3DemoGlobals.updateCredentials);
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
    },
    hideUploader = function() {
      $("#fine-uploader-s3").hide();
    };

  $("#fine-uploader-s3").fineUploaderS3({
    request: {
      endpoint: bucketUrl
    },
    objectProperties: {
      acl: "private",

      // The key for each file will follow this format: {USER_NAME}/{UUID}.{FILE_EXTENSION}
      key: function(id) {
        var filename = this.getName(id),
          uuid = this.getUuid(id);

        // return qq.format("{}/{}.{}.{}", s3DemoGlobals.userName, filename, uuid, qq.getExtension(filename));
        return qq.format("{}/{}", s3DemoGlobals.email, filename);
        // return qq.format("{}", filename);
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
      enabled: true
    },
    validation: {
      itemLimit: 20,
      sizeLimit: 20*1073741824
    },
    maxConnections: 5,
    // thumbnails: {
    //   placeholders: {
    //     notAvailablePath: "not_available-generic.png",
    //     waitingPath: "waiting-generic.png"
    //   }
    // },
    // callbacks: {
    //     onAllComplete: function (e) {
    //         window.alert("All complete. Notify Treehouse?");
    //     }
    // }
  })
    .on('complete', function(event, id, name, response, xhr) {
      var $fileEl = $(this).fineUploaderS3("getItemByFileId", id),
        $viewBtn = $fileEl.find(".view-btn"),
        key = $(this).fineUploaderS3("getKey", id);

      // Add a "view" button to access the uploaded file in S3 if the upload is successful
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
