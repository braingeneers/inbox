const { h } = require('preact')

/**
 * Control screen capture recording. Will show record or stop button.
 */
module.exports = function RecordButton ({ recording, onStartRecording, onStopRecording, i18n }) {
  if (recording) {
    return (
      <button
        class="uppy-u-reset uppy-c-btn uppy-ScreenCapture-button uppy-ScreenCapture-button--video uppy-ScreenCapture-button--stop-rec"
        type="button"
        title={i18n('stopRecording')}
        aria-label={i18n('stopRecording')}
        onclick={onStopRecording}
        data-uppy-super-focusable
      >
        <svg aria-hidden="true" focusable="false" class="UppyIcon" width="100" height="100" viewBox="0 0 100 100">
          <rect x="15" y="15" width="70" height="70" />
        </svg>
      </button>
    )
  }

  return (
    <button
      class="uppy-u-reset uppy-c-btn uppy-ScreenCapture-button uppy-ScreenCapture-button--video"
      type="button"
      title={i18n('startCapturing')}
      aria-label={i18n('stopCapturing')}
      onclick={onStartRecording}
      data-uppy-super-focusable
    >
      <svg aria-hidden="true" focusable="false" class="UppyIcon" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" />
      </svg>
    </button>
  )
}
