function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var toArray = require('@uppy/utils/lib/toArray');

var findDOMElement = require('@uppy/utils/lib/findDOMElement');
/**
 * Add files from existing file inputs to Uppy.
 */


var AttachFileInputs = /*#__PURE__*/function (_Plugin) {
  _inheritsLoose(AttachFileInputs, _Plugin);

  function AttachFileInputs(uppy, opts) {
    var _this;

    _this = _Plugin.call(this, uppy, opts) || this;
    _this.id = _this.opts.id || 'AttachFileInputs';
    _this.type = 'acquirer';
    _this.handleChange = _this.handleChange.bind(_assertThisInitialized(_this));
    _this.inputs = null;
    return _this;
  }

  var _proto = AttachFileInputs.prototype;

  _proto.handleChange = function handleChange(event) {
    this.addFiles(event.target);
  };

  _proto.addFiles = function addFiles(input) {
    var _this2 = this;

    var files = toArray(input.files);
    files.forEach(function (file) {
      try {
        _this2.uppy.addFile({
          source: _this2.id,
          name: file.name,
          type: file.type,
          data: file
        });
      } catch (err) {
        if (!err.isRestriction) {
          _this2.uppy.log(err);
        }
      }
    });
  };

  _proto.install = function install() {
    var _this3 = this;

    this.el = findDOMElement(this.opts.target);

    if (!this.el) {
      throw new Error('[AttachFileInputs] Target form does not exist');
    }

    var restrictions = this.uppy.opts.restrictions;
    this.inputs = this.el.querySelectorAll('input[type="file"]');
    this.inputs.forEach(function (input) {
      input.addEventListener('change', _this3.handleChange);

      if (!input.hasAttribute('multiple')) {
        if (restrictions.maxNumberOfFiles !== 1) {
          input.setAttribute('multiple', 'multiple');
        } else {
          input.removeAttribute('multiple');
        }
      }

      if (!input.hasAttribute('accept') && restrictions.allowedFileTypes) {
        input.setAttribute('accept', restrictions.allowedFileTypes.join(','));
      } // Check if this input already contains files (eg. user selected them before Uppy loaded,
      // or the page was refreshed and the browser kept files selected)


      _this3.addFiles(input);
    });
  };

  _proto.uninstall = function uninstall() {
    var _this4 = this;

    this.inputs.forEach(function (input) {
      input.removeEventListener('change', _this4.handleChange);
    });
    this.inputs = null;
  };

  return AttachFileInputs;
}(Plugin);

module.exports = AttachFileInputs;