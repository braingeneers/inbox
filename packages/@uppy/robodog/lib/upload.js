var toArray = require('@uppy/utils/lib/toArray');

var createUppy = require('./createUppy');

var addTransloaditPlugin = require('./addTransloaditPlugin');

function upload(files, opts) {
  if (opts === void 0) {
    opts = {};
  }

  if (!Array.isArray(files) && typeof files.length === 'number') {
    files = toArray(files);
  }

  var uppy = createUppy(opts, {
    allowMultipleUploads: false
  });
  addTransloaditPlugin(uppy, opts);
  files.forEach(function (file) {
    uppy.addFile({
      data: file,
      type: file.type,
      name: file.name,
      meta: file.meta || {}
    });
  });
  return uppy.upload();
}

module.exports = upload;