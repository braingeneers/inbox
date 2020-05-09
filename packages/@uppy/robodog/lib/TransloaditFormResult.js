function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var findDOMElement = require('@uppy/utils/lib/findDOMElement');
/**
 * After an upload completes, inject result data from Transloadit in a hidden input.
 *
 * Must be added _after_ the Transloadit plugin.
 */


var TransloaditFormResult = /*#__PURE__*/function (_Plugin) {
  _inheritsLoose(TransloaditFormResult, _Plugin);

  function TransloaditFormResult(uppy, opts) {
    var _this;

    _this = _Plugin.call(this, uppy, opts) || this;
    _this.id = _this.opts.id || 'TransloaditFormResult';
    _this.type = 'modifier';
    _this.handleUpload = _this.handleUpload.bind(_assertThisInitialized(_this));
    return _this;
  }

  var _proto = TransloaditFormResult.prototype;

  _proto.getAssemblyStatuses = function getAssemblyStatuses(fileIDs) {
    var _this2 = this;

    var assemblyIds = [];
    fileIDs.forEach(function (fileID) {
      var file = _this2.uppy.getFile(fileID);

      var assembly = file.transloadit && file.transloadit.assembly;

      if (assembly && assemblyIds.indexOf(assembly) === -1) {
        assemblyIds.push(assembly);
      }
    });
    var tl = this.uppy.getPlugin(this.opts.transloaditPluginId || 'Transloadit');
    return assemblyIds.map(function (id) {
      return tl.getAssembly(id);
    });
  };

  _proto.handleUpload = function handleUpload(fileIDs) {
    var assemblies = this.getAssemblyStatuses(fileIDs);
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = this.opts.name;
    input.value = JSON.stringify(assemblies);
    var target = findDOMElement(this.opts.target);
    target.appendChild(input);
  };

  _proto.install = function install() {
    this.uppy.addPostProcessor(this.handleUpload);
  };

  _proto.uninstall = function uninstall() {
    this.uppy.removePostProcessor(this.handleUpload);
  };

  return TransloaditFormResult;
}(Plugin);

module.exports = TransloaditFormResult;