function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var Transloadit = require('@uppy/transloadit');

var has = require('@uppy/utils/lib/hasProperty');

var remoteProviders = {
  dropbox: require('@uppy/dropbox'),
  'google-drive': require('@uppy/google-drive'),
  instagram: require('@uppy/instagram'),
  facebook: require('@uppy/facebook'),
  onedrive: require('@uppy/onedrive'),
  url: require('@uppy/url')
};
var localProviders = {
  webcam: require('@uppy/webcam')
};
var remoteProviderOptionNames = ['companionUrl', 'companionAllowedHosts', 'companionHeaders', 'serverHeaders', 'target']; // No shared options.

var localProviderOptionNames = ['target'];

function addRemoteProvider(uppy, name, opts) {
  var Provider = remoteProviders[name];
  var providerOptions = {
    // Default to the :tl: Companion servers.
    companionUrl: Transloadit.COMPANION,
    companionAllowedHosts: Transloadit.COMPANION_PATTERN
  };
  remoteProviderOptionNames.forEach(function (name) {
    if (has(opts, name)) providerOptions[name] = opts[name];
  }); // Apply overrides for a specific provider plugin.

  if (typeof opts[name] === 'object') {
    _extends(providerOptions, opts[name]);
  }

  uppy.use(Provider, providerOptions);
}

function addLocalProvider(uppy, name, opts) {
  var Provider = localProviders[name];
  var providerOptions = {};
  localProviderOptionNames.forEach(function (name) {
    if (has(opts, name)) providerOptions[name] = opts[name];
  }); // Apply overrides for a specific provider plugin.

  if (typeof opts[name] === 'object') {
    _extends(providerOptions, opts[name]);
  }

  uppy.use(Provider, providerOptions);
}

function addProviders(uppy, names, opts) {
  if (opts === void 0) {
    opts = {};
  }

  names.forEach(function (name) {
    if (has(remoteProviders, name)) {
      addRemoteProvider(uppy, name, opts);
    } else if (has(localProviders, name)) {
      addLocalProvider(uppy, name, opts);
    } else {
      var validNames = [].concat(Object.keys(remoteProviders), Object.keys(localProviders));
      var expectedNameString = validNames.sort().map(function (validName) {
        return "'" + validName + "'";
      }).join(', ');
      throw new Error("Unexpected provider '" + name + "', expected one of [" + expectedNameString + "]");
    }
  });
}

module.exports = addProviders;