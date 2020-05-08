function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var Dashboard = require('@uppy/dashboard');

var has = require('@uppy/utils/lib/hasProperty');

var dashboardOptionNames = ['metaFields', 'width', 'height', 'thumbnailWidth', 'showLinkToFileUploadResult', 'showProgressDetails', 'hideRetryButton', 'hidePauseResumeCancelButtons', 'hideUploadButton', 'hideProgressAfterFinish', 'note', 'disableStatusBar', 'disableInformer', 'disableThumbnailGenerator', 'showSelectedFiles', 'proudlyDisplayPoweredByUppy', 'theme'];
var modalDashboardOptionNames = ['trigger', 'closeModalOnClickOutside', 'closeAfterFinish', 'disablePageScrollWhenModalOpen', 'animateOpenClose', 'onRequestCloseModal', 'browserBackButtonClose'];

function addDashboardPlugin(uppy, opts, overrideOpts) {
  var dashboardOpts = {};
  dashboardOptionNames.forEach(function (key) {
    if (has(opts, key)) {
      dashboardOpts[key] = opts[key];
    }
  });
  var inline = overrideOpts.inline == null ? dashboardOpts.inline : overrideOpts.inline;

  if (!inline) {
    modalDashboardOptionNames.forEach(function (key) {
      if (has(opts, key)) {
        dashboardOpts[key] = opts[key];
      }
    });
  }

  uppy.use(Dashboard, _extends({}, dashboardOpts, {}, overrideOpts));
}

module.exports = addDashboardPlugin;