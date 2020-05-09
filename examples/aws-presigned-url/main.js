const grx = {}; // receiving globals
var uuid='';
// eslint-disable-next-line no-unused-vars
function signIn(response) {
  const profile = response.getBasicProfile();
  grx.email = profile.getEmail();
  grx.name = profile.getName();
  console.log("User:", grx.email, grx.name);

  $("#name").html(grx.name);
  $("#email").html(grx.email);
  // grx.assumeRoleWithWebIdentity({
  //   roleArn: "arn:aws:iam::443872533066:role/browser-inbox-role",
  //   idToken: response.getAuthResponse().id_token,
  // });
  document.cookie = "username="+grx.email;
}

// eslint-disable-next-line no-unused-vars
function signOut() {
  $("#fine-uploader").hide();
  // eslint-disable-next-line no-undef
  const auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(console.log("User signed out."));
}

const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const AwsS3 = require('@uppy/aws-s3')

const uppy = Uppy({
  debug: true
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body'
})
uppy.use(AwsS3, {
  getUploadParameters (file) {
    // Send a request to our PHP signing endpoint.
    return fetch('/s3-sign.php', {
      method: 'post',
      // Send and receive JSON.
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type
      })
    }).then((response) => {
      // Parse the JSON response.
      return response.json()
    }).then((data) => {
      // Return an object in the correct shape.
      return {
        method: data.method,
        url: data.url,
        fields: data.fields,
        headers: data.headers
      }
    })
  }
})
