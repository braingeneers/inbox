function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var React = require('react');

var PropTypes = require('prop-types');

var uppyPropType = require('./propTypes').uppy;

var h = React.createElement;

var UppyWrapper = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(UppyWrapper, _React$Component);

  function UppyWrapper(props) {
    var _this;

    _this = _React$Component.call(this, props) || this;
    _this.refContainer = _this.refContainer.bind(_assertThisInitialized(_this));
    return _this;
  }

  var _proto = UppyWrapper.prototype;

  _proto.componentDidMount = function componentDidMount() {
    this.installPlugin();
  };

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps);
      this.installPlugin();
    }
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.uninstallPlugin();
  };

  _proto.installPlugin = function installPlugin() {
    var plugin = this.props.uppy.getPlugin(this.props.plugin);
    plugin.mount(this.container, plugin);
  };

  _proto.uninstallPlugin = function uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }

    var plugin = props.uppy.getPlugin(this.props.plugin);
    plugin.unmount();
  };

  _proto.refContainer = function refContainer(container) {
    this.container = container;
  };

  _proto.render = function render() {
    return h('div', {
      ref: this.refContainer
    });
  };

  return UppyWrapper;
}(React.Component);

UppyWrapper.propTypes = {
  uppy: uppyPropType,
  plugin: PropTypes.string.isRequired
};
module.exports = UppyWrapper;