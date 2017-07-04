/**
 * Sets up a Fine Uploader S3 jQuery UI instance, ensures files are saved under a "directory" in the bucket
 * bearing the logged-in user's name, provides a link to view the uploaded file after it has reached the bucket
 * and asks AWS for new credentials before those expire.
 */
$(function() {
    bucketUrl = "https://receive-treehouse-ucsc-edu.s3-us-west-2.amazonaws.com",
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
            // Since we want all items to be publicly accessible w/out a server to return a signed URL
            acl: "private",

            // The key for each file will follow this format: {USER_NAME}/{UUID}.{FILE_EXTENSION}
            key: function(id) {
                var filename = this.getName(id),
                    uuid = this.getUuid(id);

                // return qq.format("{}/{}.{}.{}", s3DemoGlobals.userName, filename, uuid, qq.getExtension(filename));
                return qq.format("{}/{}", s3DemoGlobals.email, filename);
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
        thumbnails: {
            placeholders: {
                notAvailablePath: "not_available-generic.png",
                waitingPath: "waiting-generic.png"
            }
        }
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
