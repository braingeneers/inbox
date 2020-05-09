import Uppy = require('@uppy/core')

type WebcamLocale = Uppy.Locale<
  | 'smile'
  | 'takePicture'
  | 'startRecording'
  | 'stopRecording'
  | 'allowAccessTitle'
  | 'allowAccessDescription'
  | 'recordingStoppedMaxSize'
  | 'recordingLength'
>

export = WebcamLocale
