function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;
/**
 * Add a `results` key to the upload result data, containing all Transloadit Assembly results.
 */


var TransloaditResultsPlugin = /*#__PURE__*/function (_Plugin) {
  _inheritsLoose(TransloaditResultsPlugin, _Plugin);

  function TransloaditResultsPlugin(uppy, opts) {
    var _this;

    _this = _Plugin.call(this, uppy, opts) || this;
    _this.type = 'modifier';
    _this.id = _this.opts.id || 'TransloaditResultsPlugin';
    _this._afterUpload = _this._afterUpload.bind(_assertThisInitialized(_this));
    return _this;
  }

  var _proto = TransloaditResultsPlugin.prototype;

  _proto.install = function install() {
    this.uppy.addPostProcessor(this._afterUpload);
  };

  _proto._afterUpload = function _afterUpload(fileIDs, uploadID) {
    var _this$uppy$getState = this.uppy.getState(),
        currentUploads = _this$uppy$getState.currentUploads;

    var result = currentUploads[uploadID].result;
    var assemblies = result && Array.isArray(result.transloadit) ? result.transloadit : []; // Merge the assembly.results[*] arrays and add `stepName` and
    // `assemblyId` properties.

    var assemblyResults = [];
    assemblies.forEach(function (assembly) {
      Object.keys(assembly.results).forEach(function (stepName) {
        var results = assembly.results[stepName];
        results.forEach(function (result) {
          assemblyResults.push(_extends({}, result, {
            assemblyId: assembly.assembly_id,
            stepName: stepName
          }));
        });
      });
    });
    this.uppy.addResultData(uploadID, {
      results: assemblyResults
    });
  };

  return TransloaditResultsPlugin;
}(Plugin);

module.exports = TransloaditResultsPlugin;