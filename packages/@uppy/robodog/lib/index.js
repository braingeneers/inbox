var form = require('./form');

var dashboard = require('./dashboard');

var pick = require('./pick');

var upload = require('./upload');

module.exports = {
  dashboard: dashboard,
  form: form,
  pick: pick,
  upload: upload,
  VERSION: require('../package.json').version
};