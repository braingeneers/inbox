function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var Uppy = require('@uppy/core');

var has = require('@uppy/utils/lib/hasProperty');

var eventNames = {
  // File management events
  onFileAdded: 'file-added',
  onFileRemoved: 'file-removed',
  // Transloadit events
  onImportError: 'transloadit:import-error',
  onAssemblyCreated: 'transloadit:assembly-created',
  onAssemblyExecuting: 'transloadit:assembly-executing',
  onAssemblyError: 'transloadit:assembly-error',
  onAssemblyComplete: 'transloadit:complete',
  onResult: 'transloadit:result',
  // Upload events
  onStart: 'upload',
  onPause: 'pause-all',
  onFilePause: 'upload-pause',
  onCancel: 'cancel-all',
  onError: 'error',
  // mostly akin to promise rejection
  onFileCancel: 'upload-cancel',
  onFileProgress: 'upload-progress',
  onFileError: 'upload-error',
  onUploaded: 'transloadit:upload',
  onComplete: 'complete' // mostly akin to promise resolution

};
var uppyOptionNames = ['autoProceed', 'restrictions', 'meta', 'onBeforeFileAdded', 'onBeforeUpload', 'debug'];

function createUppy(opts, overrides) {
  if (overrides === void 0) {
    overrides = {};
  }

  var uppyOptions = {};
  uppyOptionNames.forEach(function (name) {
    if (has(opts, name)) uppyOptions[name] = opts[name];
  });

  _extends(uppyOptions, overrides);

  var uppy = Uppy(uppyOptions); // Builtin event aliases

  Object.keys(eventNames).forEach(function (optionName) {
    var eventName = eventNames[optionName];

    if (typeof opts[optionName] === 'function') {
      uppy.on(eventName, opts[optionName]);
    }
  }); // Custom events (these should probably be added to core)

  if (typeof opts.onProgress === 'function') {
    uppy.on('upload-progress', function () {
      var _uppy$getState = uppy.getState(),
          totalProgress = _uppy$getState.totalProgress;

      opts.onProgress.call(uppy, totalProgress);
    });
  }

  return uppy;
}

module.exports = createUppy;