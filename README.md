# Uppy + AWS S3 Example

This example uses a server-side PHP endpoint to sign uploads to S3.

## Running It

To run this example, make sure you've correctly installed the **repository root**:
```bash
npm install
npm run build
```
That will also install the npm dependencies for this example.

This example also uses the AWS PHP SDK.
To install it, [get composer](https://getcomposer.org) and run `composer update` in **this** folder.

```bash
cd ./examples/aws-presigned-url
composer update
```

Then, again in the **repository root**, start this example for local testing by doing:
```bash
PORT=8000 npm run example aws-presigned-url
```

As simple as possible, but no simpler, browser based upload to S3

Originally inspired/cloned from [Uppy.io](https://uppy.io).
