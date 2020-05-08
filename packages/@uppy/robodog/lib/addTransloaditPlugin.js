var Transloadit = require('@uppy/transloadit');

var has = require('@uppy/utils/lib/hasProperty');

var TransloaditResults = require('./TransloaditResultsPlugin');

var transloaditOptionNames = ['service', 'waitForEncoding', 'waitForMetadata', 'alwaysRunAssembly', 'importFromUploadURLs', 'signature', 'params', 'fields', 'getAssemblyOptions'];

function addTransloaditPlugin(uppy, opts) {
  var transloaditOptions = {};
  transloaditOptionNames.forEach(function (name) {
    if (has(opts, name)) transloaditOptions[name] = opts[name];
  });
  uppy.use(Transloadit, transloaditOptions); // Adds a `results` key to the upload result data containing a flat array of all results from all Assemblies.

  if (transloaditOptions.waitForEncoding) {
    uppy.use(TransloaditResults);
  }
}

module.exports = addTransloaditPlugin;