var _class, _temp;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var _require = require('preact'),
    h = _require.h;

var _require2 = require('@uppy/core'),
    Plugin = _require2.Plugin;

var Translator = require('@uppy/utils/lib/Translator');

var getFileTypeExtension = require('@uppy/utils/lib/getFileTypeExtension');

var mimeTypes = require('@uppy/utils/lib/mimeTypes');

var canvasToBlob = require('@uppy/utils/lib/canvasToBlob');

var supportsMediaRecorder = require('./supportsMediaRecorder');

var CameraIcon = require('./CameraIcon');

var CameraScreen = require('./CameraScreen');

var PermissionsScreen = require('./PermissionsScreen');
/**
 * Normalize a MIME type or file extension into a MIME type.
 *
 * @param {string} fileType - MIME type or a file extension prefixed with `.`.
 * @returns {string|undefined} The MIME type or `undefined` if the fileType is an extension and is not known.
 */


function toMimeType(fileType) {
  if (fileType[0] === '.') {
    return mimeTypes[fileType.slice(1)];
  }

  return fileType;
}
/**
 * Is this MIME type a video?
 *
 * @param {string} mimeType - MIME type.
 * @returns {boolean}
 */


function isVideoMimeType(mimeType) {
  return /^video\/[^*]+$/.test(mimeType);
}
/**
 * Is this MIME type an image?
 *
 * @param {string} mimeType - MIME type.
 * @returns {boolean}
 */


function isImageMimeType(mimeType) {
  return /^image\/[^*]+$/.test(mimeType);
}
/**
 * Setup getUserMedia, with polyfill for older browsers
 * Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */


function getMediaDevices() {
  // eslint-disable-next-line compat/compat
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // eslint-disable-next-line compat/compat
    return navigator.mediaDevices;
  }

  var _getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

  if (!_getUserMedia) {
    return null;
  }

  return {
    getUserMedia: function getUserMedia(opts) {
      return new Promise(function (resolve, reject) {
        _getUserMedia.call(navigator, opts, resolve, reject);
      });
    }
  };
}
/**
 * Webcam
 */


module.exports = (_temp = _class = /*#__PURE__*/function (_Plugin) {
  _inheritsLoose(Webcam, _Plugin);

  function Webcam(uppy, opts) {
    var _this;

    _this = _Plugin.call(this, uppy, opts) || this;
    _this.mediaDevices = getMediaDevices();
    _this.supportsUserMedia = !!_this.mediaDevices;
    _this.protocol = location.protocol.match(/https/i) ? 'https' : 'http';
    _this.id = _this.opts.id || 'Webcam';
    _this.title = _this.opts.title || 'Camera';
    _this.type = 'acquirer';

    _this.icon = function () {
      return h("svg", {
        "aria-hidden": "true",
        focusable: "false",
        width: "32",
        height: "32",
        viewBox: "0 0 32 32",
        xmlns: "http://www.w3.org/2000/svg"
      }, h("g", {
        fill: "none",
        "fill-rule": "evenodd"
      }, h("rect", {
        fill: "#03BFEF",
        width: "32",
        height: "32",
        rx: "16"
      }), h("path", {
        d: "M22 11c1.133 0 2 .867 2 2v7.333c0 1.134-.867 2-2 2H10c-1.133 0-2-.866-2-2V13c0-1.133.867-2 2-2h2.333l1.134-1.733C13.6 9.133 13.8 9 14 9h4c.2 0 .4.133.533.267L19.667 11H22zm-6 1.533a3.764 3.764 0 0 0-3.8 3.8c0 2.129 1.672 3.801 3.8 3.801s3.8-1.672 3.8-3.8c0-2.13-1.672-3.801-3.8-3.801zm0 6.261c-1.395 0-2.46-1.066-2.46-2.46 0-1.395 1.065-2.461 2.46-2.461s2.46 1.066 2.46 2.46c0 1.395-1.065 2.461-2.46 2.461z",
        fill: "#FFF",
        "fill-rule": "nonzero"
      })));
    };

    _this.defaultLocale = {
      strings: {
        smile: 'Smile!',
        takePicture: 'Take a picture',
        startRecording: 'Begin video recording',
        stopRecording: 'Stop video recording',
        allowAccessTitle: 'Please allow access to your camera',
        allowAccessDescription: 'In order to take pictures or record video with your camera, please allow camera access for this site.',
        recordingStoppedMaxSize: 'Recording stopped because the file size is about to exceed the limit',
        recordingLength: 'Recording length %{recording_length}'
      }
    }; // set default options

    var defaultOptions = {
      onBeforeSnapshot: function onBeforeSnapshot() {
        return Promise.resolve();
      },
      countdown: false,
      modes: ['video-audio', 'video-only', 'audio-only', 'picture'],
      mirror: true,
      facingMode: 'user',
      preferredImageMimeType: null,
      preferredVideoMimeType: null,
      showRecordingLength: false
    };
    _this.opts = _extends({}, defaultOptions, {}, opts);

    _this.i18nInit();

    _this.install = _this.install.bind(_assertThisInitialized(_this));
    _this.setPluginState = _this.setPluginState.bind(_assertThisInitialized(_this));
    _this.render = _this.render.bind(_assertThisInitialized(_this)); // Camera controls

    _this._start = _this._start.bind(_assertThisInitialized(_this));
    _this._stop = _this._stop.bind(_assertThisInitialized(_this));
    _this._takeSnapshot = _this._takeSnapshot.bind(_assertThisInitialized(_this));
    _this._startRecording = _this._startRecording.bind(_assertThisInitialized(_this));
    _this._stopRecording = _this._stopRecording.bind(_assertThisInitialized(_this));
    _this._oneTwoThreeSmile = _this._oneTwoThreeSmile.bind(_assertThisInitialized(_this));
    _this._focus = _this._focus.bind(_assertThisInitialized(_this));
    _this.webcamActive = false;

    if (_this.opts.countdown) {
      _this.opts.onBeforeSnapshot = _this._oneTwoThreeSmile;
    }

    return _this;
  }

  var _proto = Webcam.prototype;

  _proto.setOptions = function setOptions(newOpts) {
    _Plugin.prototype.setOptions.call(this, newOpts);

    this.i18nInit();
  };

  _proto.i18nInit = function i18nInit() {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale]);
    this.i18n = this.translator.translate.bind(this.translator);
    this.i18nArray = this.translator.translateArray.bind(this.translator);
    this.setPluginState(); // so that UI re-renders and we see the updated locale
  };

  _proto.isSupported = function isSupported() {
    return !!this.mediaDevices;
  };

  _proto.getConstraints = function getConstraints() {
    var acceptsAudio = this.opts.modes.indexOf('video-audio') !== -1 || this.opts.modes.indexOf('audio-only') !== -1;
    var acceptsVideo = this.opts.modes.indexOf('video-audio') !== -1 || this.opts.modes.indexOf('video-only') !== -1 || this.opts.modes.indexOf('picture') !== -1;
    return {
      audio: acceptsAudio,
      video: acceptsVideo ? {
        facingMode: this.opts.facingMode
      } : false
    };
  };

  _proto._start = function _start() {
    var _this2 = this;

    if (!this.isSupported()) {
      return Promise.reject(new Error('Webcam access not supported'));
    }

    this.webcamActive = true;
    var constraints = this.getConstraints(); // ask user for access to their camera

    return this.mediaDevices.getUserMedia(constraints).then(function (stream) {
      _this2.stream = stream; // this.streamSrc = URL.createObjectURL(this.stream)

      _this2.setPluginState({
        cameraReady: true
      });
    }).catch(function (err) {
      _this2.setPluginState({
        cameraError: err
      });
    });
  }
  /**
   * @returns {object}
   */
  ;

  _proto._getMediaRecorderOptions = function _getMediaRecorderOptions() {
    var options = {}; // Try to use the `opts.preferredVideoMimeType` or one of the `allowedFileTypes` for the recording.
    // If the browser doesn't support it, we'll fall back to the browser default instead.
    // Safari doesn't have the `isTypeSupported` API.

    if (MediaRecorder.isTypeSupported) {
      var restrictions = this.uppy.opts.restrictions;
      var preferredVideoMimeTypes = [];

      if (this.opts.preferredVideoMimeType) {
        preferredVideoMimeTypes = [this.opts.preferredVideoMimeType];
      } else if (restrictions.allowedFileTypes) {
        preferredVideoMimeTypes = restrictions.allowedFileTypes.map(toMimeType).filter(isVideoMimeType);
      }

      var acceptableMimeTypes = preferredVideoMimeTypes.filter(function (candidateType) {
        return MediaRecorder.isTypeSupported(candidateType) && getFileTypeExtension(candidateType);
      });

      if (acceptableMimeTypes.length > 0) {
        options.mimeType = acceptableMimeTypes[0];
      }
    }

    return options;
  };

  _proto._startRecording = function _startRecording() {
    var _this3 = this;

    this.recorder = new MediaRecorder(this.stream, this._getMediaRecorderOptions());
    this.recordingChunks = [];
    var stoppingBecauseOfMaxSize = false;
    this.recorder.addEventListener('dataavailable', function (event) {
      _this3.recordingChunks.push(event.data);

      var restrictions = _this3.uppy.opts.restrictions;

      if (_this3.recordingChunks.length > 1 && restrictions.maxFileSize != null && !stoppingBecauseOfMaxSize) {
        var totalSize = _this3.recordingChunks.reduce(function (acc, chunk) {
          return acc + chunk.size;
        }, 0); // Exclude the initial chunk from the average size calculation because it is likely to be a very small outlier


        var averageChunkSize = (totalSize - _this3.recordingChunks[0].size) / (_this3.recordingChunks.length - 1);
        var expectedEndChunkSize = averageChunkSize * 3;
        var maxSize = Math.max(0, restrictions.maxFileSize - expectedEndChunkSize);

        if (totalSize > maxSize) {
          stoppingBecauseOfMaxSize = true;

          _this3.uppy.info(_this3.i18n('recordingStoppedMaxSize'), 'warning', 4000);

          _this3._stopRecording();
        }
      }
    }); // use a "time slice" of 500ms: ondataavailable will be called each 500ms
    // smaller time slices mean we can more accurately check the max file size restriction

    this.recorder.start(500);

    if (this.opts.showRecordingLength) {
      // Start the recordingLengthTimer if we are showing the recording length.
      this.recordingLengthTimer = setInterval(function () {
        var currentRecordingLength = _this3.getPluginState().recordingLengthSeconds;

        _this3.setPluginState({
          recordingLengthSeconds: currentRecordingLength + 1
        });
      }, 1000);
    }

    this.setPluginState({
      isRecording: true
    });
  };

  _proto._stopRecording = function _stopRecording() {
    var _this4 = this;

    var stopped = new Promise(function (resolve, reject) {
      _this4.recorder.addEventListener('stop', function () {
        resolve();
      });

      _this4.recorder.stop();

      if (_this4.opts.showRecordingLength) {
        // Stop the recordingLengthTimer if we are showing the recording length.
        clearInterval(_this4.recordingLengthTimer);

        _this4.setPluginState({
          recordingLengthSeconds: 0
        });
      }
    });
    return stopped.then(function () {
      _this4.setPluginState({
        isRecording: false
      });

      return _this4.getVideo();
    }).then(function (file) {
      try {
        _this4.uppy.addFile(file);
      } catch (err) {
        // Logging the error, exept restrictions, which is handled in Core
        if (!err.isRestriction) {
          _this4.uppy.log(err);
        }
      }
    }).then(function () {
      _this4.recordingChunks = null;
      _this4.recorder = null;
    }, function (error) {
      _this4.recordingChunks = null;
      _this4.recorder = null;
      throw error;
    });
  };

  _proto._stop = function _stop() {
    this.stream.getAudioTracks().forEach(function (track) {
      track.stop();
    });
    this.stream.getVideoTracks().forEach(function (track) {
      track.stop();
    });
    this.webcamActive = false;
    this.stream = null;
  };

  _proto._getVideoElement = function _getVideoElement() {
    return this.el.querySelector('.uppy-Webcam-video');
  };

  _proto._oneTwoThreeSmile = function _oneTwoThreeSmile() {
    var _this5 = this;

    return new Promise(function (resolve, reject) {
      var count = _this5.opts.countdown;
      var countDown = setInterval(function () {
        if (!_this5.webcamActive) {
          clearInterval(countDown);
          _this5.captureInProgress = false;
          return reject(new Error('Webcam is not active'));
        }

        if (count > 0) {
          _this5.uppy.info(count + "...", 'warning', 800);

          count--;
        } else {
          clearInterval(countDown);

          _this5.uppy.info(_this5.i18n('smile'), 'success', 1500);

          setTimeout(function () {
            return resolve();
          }, 1500);
        }
      }, 1000);
    });
  };

  _proto._takeSnapshot = function _takeSnapshot() {
    var _this6 = this;

    if (this.captureInProgress) return;
    this.captureInProgress = true;
    this.opts.onBeforeSnapshot().catch(function (err) {
      var message = typeof err === 'object' ? err.message : err;

      _this6.uppy.info(message, 'error', 5000);

      return Promise.reject(new Error("onBeforeSnapshot: " + message));
    }).then(function () {
      return _this6._getImage();
    }).then(function (tagFile) {
      _this6.captureInProgress = false;

      try {
        _this6.uppy.addFile(tagFile);
      } catch (err) {
        // Logging the error, except restrictions, which is handled in Core
        if (!err.isRestriction) {
          _this6.uppy.log(err);
        }
      }
    }, function (error) {
      _this6.captureInProgress = false;
      throw error;
    });
  };

  _proto._getImage = function _getImage() {
    var _this7 = this;

    var video = this._getVideoElement();

    if (!video) {
      return Promise.reject(new Error('No video element found, likely due to the Webcam tab being closed.'));
    }

    var width = video.videoWidth;
    var height = video.videoHeight;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    var restrictions = this.uppy.opts.restrictions;
    var preferredImageMimeTypes = [];

    if (this.opts.preferredImageMimeType) {
      preferredImageMimeTypes = [this.opts.preferredImageMimeType];
    } else if (restrictions.allowedFileTypes) {
      preferredImageMimeTypes = restrictions.allowedFileTypes.map(toMimeType).filter(isImageMimeType);
    }

    var mimeType = preferredImageMimeTypes[0] || 'image/jpeg';
    var ext = getFileTypeExtension(mimeType) || 'jpg';
    var name = "cam-" + Date.now() + "." + ext;
    return canvasToBlob(canvas, mimeType).then(function (blob) {
      return {
        source: _this7.id,
        name: name,
        data: new Blob([blob], {
          type: mimeType
        }),
        type: mimeType
      };
    });
  };

  _proto.getVideo = function getVideo() {
    var mimeType = this.recordingChunks[0].type;
    var fileExtension = getFileTypeExtension(mimeType);

    if (!fileExtension) {
      return Promise.reject(new Error("Could not retrieve recording: Unsupported media type \"" + mimeType + "\""));
    }

    var name = "webcam-" + Date.now() + "." + fileExtension;
    var blob = new Blob(this.recordingChunks, {
      type: mimeType
    });
    var file = {
      source: this.id,
      name: name,
      data: new Blob([blob], {
        type: mimeType
      }),
      type: mimeType
    };
    return Promise.resolve(file);
  };

  _proto._focus = function _focus() {
    var _this8 = this;

    if (!this.opts.countdown) return;
    setTimeout(function () {
      _this8.uppy.info(_this8.i18n('smile'), 'success', 1500);
    }, 1000);
  };

  _proto.render = function render(state) {
    if (!this.webcamActive) {
      this._start();
    }

    var webcamState = this.getPluginState();

    if (!webcamState.cameraReady) {
      return h(PermissionsScreen, {
        icon: CameraIcon,
        i18n: this.i18n
      });
    }

    return h(CameraScreen, _extends({}, webcamState, {
      onSnapshot: this._takeSnapshot,
      onStartRecording: this._startRecording,
      onStopRecording: this._stopRecording,
      onFocus: this._focus,
      onStop: this._stop,
      i18n: this.i18n,
      modes: this.opts.modes,
      showRecordingLength: this.opts.showRecordingLength,
      supportsRecording: supportsMediaRecorder(),
      recording: webcamState.isRecording,
      mirror: this.opts.mirror,
      src: this.stream
    }));
  };

  _proto.install = function install() {
    this.setPluginState({
      cameraReady: false,
      recordingLengthSeconds: 0
    });
    var target = this.opts.target;

    if (target) {
      this.mount(target, this);
    }
  };

  _proto.uninstall = function uninstall() {
    if (this.stream) {
      this._stop();
    }

    this.unmount();
  };

  return Webcam;
}(Plugin), _class.VERSION = require('../package.json').version, _temp);