import Uppy = require('@uppy/core')

type StatusBarLocale = Uppy.Locale<
  | 'uploading'
  | 'upload'
  | 'complete'
  | 'uploadFailed'
  | 'paused'
  | 'retry'
  | 'cancel'
  | 'pause'
  | 'resume'
  | 'filesUploadedOfTotal'
  | 'dataUploadedOfTotal'
  | 'xTimeLeft'
  | 'uploadXFiles'
  | 'uploadXNewFiles'
  | 'xMoreFilesAdded'
>

export = StatusBarLocale
