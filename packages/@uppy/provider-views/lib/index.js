var _class, _temp;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var _require = require('preact'),
    h = _require.h,
    Component = _require.Component;

var AuthView = require('./AuthView');

var Browser = require('./Browser');

var LoaderView = require('./Loader');

var generateFileID = require('@uppy/utils/lib/generateFileID');

var getFileType = require('@uppy/utils/lib/getFileType');

var isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported');
/**
 * Array.prototype.findIndex ponyfill for old browsers.
 */


function findIndex(array, predicate) {
  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i])) return i;
  }

  return -1;
} // location.origin does not exist in IE


function getOrigin() {
  if ('origin' in location) {
    return location.origin; // eslint-disable-line compat/compat
  }

  return location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : '');
}

var CloseWrapper = /*#__PURE__*/function (_Component) {
  _inheritsLoose(CloseWrapper, _Component);

  function CloseWrapper() {
    return _Component.apply(this, arguments) || this;
  }

  var _proto = CloseWrapper.prototype;

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.props.onUnmount();
  };

  _proto.render = function render() {
    return this.props.children[0];
  };

  return CloseWrapper;
}(Component);
/**
 * Class to easily generate generic views for Provider plugins
 */


module.exports = (_temp = _class = /*#__PURE__*/function () {
  /**
   * @param {object} plugin instance of the plugin
   * @param {object} opts
   */
  function ProviderView(plugin, opts) {
    this.plugin = plugin;
    this.provider = opts.provider; // set default options

    var defaultOptions = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true
    }; // merge default options with the ones set by user

    this.opts = _extends({}, defaultOptions, {}, opts); // Logic

    this.addFile = this.addFile.bind(this);
    this.filterItems = this.filterItems.bind(this);
    this.filterQuery = this.filterQuery.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.getFolder = this.getFolder.bind(this);
    this.getNextFolder = this.getNextFolder.bind(this);
    this.logout = this.logout.bind(this);
    this.preFirstRender = this.preFirstRender.bind(this);
    this.handleAuth = this.handleAuth.bind(this);
    this.sortByTitle = this.sortByTitle.bind(this);
    this.sortByDate = this.sortByDate.bind(this);
    this.isActiveRow = this.isActiveRow.bind(this);
    this.isChecked = this.isChecked.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.listAllFiles = this.listAllFiles.bind(this);
    this.donePicking = this.donePicking.bind(this);
    this.cancelPicking = this.cancelPicking.bind(this);
    this.clearSelection = this.clearSelection.bind(this); // Visual

    this.render = this.render.bind(this);
    this.clearSelection();
  }

  var _proto2 = ProviderView.prototype;

  _proto2.tearDown = function tearDown() {// Nothing.
  };

  _proto2._updateFilesAndFolders = function _updateFilesAndFolders(res, files, folders) {
    this.nextPagePath = res.nextPagePath;
    res.items.forEach(function (item) {
      if (item.isFolder) {
        folders.push(item);
      } else {
        files.push(item);
      }
    });
    this.plugin.setPluginState({
      folders: folders,
      files: files
    });
  }
  /**
   * Called only the first time the provider view is rendered.
   * Kind of like an init function.
   */
  ;

  _proto2.preFirstRender = function preFirstRender() {
    this.plugin.setPluginState({
      didFirstRender: true
    });
    this.plugin.onFirstRender();
  }
  /**
   * Based on folder ID, fetch a new folder and update it to state
   *
   * @param  {string} id Folder id
   * @returns {Promise}   Folders/files in folder
   */
  ;

  _proto2.getFolder = function getFolder(id, name) {
    var _this = this;

    return this._loaderWrapper(this.provider.list(id), function (res) {
      var folders = [];
      var files = [];
      var updatedDirectories;

      var state = _this.plugin.getPluginState();

      var index = findIndex(state.directories, function (dir) {
        return id === dir.id;
      });

      if (index !== -1) {
        updatedDirectories = state.directories.slice(0, index + 1);
      } else {
        updatedDirectories = state.directories.concat([{
          id: id,
          title: name
        }]);
      }

      _this.username = _this.username ? _this.username : res.username;

      _this._updateFilesAndFolders(res, files, folders);

      _this.plugin.setPluginState({
        directories: updatedDirectories
      });
    }, this.handleError);
  }
  /**
   * Fetches new folder
   *
   * @param  {object} Folder
   * @param  {string} title Folder title
   */
  ;

  _proto2.getNextFolder = function getNextFolder(folder) {
    this.getFolder(folder.requestPath, folder.name);
    this.lastCheckbox = undefined;
  };

  _proto2.addFile = function addFile(file) {
    var tagFile = {
      id: this.providerFileToId(file),
      source: this.plugin.id,
      data: file,
      name: file.name || file.id,
      type: file.mimeType,
      isRemote: true,
      body: {
        fileId: file.id
      },
      remote: {
        companionUrl: this.plugin.opts.companionUrl,
        url: "" + this.provider.fileUrl(file.requestPath),
        body: {
          fileId: file.id
        },
        providerOptions: this.provider.opts
      }
    };
    var fileType = getFileType(tagFile); // TODO Should we just always use the thumbnail URL if it exists?

    if (fileType && isPreviewSupported(fileType)) {
      tagFile.preview = file.thumbnail;
    }

    this.plugin.uppy.log('Adding remote file');

    try {
      this.plugin.uppy.addFile(tagFile);
    } catch (err) {
      if (!err.isRestriction) {
        this.plugin.uppy.log(err);
      }
    }
  };

  _proto2.removeFile = function removeFile(id) {
    var _this$plugin$getPlugi = this.plugin.getPluginState(),
        currentSelection = _this$plugin$getPlugi.currentSelection;

    this.plugin.setPluginState({
      currentSelection: currentSelection.filter(function (file) {
        return file.id !== id;
      })
    });
  }
  /**
   * Removes session token on client side.
   */
  ;

  _proto2.logout = function logout() {
    var _this2 = this;

    this.provider.logout().then(function (res) {
      if (res.ok) {
        if (!res.revoked) {
          var message = _this2.plugin.uppy.i18n('companionUnauthorizeHint', {
            provider: _this2.plugin.title,
            url: res.manual_revoke_url
          });

          _this2.plugin.uppy.info(message, 'info', 7000);
        }

        var newState = {
          authenticated: false,
          files: [],
          folders: [],
          directories: []
        };

        _this2.plugin.setPluginState(newState);
      }
    }).catch(this.handleError);
  };

  _proto2.filterQuery = function filterQuery(e) {
    var state = this.plugin.getPluginState();
    this.plugin.setPluginState(_extends({}, state, {
      filterInput: e ? e.target.value : ''
    }));
  };

  _proto2.toggleSearch = function toggleSearch(inputEl) {
    var state = this.plugin.getPluginState();
    this.plugin.setPluginState({
      isSearchVisible: !state.isSearchVisible,
      filterInput: ''
    });
  };

  _proto2.filterItems = function filterItems(items) {
    var state = this.plugin.getPluginState();

    if (!state.filterInput || state.filterInput === '') {
      return items;
    }

    return items.filter(function (folder) {
      return folder.name.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1;
    });
  };

  _proto2.sortByTitle = function sortByTitle() {
    var state = _extends({}, this.plugin.getPluginState());

    var files = state.files,
        folders = state.folders,
        sorting = state.sorting;
    var sortedFiles = files.sort(function (fileA, fileB) {
      if (sorting === 'titleDescending') {
        return fileB.name.localeCompare(fileA.name);
      }

      return fileA.name.localeCompare(fileB.name);
    });
    var sortedFolders = folders.sort(function (folderA, folderB) {
      if (sorting === 'titleDescending') {
        return folderB.name.localeCompare(folderA.name);
      }

      return folderA.name.localeCompare(folderB.name);
    });
    this.plugin.setPluginState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'titleDescending' ? 'titleAscending' : 'titleDescending'
    }));
  };

  _proto2.sortByDate = function sortByDate() {
    var state = _extends({}, this.plugin.getPluginState());

    var files = state.files,
        folders = state.folders,
        sorting = state.sorting;
    var sortedFiles = files.sort(function (fileA, fileB) {
      var a = new Date(fileA.modifiedDate);
      var b = new Date(fileB.modifiedDate);

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }

      return a > b ? 1 : a < b ? -1 : 0;
    });
    var sortedFolders = folders.sort(function (folderA, folderB) {
      var a = new Date(folderA.modifiedDate);
      var b = new Date(folderB.modifiedDate);

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }

      return a > b ? 1 : a < b ? -1 : 0;
    });
    this.plugin.setPluginState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'dateDescending' ? 'dateAscending' : 'dateDescending'
    }));
  };

  _proto2.sortBySize = function sortBySize() {
    var state = _extends({}, this.plugin.getPluginState());

    var files = state.files,
        sorting = state.sorting; // check that plugin supports file sizes

    if (!files.length || !this.plugin.getItemData(files[0]).size) {
      return;
    }

    var sortedFiles = files.sort(function (fileA, fileB) {
      var a = fileA.size;
      var b = fileB.size;

      if (sorting === 'sizeDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }

      return a > b ? 1 : a < b ? -1 : 0;
    });
    this.plugin.setPluginState(_extends({}, state, {
      files: sortedFiles,
      sorting: sorting === 'sizeDescending' ? 'sizeAscending' : 'sizeDescending'
    }));
  };

  _proto2.isActiveRow = function isActiveRow(file) {
    return this.plugin.getPluginState().activeRow === this.plugin.getItemId(file);
  };

  _proto2.isChecked = function isChecked(file) {
    var _this$plugin$getPlugi2 = this.plugin.getPluginState(),
        currentSelection = _this$plugin$getPlugi2.currentSelection; // comparing id instead of the file object, because the reference to the object
    // changes when we switch folders, and the file list is updated


    return currentSelection.some(function (item) {
      return item.id === file.id;
    });
  }
  /**
   * Adds all files found inside of specified folder.
   *
   * Uses separated state while folder contents are being fetched and
   * mantains list of selected folders, which are separated from files.
   */
  ;

  _proto2.addFolder = function addFolder(folder) {
    var _this3 = this;

    var folderId = this.providerFileToId(folder);
    var state = this.plugin.getPluginState();
    var folders = state.selectedFolders || {};

    if (folderId in folders && folders[folderId].loading) {
      return;
    }

    folders[folderId] = {
      loading: true,
      files: []
    };
    this.plugin.setPluginState({
      selectedFolders: folders
    });
    return this.listAllFiles(folder.requestPath).then(function (files) {
      files.forEach(function (file) {
        _this3.addFile(file);
      });
      var ids = files.map(_this3.providerFileToId);
      state = _this3.plugin.getPluginState();
      state.selectedFolders[folderId] = {
        loading: false,
        files: ids
      };

      _this3.plugin.setPluginState({
        selectedFolders: folders
      });

      var message;

      if (files.length) {
        message = _this3.plugin.uppy.i18n('folderAdded', {
          smart_count: files.length,
          folder: folder.name
        });
      } else {
        message = _this3.plugin.uppy.i18n('emptyFolderAdded');
      }

      _this3.plugin.uppy.info(message);
    }).catch(function (e) {
      state = _this3.plugin.getPluginState();
      delete state.selectedFolders[folderId];

      _this3.plugin.setPluginState({
        selectedFolders: state.selectedFolders
      });

      _this3.handleError(e);
    });
  }
  /**
   * Toggles file/folder checkbox to on/off state while updating files list.
   *
   * Note that some extra complexity comes from supporting shift+click to
   * toggle multiple checkboxes at once, which is done by getting all files
   * in between last checked file and current one.
   */
  ;

  _proto2.toggleCheckbox = function toggleCheckbox(e, file) {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.focus();

    var _this$plugin$getPlugi3 = this.plugin.getPluginState(),
        folders = _this$plugin$getPlugi3.folders,
        files = _this$plugin$getPlugi3.files;

    var items = this.filterItems(folders.concat(files)); // Shift-clicking selects a single consecutive list of items
    // starting at the previous click and deselects everything else.

    if (this.lastCheckbox && e.shiftKey) {
      var _currentSelection;

      var prevIndex = items.indexOf(this.lastCheckbox);
      var currentIndex = items.indexOf(file);

      if (prevIndex < currentIndex) {
        _currentSelection = items.slice(prevIndex, currentIndex + 1);
      } else {
        _currentSelection = items.slice(currentIndex, prevIndex + 1);
      }

      this.plugin.setPluginState({
        currentSelection: _currentSelection
      });
      return;
    }

    this.lastCheckbox = file;

    var _this$plugin$getPlugi4 = this.plugin.getPluginState(),
        currentSelection = _this$plugin$getPlugi4.currentSelection;

    if (this.isChecked(file)) {
      this.plugin.setPluginState({
        currentSelection: currentSelection.filter(function (item) {
          return item.id !== file.id;
        })
      });
    } else {
      this.plugin.setPluginState({
        currentSelection: currentSelection.concat([file])
      });
    }
  };

  _proto2.providerFileToId = function providerFileToId(file) {
    return generateFileID({
      data: file,
      name: file.name || file.id,
      type: file.mimeType
    });
  };

  _proto2.handleAuth = function handleAuth() {
    var _this4 = this;

    var authState = btoa(JSON.stringify({
      origin: getOrigin()
    }));
    var clientVersion = encodeURIComponent("@uppy/provider-views=" + ProviderView.VERSION);
    var link = this.provider.authUrl() + "?state=" + authState + "&uppyVersions=" + clientVersion;
    var authWindow = window.open(link, '_blank');

    var handleToken = function handleToken(e) {
      if (!_this4._isOriginAllowed(e.origin, _this4.plugin.opts.companionAllowedHosts) || e.source !== authWindow) {
        _this4.plugin.uppy.log("rejecting event from " + e.origin + " vs allowed pattern " + _this4.plugin.opts.companionAllowedHosts);

        return;
      } // Check if it's a string before doing the JSON.parse to maintain support
      // for older Companion versions that used object references


      var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;

      if (!data.token) {
        _this4.plugin.uppy.log('did not receive token from auth window');

        return;
      }

      authWindow.close();
      window.removeEventListener('message', handleToken);

      _this4.provider.setAuthToken(data.token);

      _this4.preFirstRender();
    };

    window.addEventListener('message', handleToken);
  };

  _proto2._isOriginAllowed = function _isOriginAllowed(origin, allowedOrigin) {
    var getRegex = function getRegex(value) {
      if (typeof value === 'string') {
        return new RegExp("^" + value + "$");
      } else if (value instanceof RegExp) {
        return value;
      }
    };

    var patterns = Array.isArray(allowedOrigin) ? allowedOrigin.map(getRegex) : [getRegex(allowedOrigin)];
    return patterns.filter(function (pattern) {
      return pattern != null;
    }) // loose comparison to catch undefined
    .some(function (pattern) {
      return pattern.test(origin) || pattern.test(origin + "/");
    }); // allowing for trailing '/'
  };

  _proto2.handleError = function handleError(error) {
    var uppy = this.plugin.uppy;
    uppy.log(error.toString());

    if (error.isAuthError) {
      return;
    }

    var message = uppy.i18n('companionError');
    uppy.info({
      message: message,
      details: error.toString()
    }, 'error', 5000);
  };

  _proto2.handleScroll = function handleScroll(e) {
    var _this5 = this;

    var scrollPos = e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight);
    var path = this.nextPagePath || null;

    if (scrollPos < 50 && path && !this._isHandlingScroll) {
      this.provider.list(path).then(function (res) {
        var _this5$plugin$getPlug = _this5.plugin.getPluginState(),
            files = _this5$plugin$getPlug.files,
            folders = _this5$plugin$getPlug.folders;

        _this5._updateFilesAndFolders(res, files, folders);
      }).catch(this.handleError).then(function () {
        _this5._isHandlingScroll = false;
      }); // always called

      this._isHandlingScroll = true;
    }
  };

  _proto2.listAllFiles = function listAllFiles(path, files) {
    var _this6 = this;

    if (files === void 0) {
      files = null;
    }

    files = files || [];
    return new Promise(function (resolve, reject) {
      _this6.provider.list(path).then(function (res) {
        res.items.forEach(function (item) {
          if (!item.isFolder) {
            files.push(item);
          }
        });
        var moreFiles = res.nextPagePath || null;

        if (moreFiles) {
          return _this6.listAllFiles(moreFiles, files).then(function (files) {
            return resolve(files);
          }).catch(function (e) {
            return reject(e);
          });
        } else {
          return resolve(files);
        }
      }).catch(function (e) {
        return reject(e);
      });
    });
  };

  _proto2.donePicking = function donePicking() {
    var _this7 = this;

    var _this$plugin$getPlugi5 = this.plugin.getPluginState(),
        currentSelection = _this$plugin$getPlugi5.currentSelection;

    var promises = currentSelection.map(function (file) {
      if (file.isFolder) {
        return _this7.addFolder(file);
      } else {
        return _this7.addFile(file);
      }
    });

    this._loaderWrapper(Promise.all(promises), function () {
      _this7.clearSelection();
    }, function () {});
  };

  _proto2.cancelPicking = function cancelPicking() {
    this.clearSelection();
    var dashboard = this.plugin.uppy.getPlugin('Dashboard');
    if (dashboard) dashboard.hideAllPanels();
  };

  _proto2.clearSelection = function clearSelection() {
    this.plugin.setPluginState({
      currentSelection: []
    });
  } // displays loader view while asynchronous request is being made.
  ;

  _proto2._loaderWrapper = function _loaderWrapper(promise, then, catch_) {
    var _this8 = this;

    promise.then(function (result) {
      _this8.plugin.setPluginState({
        loading: false
      });

      then(result);
    }).catch(function (err) {
      _this8.plugin.setPluginState({
        loading: false
      });

      catch_(err);
    });
    this.plugin.setPluginState({
      loading: true
    });
  };

  _proto2.render = function render(state, viewOptions) {
    if (viewOptions === void 0) {
      viewOptions = {};
    }

    var _this$plugin$getPlugi6 = this.plugin.getPluginState(),
        authenticated = _this$plugin$getPlugi6.authenticated,
        didFirstRender = _this$plugin$getPlugi6.didFirstRender;

    if (!didFirstRender) {
      this.preFirstRender();
    } // reload pluginState for "loading" attribute because it might
    // have changed above.


    if (this.plugin.getPluginState().loading) {
      return h(CloseWrapper, {
        onUnmount: this.clearSelection
      }, h(LoaderView, {
        i18n: this.plugin.uppy.i18n
      }));
    }

    if (!authenticated) {
      return h(CloseWrapper, {
        onUnmount: this.clearSelection
      }, h(AuthView, {
        pluginName: this.plugin.title,
        pluginIcon: this.plugin.icon,
        handleAuth: this.handleAuth,
        i18n: this.plugin.uppy.i18n,
        i18nArray: this.plugin.uppy.i18nArray
      }));
    }

    var targetViewOptions = _extends({}, this.opts, {}, viewOptions);

    var browserProps = _extends({}, this.plugin.getPluginState(), {
      username: this.username,
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      toggleSearch: this.toggleSearch,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      isActiveRow: this.isActiveRow,
      isChecked: this.isChecked,
      toggleCheckbox: this.toggleCheckbox,
      handleScroll: this.handleScroll,
      listAllFiles: this.listAllFiles,
      done: this.donePicking,
      cancel: this.cancelPicking,
      title: this.plugin.title,
      viewType: targetViewOptions.viewType,
      showTitles: targetViewOptions.showTitles,
      showFilter: targetViewOptions.showFilter,
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      pluginIcon: this.plugin.icon,
      i18n: this.plugin.uppy.i18n
    });

    return h(CloseWrapper, {
      onUnmount: this.clearSelection
    }, h(Browser, browserProps));
  };

  return ProviderView;
}(), _class.VERSION = require('../package.json').version, _temp);