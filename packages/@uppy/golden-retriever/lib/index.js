var _class, _temp;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var ServiceWorkerStore = require('./ServiceWorkerStore');

var IndexedDBStore = require('./IndexedDBStore');

var MetaDataStore = require('./MetaDataStore');
/**
 * The GoldenRetriever plugin — restores selected files and resumes uploads
 * after a closed tab or a browser crash!
 *
 * Uses localStorage, IndexedDB and ServiceWorker to do its magic, read more:
 * https://uppy.io/blog/2017/07/golden-retriever/
 */


module.exports = (_temp = _class = /*#__PURE__*/function (_Plugin) {
  _inheritsLoose(GoldenRetriever, _Plugin);

  function GoldenRetriever(uppy, opts) {
    var _this;

    _this = _Plugin.call(this, uppy, opts) || this;
    _this.type = 'debugger';
    _this.id = _this.opts.id || 'GoldenRetriever';
    _this.title = 'Golden Retriever';
    var defaultOptions = {
      expires: 24 * 60 * 60 * 1000,
      // 24 hours
      serviceWorker: false
    };
    _this.opts = _extends({}, defaultOptions, opts);
    _this.MetaDataStore = new MetaDataStore({
      expires: _this.opts.expires,
      storeName: uppy.getID()
    });
    _this.ServiceWorkerStore = null;

    if (_this.opts.serviceWorker) {
      _this.ServiceWorkerStore = new ServiceWorkerStore({
        storeName: uppy.getID()
      });
    }

    _this.IndexedDBStore = new IndexedDBStore(_extends({
      expires: _this.opts.expires
    }, _this.opts.indexedDB || {}, {
      storeName: uppy.getID()
    }));
    _this.saveFilesStateToLocalStorage = _this.saveFilesStateToLocalStorage.bind(_assertThisInitialized(_this));
    _this.loadFilesStateFromLocalStorage = _this.loadFilesStateFromLocalStorage.bind(_assertThisInitialized(_this));
    _this.loadFileBlobsFromServiceWorker = _this.loadFileBlobsFromServiceWorker.bind(_assertThisInitialized(_this));
    _this.loadFileBlobsFromIndexedDB = _this.loadFileBlobsFromIndexedDB.bind(_assertThisInitialized(_this));
    _this.onBlobsLoaded = _this.onBlobsLoaded.bind(_assertThisInitialized(_this));
    return _this;
  }

  var _proto = GoldenRetriever.prototype;

  _proto.loadFilesStateFromLocalStorage = function loadFilesStateFromLocalStorage() {
    var savedState = this.MetaDataStore.load();

    if (savedState) {
      this.uppy.log('[GoldenRetriever] Recovered some state from Local Storage');
      this.uppy.setState({
        currentUploads: savedState.currentUploads || {},
        files: savedState.files || {}
      });
      this.savedPluginData = savedState.pluginData;
    }
  }
  /**
   * Get file objects that are currently waiting: they've been selected,
   * but aren't yet being uploaded.
   */
  ;

  _proto.getWaitingFiles = function getWaitingFiles() {
    var waitingFiles = {};
    this.uppy.getFiles().forEach(function (file) {
      if (!file.progress || !file.progress.uploadStarted) {
        waitingFiles[file.id] = file;
      }
    });
    return waitingFiles;
  }
  /**
   * Get file objects that are currently being uploaded. If a file has finished
   * uploading, but the other files in the same batch have not, the finished
   * file is also returned.
   */
  ;

  _proto.getUploadingFiles = function getUploadingFiles() {
    var _this2 = this;

    var uploadingFiles = {};

    var _this$uppy$getState = this.uppy.getState(),
        currentUploads = _this$uppy$getState.currentUploads;

    if (currentUploads) {
      var uploadIDs = Object.keys(currentUploads);
      uploadIDs.forEach(function (uploadID) {
        var filesInUpload = currentUploads[uploadID].fileIDs;
        filesInUpload.forEach(function (fileID) {
          uploadingFiles[fileID] = _this2.uppy.getFile(fileID);
        });
      });
    }

    return uploadingFiles;
  };

  _proto.saveFilesStateToLocalStorage = function saveFilesStateToLocalStorage() {
    var filesToSave = _extends(this.getWaitingFiles(), this.getUploadingFiles());

    var pluginData = {}; // TODO Find a better way to do this?
    // Other plugins can attach a restore:get-data listener that receives this callback.
    // Plugins can then use this callback (sync) to provide data to be stored.

    this.uppy.emit('restore:get-data', function (data) {
      _extends(pluginData, data);
    });

    var _this$uppy$getState2 = this.uppy.getState(),
        currentUploads = _this$uppy$getState2.currentUploads;

    this.MetaDataStore.save({
      currentUploads: currentUploads,
      files: filesToSave,
      pluginData: pluginData
    });
  };

  _proto.loadFileBlobsFromServiceWorker = function loadFileBlobsFromServiceWorker() {
    var _this3 = this;

    this.ServiceWorkerStore.list().then(function (blobs) {
      var numberOfFilesRecovered = Object.keys(blobs).length;

      var numberOfFilesTryingToRecover = _this3.uppy.getFiles().length;

      if (numberOfFilesRecovered === numberOfFilesTryingToRecover) {
        _this3.uppy.log("[GoldenRetriever] Successfully recovered " + numberOfFilesRecovered + " blobs from Service Worker!");

        _this3.uppy.info("Successfully recovered " + numberOfFilesRecovered + " files", 'success', 3000);

        return _this3.onBlobsLoaded(blobs);
      }

      _this3.uppy.log('[GoldenRetriever] No blobs found in Service Worker, trying IndexedDB now...');

      return _this3.loadFileBlobsFromIndexedDB();
    }).catch(function (err) {
      _this3.uppy.log('[GoldenRetriever] Failed to recover blobs from Service Worker', 'warning');

      _this3.uppy.log(err);
    });
  };

  _proto.loadFileBlobsFromIndexedDB = function loadFileBlobsFromIndexedDB() {
    var _this4 = this;

    this.IndexedDBStore.list().then(function (blobs) {
      var numberOfFilesRecovered = Object.keys(blobs).length;

      if (numberOfFilesRecovered > 0) {
        _this4.uppy.log("[GoldenRetriever] Successfully recovered " + numberOfFilesRecovered + " blobs from IndexedDB!");

        _this4.uppy.info("Successfully recovered " + numberOfFilesRecovered + " files", 'success', 3000);

        return _this4.onBlobsLoaded(blobs);
      }

      _this4.uppy.log('[GoldenRetriever] No blobs found in IndexedDB');
    }).catch(function (err) {
      _this4.uppy.log('[GoldenRetriever] Failed to recover blobs from IndexedDB', 'warning');

      _this4.uppy.log(err);
    });
  };

  _proto.onBlobsLoaded = function onBlobsLoaded(blobs) {
    var _this5 = this;

    var obsoleteBlobs = [];

    var updatedFiles = _extends({}, this.uppy.getState().files);

    Object.keys(blobs).forEach(function (fileID) {
      var originalFile = _this5.uppy.getFile(fileID);

      if (!originalFile) {
        obsoleteBlobs.push(fileID);
        return;
      }

      var cachedData = blobs[fileID];
      var updatedFileData = {
        data: cachedData,
        isRestored: true
      };

      var updatedFile = _extends({}, originalFile, updatedFileData);

      updatedFiles[fileID] = updatedFile;
    });
    this.uppy.setState({
      files: updatedFiles
    });
    this.uppy.emit('restored', this.savedPluginData);

    if (obsoleteBlobs.length) {
      this.deleteBlobs(obsoleteBlobs).then(function () {
        _this5.uppy.log("[GoldenRetriever] Cleaned up " + obsoleteBlobs.length + " old files");
      }).catch(function (err) {
        _this5.uppy.log("[GoldenRetriever] Could not clean up " + obsoleteBlobs.length + " old files", 'warning');

        _this5.uppy.log(err);
      });
    }
  };

  _proto.deleteBlobs = function deleteBlobs(fileIDs) {
    var _this6 = this;

    var promises = [];
    fileIDs.forEach(function (id) {
      if (_this6.ServiceWorkerStore) {
        promises.push(_this6.ServiceWorkerStore.delete(id));
      }

      if (_this6.IndexedDBStore) {
        promises.push(_this6.IndexedDBStore.delete(id));
      }
    });
    return Promise.all(promises);
  };

  _proto.install = function install() {
    var _this7 = this;

    this.loadFilesStateFromLocalStorage();

    if (this.uppy.getFiles().length > 0) {
      if (this.ServiceWorkerStore) {
        this.uppy.log('[GoldenRetriever] Attempting to load files from Service Worker...');
        this.loadFileBlobsFromServiceWorker();
      } else {
        this.uppy.log('[GoldenRetriever] Attempting to load files from Indexed DB...');
        this.loadFileBlobsFromIndexedDB();
      }
    } else {
      this.uppy.log('[GoldenRetriever] No files need to be loaded, only restoring processing state...');
      this.onBlobsLoaded([]);
    }

    this.uppy.on('file-added', function (file) {
      if (file.isRemote) return;

      if (_this7.ServiceWorkerStore) {
        _this7.ServiceWorkerStore.put(file).catch(function (err) {
          _this7.uppy.log('[GoldenRetriever] Could not store file', 'warning');

          _this7.uppy.log(err);
        });
      }

      _this7.IndexedDBStore.put(file).catch(function (err) {
        _this7.uppy.log('[GoldenRetriever] Could not store file', 'warning');

        _this7.uppy.log(err);
      });
    });
    this.uppy.on('file-removed', function (file) {
      if (_this7.ServiceWorkerStore) {
        _this7.ServiceWorkerStore.delete(file.id).catch(function (err) {
          _this7.uppy.log('[GoldenRetriever] Failed to remove file', 'warning');

          _this7.uppy.log(err);
        });
      }

      _this7.IndexedDBStore.delete(file.id).catch(function (err) {
        _this7.uppy.log('[GoldenRetriever] Failed to remove file', 'warning');

        _this7.uppy.log(err);
      });
    });
    this.uppy.on('complete', function (_ref) {
      var successful = _ref.successful;
      var fileIDs = successful.map(function (file) {
        return file.id;
      });

      _this7.deleteBlobs(fileIDs).then(function () {
        _this7.uppy.log("[GoldenRetriever] Removed " + successful.length + " files that finished uploading");
      }).catch(function (err) {
        _this7.uppy.log("[GoldenRetriever] Could not remove " + successful.length + " files that finished uploading", 'warning');

        _this7.uppy.log(err);
      });
    });
    this.uppy.on('state-update', this.saveFilesStateToLocalStorage);
    this.uppy.on('restored', function () {
      // start all uploads again when file blobs are restored
      var _this7$uppy$getState = _this7.uppy.getState(),
          currentUploads = _this7$uppy$getState.currentUploads;

      if (currentUploads) {
        Object.keys(currentUploads).forEach(function (uploadId) {
          _this7.uppy.restore(uploadId, currentUploads[uploadId]);
        });
      }
    });
  };

  return GoldenRetriever;
}(Plugin), _class.VERSION = require('../package.json').version, _temp);