function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var React = require('react');

var DragDropPlugin = require('@uppy/drag-drop');

var propTypes = require('./propTypes');

var h = React.createElement;
/**
 * React component that renders an area in which files can be dropped to be
 * uploaded.
 */

var DragDrop = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(DragDrop, _React$Component);

  function DragDrop() {
    return _React$Component.apply(this, arguments) || this;
  }

  var _proto = DragDrop.prototype;

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
    var uppy = this.props.uppy;

    var options = _extends({
      id: 'react:DragDrop'
    }, this.props, {
      target: this.container
    });

    delete options.uppy;
    uppy.use(DragDropPlugin, options);
    this.plugin = uppy.getPlugin(options.id);
  };

  _proto.uninstallPlugin = function uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }

    var uppy = props.uppy;
    uppy.removePlugin(this.plugin);
  };

  _proto.render = function render() {
    var _this = this;

    return h('div', {
      ref: function ref(container) {
        _this.container = container;
      }
    });
  };

  return DragDrop;
}(React.Component);

DragDrop.propTypes = {
  uppy: propTypes.uppy,
  locale: propTypes.locale
};
DragDrop.defaultProps = {};
module.exports = DragDrop;