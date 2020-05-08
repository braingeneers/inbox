function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var createUppy = require('./createUppy');

var addDashboardPlugin = require('./addDashboardPlugin');

var addTransloaditPlugin = require('./addTransloaditPlugin');

var addProviders = require('./addProviders');

var CANCEL = {};

function pick(opts) {
  if (opts === void 0) {
    opts = {};
  }

  var target = opts.target || document.body;
  var pluginId = 'pick';
  var uppy = createUppy(opts, {
    allowMultipleUploads: false
  });
  addTransloaditPlugin(uppy, opts);
  addDashboardPlugin(uppy, opts, {
    id: pluginId,
    target: target,
    closeAfterFinish: true
  });

  if (Array.isArray(opts.providers)) {
    addProviders(uppy, opts.providers, _extends({}, opts, {
      // Install providers into the Dashboard.
      target: uppy.getPlugin(pluginId)
    }));
  }

  return new Promise(function (resolve, reject) {
    uppy.on('complete', function (result) {
      if (result.failed.length === 0) {
        resolve(result);
      }
    });
    uppy.on('error', reject);
    uppy.on('cancel-all', function () {
      return reject(CANCEL);
    });
    uppy.getPlugin(pluginId).openModal();
  }).then(function (result) {
    return result;
  }, function (err) {
    if (err === CANCEL) {
      uppy.getPlugin(pluginId).requestCloseModal();
      return null;
    }

    throw err;
  });
}

module.exports = pick;