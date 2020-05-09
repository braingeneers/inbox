var _require = require('preact'),
    h = _require.h;

var copyToClipboard = require('../../../utils/copyToClipboard');

var _require2 = require('../../icons'),
    iconPencil = _require2.iconPencil,
    iconCross = _require2.iconCross,
    iconCopyLink = _require2.iconCopyLink;

function EditButton(_ref) {
  var file = _ref.file,
      uploadInProgressOrComplete = _ref.uploadInProgressOrComplete,
      metaFields = _ref.metaFields,
      i18n = _ref.i18n,
      onClick = _ref.onClick;

  if (!uploadInProgressOrComplete && metaFields && metaFields.length > 0) {
    return h("button", {
      class: "uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--edit",
      type: "button",
      "aria-label": i18n('editFile') + ' ' + file.meta.name,
      title: i18n('editFile'),
      onclick: function onclick() {
        return onClick();
      }
    }, iconPencil());
  }

  return null;
}

function RemoveButton(_ref2) {
  var i18n = _ref2.i18n,
      onClick = _ref2.onClick;
  return h("button", {
    class: "uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--remove",
    type: "button",
    "aria-label": i18n('removeFile'),
    title: i18n('removeFile'),
    onclick: function onclick() {
      return onClick();
    }
  }, iconCross());
}

var copyLinkToClipboard = function copyLinkToClipboard(event, props) {
  return copyToClipboard(props.file.uploadURL, props.i18n('copyLinkToClipboardFallback')).then(function () {
    props.log('Link copied to clipboard.');
    props.info(props.i18n('copyLinkToClipboardSuccess'), 'info', 3000);
  }).catch(props.log) // avoid losing focus
  .then(function () {
    return event.target.focus({
      preventScroll: true
    });
  });
};

function CopyLinkButton(props) {
  return h("button", {
    class: "uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--copyLink",
    type: "button",
    "aria-label": props.i18n('copyLink'),
    title: props.i18n('copyLink'),
    onclick: function onclick(event) {
      return copyLinkToClipboard(event, props);
    }
  }, iconCopyLink());
}

module.exports = function Buttons(props) {
  var file = props.file,
      uploadInProgressOrComplete = props.uploadInProgressOrComplete,
      metaFields = props.metaFields,
      showLinkToFileUploadResult = props.showLinkToFileUploadResult,
      showRemoveButton = props.showRemoveButton,
      i18n = props.i18n,
      removeFile = props.removeFile,
      toggleFileCard = props.toggleFileCard;
  return h("div", {
    className: "uppy-DashboardItem-actionWrapper"
  }, h(EditButton, {
    i18n: i18n,
    file: file,
    uploadInProgressOrComplete: uploadInProgressOrComplete,
    metaFields: metaFields,
    onClick: function onClick() {
      return toggleFileCard(file.id);
    }
  }), showLinkToFileUploadResult && file.uploadURL ? h(CopyLinkButton, {
    i18n: i18n
  }) : null, showRemoveButton ? h(RemoveButton, {
    i18n: i18n,
    info: props.info,
    log: props.log,
    onClick: function onClick() {
      return removeFile(file.id);
    }
  }) : null);
};