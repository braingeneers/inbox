/**
 * A Barebones HTTP API client for Transloadit.
 */
module.exports = /*#__PURE__*/function () {
  function Client(opts) {
    if (opts === void 0) {
      opts = {};
    }

    this.opts = opts;
    this._reportError = this._reportError.bind(this);
    this._headers = {
      'Transloadit-Client': this.opts.client
    };
  }
  /**
   * Create a new assembly.
   *
   * @param {object} options
   */


  var _proto = Client.prototype;

  _proto.createAssembly = function createAssembly(_ref) {
    var _this = this;

    var templateId = _ref.templateId,
        params = _ref.params,
        fields = _ref.fields,
        signature = _ref.signature,
        expectedFiles = _ref.expectedFiles;
    var data = new FormData();
    data.append('params', typeof params === 'string' ? params : JSON.stringify(params));

    if (signature) {
      data.append('signature', signature);
    }

    Object.keys(fields).forEach(function (key) {
      data.append(key, fields[key]);
    });
    data.append('num_expected_upload_files', expectedFiles);
    var url = this.opts.service + "/assemblies";
    return fetch(url, {
      method: 'post',
      headers: this._headers,
      body: data
    }).then(function (response) {
      return response.json();
    }).then(function (assembly) {
      if (assembly.error) {
        var error = new Error(assembly.error);
        error.details = assembly.message;
        error.assembly = assembly;

        if (assembly.assembly_id) {
          error.details += ' ' + ("Assembly ID: " + assembly.assembly_id);
        }

        throw error;
      }

      return assembly;
    }).catch(function (err) {
      return _this._reportError(err, {
        url: url,
        type: 'API_ERROR'
      });
    });
  }
  /**
   * Reserve resources for a file in an Assembly. Then addFile can be used later.
   *
   * @param {object} assembly
   * @param {UppyFile} file
   */
  ;

  _proto.reserveFile = function reserveFile(assembly, file) {
    var _this2 = this;

    var size = encodeURIComponent(file.size);
    var url = assembly.assembly_ssl_url + "/reserve_file?size=" + size;
    return fetch(url, {
      method: 'post',
      headers: this._headers
    }).then(function (response) {
      return response.json();
    }).catch(function (err) {
      return _this2._reportError(err, {
        assembly: assembly,
        file: file,
        url: url,
        type: 'API_ERROR'
      });
    });
  }
  /**
   * Import a remote file to an Assembly.
   *
   * @param {object} assembly
   * @param {UppyFile} file
   */
  ;

  _proto.addFile = function addFile(assembly, file) {
    var _this3 = this;

    if (!file.uploadURL) {
      return Promise.reject(new Error('File does not have an `uploadURL`.'));
    }

    var size = encodeURIComponent(file.size);
    var uploadUrl = encodeURIComponent(file.uploadURL);
    var filename = encodeURIComponent(file.name);
    var fieldname = 'file';
    var qs = "size=" + size + "&filename=" + filename + "&fieldname=" + fieldname + "&s3Url=" + uploadUrl;
    var url = assembly.assembly_ssl_url + "/add_file?" + qs;
    return fetch(url, {
      method: 'post',
      headers: this._headers
    }).then(function (response) {
      return response.json();
    }).catch(function (err) {
      return _this3._reportError(err, {
        assembly: assembly,
        file: file,
        url: url,
        type: 'API_ERROR'
      });
    });
  }
  /**
   * Cancel a running Assembly.
   *
   * @param {object} assembly
   */
  ;

  _proto.cancelAssembly = function cancelAssembly(assembly) {
    var _this4 = this;

    var url = assembly.assembly_ssl_url;
    return fetch(url, {
      method: 'delete',
      headers: this._headers
    }).then(function (response) {
      return response.json();
    }).catch(function (err) {
      return _this4._reportError(err, {
        url: url,
        type: 'API_ERROR'
      });
    });
  }
  /**
   * Get the current status for an assembly.
   *
   * @param {string} url The status endpoint of the assembly.
   */
  ;

  _proto.getAssemblyStatus = function getAssemblyStatus(url) {
    var _this5 = this;

    return fetch(url, {
      headers: this._headers
    }).then(function (response) {
      return response.json();
    }).catch(function (err) {
      return _this5._reportError(err, {
        url: url,
        type: 'STATUS_ERROR'
      });
    });
  };

  _proto.submitError = function submitError(err, _ref2) {
    var endpoint = _ref2.endpoint,
        instance = _ref2.instance,
        assembly = _ref2.assembly;
    var message = err.details ? err.message + " (" + err.details + ")" : err.message;
    return fetch('https://status.transloadit.com/client_error', {
      method: 'post',
      body: JSON.stringify({
        endpoint: endpoint,
        instance: instance,
        assembly_id: assembly,
        agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        client: this.opts.client,
        error: message
      })
    }).then(function (response) {
      return response.json();
    });
  };

  _proto._reportError = function _reportError(err, params) {
    if (this.opts.errorReporting === false) {
      throw err;
    }

    var opts = {
      type: params.type
    };

    if (params.assembly) {
      opts.assembly = params.assembly.assembly_id;
      opts.instance = params.assembly.instance;
    }

    if (params.url) {
      opts.endpoint = params.url;
    }

    this.submitError(err, opts).catch(function (_) {// not much we can do then is there
    });
    throw err;
  };

  return Client;
}();