const grx = {}; // receiving globals
var uuid='';
var reminded=0;
// eslint-disable-next-line no-unused-vars
function signIn(googleUser) {
  // Useful data for your client-side scripts:
  var profile = googleUser.getBasicProfile();
  console.log("ID: " + profile.getId()); // Don't send this directly to your server!
  console.log('Full Name: ' + profile.getName());
  console.log('Given Name: ' + profile.getGivenName());
  console.log('Family Name: ' + profile.getFamilyName());
  console.log("Image URL: " + profile.getImageUrl());
  console.log("Email: " + profile.getEmail());

  // The ID token you need to pass to your backend:
  var id_token = googleUser.getAuthResponse().id_token;
  console.log("ID Token: " + id_token);
  logged_in = 1;
  console.log("Logged in status: " + logged_in);
  window.email = profile.getEmail();
  console.log("window -- grx.email : "+ window.email);
}

const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const AwsS3 = require('@uppy/aws-s3')

const uppy = Uppy({
  debug: true
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body',
  metaFields: [
      { id: 'name', name: 'Name', placeholder: 'file name' },
      { id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' }
    ],
})

uppy.use(AwsS3, {
  getUploadParameters (file) {
    file_name =  window.email + '/' + file.name;
    if (window.confirm('Please double check if the file you are uploading has a UUID!\n\nIf you click "ok" you would be redirected to a UUID instruction page. Cancel will ask you to retry.') && (reminded == 0)) {
        window.location.href='https://github.com/braingeneers/internal';
    } else if (reminded == 1) {
      reminded = 0;
      return fetch('/s3-sign.php', { // Send a request to our PHP signing endpoint.
        method: 'post',
        headers: { // Send and receive JSON.
          accept: 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          filename: file_name,
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
    } else {
      reminded = 1;
    }
  }
})
