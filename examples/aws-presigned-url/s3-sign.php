<?php
//https://community.transloadit.com/t/aws-s3-issues-with-uppy/14941
require 'vendor/autoload.php';
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: GET");

// PRP Testing
// CONFIG: Change these variables to a valid region and bucket.
$awsEndpoint = null;
$awsRegion = 'us-west-2';
$bucket = '';
// Directory to place uploaded files in.
$directory = 's3.nautilus.optiputer.net/braingeneers-inbox';
// Create the S3 client.
$s3 = new Aws\S3\S3Client([
  'version' => 'latest',
  'endpoint' => $awsEndpoint,
  'region' => $awsRegion,
  'credentials' => [
      'key'    => '0CYGQI2EE9TE4YRWVIIW',
      'secret' => 'swYRfkEuVcHoP4LoB4c6eQgn0GIcAaW7SUBYl4T5',
  ],
]);

// AWS S3 Testing
// CONFIG: Change these variables to a valid region and bucket.
// $awsEndpoint = getenv('COMPANION_AWS_ENDPOINT') ?: null;
// $awsRegion = 'us-west-2';
// $bucket =  'braingeneers-inbox';
// // Directory to place uploaded files in.
// $directory = 'eajung@ucsc.edu';
// //Create the S3 client.
// $s3 = new Aws\S3\S3Client([
//   'version' => 'latest',
//   'endpoint' => $awsEndpoint,
//   'region' => $awsRegion,
//   'credentials' => [
//           'key'    => 'AKIAWOWG5LJFPBRYRQMF',
//           'secret' => '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',
//       ],
// ]);


// Retrieve data about the file to be uploaded from the request body.
$body = json_decode(file_get_contents('php://input'));
$filename = $body->filename;
$contentType = $body->contentType;

// Prepare a PutObject command.
$command = $s3->getCommand('putObject', [
  'Bucket' => $bucket,
  'Key' => "{$directory}/{$filename}",
  'ContentType' => $contentType,
  'Body' => '',
]);

$request = $s3->createPresignedRequest($command, '+5 minutes');
header('content-type: application/json');
echo json_encode([
  'method' => $request->getMethod(),
  'url' => (string) $request->getUri(),
  'fields' => [],
  // Also set the content-type header on the request, to make sure that it is the same as the one we used to generate the signature.
  // Else, the browser picks a content-type as it sees fit.
  'headers' => [
    'content-type' => $contentType,
  ],
]);
