function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var MB = 1024 * 1024;
var defaultOptions = {
  limit: 1,
  onStart: function onStart() {},
  onProgress: function onProgress() {},
  onPartComplete: function onPartComplete() {},
  onSuccess: function onSuccess() {},
  onError: function onError(err) {
    throw err;
  }
};

function remove(arr, el) {
  var i = arr.indexOf(el);
  if (i !== -1) arr.splice(i, 1);
}

var MultipartUploader = /*#__PURE__*/function () {
  function MultipartUploader(file, options) {
    this.options = _extends({}, defaultOptions, {}, options);
    this.file = file;
    this.key = this.options.key || null;
    this.uploadId = this.options.uploadId || null;
    this.parts = this.options.parts || []; // Do `this.createdPromise.then(OP)` to execute an operation `OP` _only_ if the
    // upload was created already. That also ensures that the sequencing is right
    // (so the `OP` definitely happens if the upload is created).
    //
    // This mostly exists to make `_abortUpload` work well: only sending the abort request if
    // the upload was already created, and if the createMultipartUpload request is still in flight,
    // aborting it immediately after it finishes.

    this.createdPromise = Promise.reject(); // eslint-disable-line prefer-promise-reject-errors

    this.isPaused = false;
    this.chunks = null;
    this.chunkState = null;
    this.uploading = [];

    this._initChunks();

    this.createdPromise.catch(function () {}); // silence uncaught rejection warning
  }

  var _proto = MultipartUploader.prototype;

  _proto._initChunks = function _initChunks() {
    var chunks = [];
    var chunkSize = Math.max(Math.ceil(this.file.size / 10000), 5 * MB);

    for (var i = 0; i < this.file.size; i += chunkSize) {
      var end = Math.min(this.file.size, i + chunkSize);
      chunks.push(this.file.slice(i, end));
    }

    this.chunks = chunks;
    this.chunkState = chunks.map(function () {
      return {
        uploaded: 0,
        busy: false,
        done: false
      };
    });
  };

  _proto._createUpload = function _createUpload() {
    var _this = this;

    this.createdPromise = Promise.resolve().then(function () {
      return _this.options.createMultipartUpload();
    });
    return this.createdPromise.then(function (result) {
      var valid = typeof result === 'object' && result && typeof result.uploadId === 'string' && typeof result.key === 'string';

      if (!valid) {
        throw new TypeError('AwsS3/Multipart: Got incorrect result from `createMultipartUpload()`, expected an object `{ uploadId, key }`.');
      }

      _this.key = result.key;
      _this.uploadId = result.uploadId;

      _this.options.onStart(result);

      _this._uploadParts();
    }).catch(function (err) {
      _this._onError(err);
    });
  };

  _proto._resumeUpload = function _resumeUpload() {
    var _this2 = this;

    return Promise.resolve().then(function () {
      return _this2.options.listParts({
        uploadId: _this2.uploadId,
        key: _this2.key
      });
    }).then(function (parts) {
      parts.forEach(function (part) {
        var i = part.PartNumber - 1;
        _this2.chunkState[i] = {
          uploaded: part.Size,
          etag: part.ETag,
          done: true
        }; // Only add if we did not yet know about this part.

        if (!_this2.parts.some(function (p) {
          return p.PartNumber === part.PartNumber;
        })) {
          _this2.parts.push({
            PartNumber: part.PartNumber,
            ETag: part.ETag
          });
        }
      });

      _this2._uploadParts();
    }).catch(function (err) {
      _this2._onError(err);
    });
  };

  _proto._uploadParts = function _uploadParts() {
    var _this3 = this;

    if (this.isPaused) return;
    var need = this.options.limit - this.uploading.length;
    if (need === 0) return; // All parts are uploaded.

    if (this.chunkState.every(function (state) {
      return state.done;
    })) {
      this._completeUpload();

      return;
    }

    var candidates = [];

    for (var i = 0; i < this.chunkState.length; i++) {
      var state = this.chunkState[i];
      if (state.done || state.busy) continue;
      candidates.push(i);

      if (candidates.length >= need) {
        break;
      }
    }

    candidates.forEach(function (index) {
      _this3._uploadPart(index);
    });
  };

  _proto._uploadPart = function _uploadPart(index) {
    var _this4 = this;

    var body = this.chunks[index];
    this.chunkState[index].busy = true;
    return Promise.resolve().then(function () {
      return _this4.options.prepareUploadPart({
        key: _this4.key,
        uploadId: _this4.uploadId,
        body: body,
        number: index + 1
      });
    }).then(function (result) {
      var valid = typeof result === 'object' && result && typeof result.url === 'string';

      if (!valid) {
        throw new TypeError('AwsS3/Multipart: Got incorrect result from `prepareUploadPart()`, expected an object `{ url }`.');
      }

      return result;
    }).then(function (_ref) {
      var url = _ref.url,
          headers = _ref.headers;

      _this4._uploadPartBytes(index, url, headers);
    }, function (err) {
      _this4._onError(err);
    });
  };

  _proto._onPartProgress = function _onPartProgress(index, sent, total) {
    this.chunkState[index].uploaded = sent;
    var totalUploaded = this.chunkState.reduce(function (n, c) {
      return n + c.uploaded;
    }, 0);
    this.options.onProgress(totalUploaded, this.file.size);
  };

  _proto._onPartComplete = function _onPartComplete(index, etag) {
    this.chunkState[index].etag = etag;
    this.chunkState[index].done = true;
    var part = {
      PartNumber: index + 1,
      ETag: etag
    };
    this.parts.push(part);
    this.options.onPartComplete(part);

    this._uploadParts();
  };

  _proto._uploadPartBytes = function _uploadPartBytes(index, url, headers) {
    var _this5 = this;

    var body = this.chunks[index];
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);

    if (headers) {
      Object.keys(headers).map(function (key) {
        xhr.setRequestHeader(key, headers[key]);
      });
    }

    xhr.responseType = 'text';
    this.uploading.push(xhr);
    xhr.upload.addEventListener('progress', function (ev) {
      if (!ev.lengthComputable) return;

      _this5._onPartProgress(index, ev.loaded, ev.total);
    });
    xhr.addEventListener('abort', function (ev) {
      remove(_this5.uploading, ev.target);
      _this5.chunkState[index].busy = false;
    });
    xhr.addEventListener('load', function (ev) {
      remove(_this5.uploading, ev.target);
      _this5.chunkState[index].busy = false;

      if (ev.target.status < 200 || ev.target.status >= 300) {
        _this5._onError(new Error('Non 2xx'));

        return;
      }

      _this5._onPartProgress(index, body.size, body.size); // NOTE This must be allowed by CORS.


      var etag = ev.target.getResponseHeader('ETag');

      if (etag === null) {
        _this5._onError(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. Seee https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'));

        return;
      }

      _this5._onPartComplete(index, etag);
    });
    xhr.addEventListener('error', function (ev) {
      remove(_this5.uploading, ev.target);
      _this5.chunkState[index].busy = false;
      var error = new Error('Unknown error');
      error.source = ev.target;

      _this5._onError(error);
    });
    xhr.send(body);
  };

  _proto._completeUpload = function _completeUpload() {
    var _this6 = this;

    // Parts may not have completed uploading in sorted order, if limit > 1.
    this.parts.sort(function (a, b) {
      return a.PartNumber - b.PartNumber;
    });
    return Promise.resolve().then(function () {
      return _this6.options.completeMultipartUpload({
        key: _this6.key,
        uploadId: _this6.uploadId,
        parts: _this6.parts
      });
    }).then(function (result) {
      _this6.options.onSuccess(result);
    }, function (err) {
      _this6._onError(err);
    });
  };

  _proto._abortUpload = function _abortUpload() {
    var _this7 = this;

    this.uploading.slice().forEach(function (xhr) {
      xhr.abort();
    });
    this.createdPromise.then(function () {
      _this7.options.abortMultipartUpload({
        key: _this7.key,
        uploadId: _this7.uploadId
      });
    }, function () {// if the creation failed we do not need to abort
    });
    this.uploading = [];
  };

  _proto._onError = function _onError(err) {
    this.options.onError(err);
  };

  _proto.start = function start() {
    this.isPaused = false;

    if (this.uploadId) {
      this._resumeUpload();
    } else {
      this._createUpload();
    }
  };

  _proto.pause = function pause() {
    var inProgress = this.uploading.slice();
    inProgress.forEach(function (xhr) {
      xhr.abort();
    });
    this.isPaused = true;
  };

  _proto.abort = function abort(opts) {
    if (opts === void 0) {
      opts = {};
    }

    var really = opts.really || false;
    if (!really) return this.pause();

    this._abortUpload();
  };

  return MultipartUploader;
}();

module.exports = MultipartUploader;