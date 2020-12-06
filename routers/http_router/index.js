"use strict";

const _path = require('path');

const RegexAPI = require(_path.resolve('models/regex_api'));

const FileWatcher = require(_path.resolve('models/file_watcher'));

let fileWatcher = new FileWatcher('models/regex_api/doc_root');

fileWatcher[Symbol('HTTPhandler')] = function (rep, ctx) {

  if (ctx.url.pathname.match(/^\/$/)) {
    ctx.paths = ['index.html'];
  }
}


module.exports = {
  
  '^localhost$': {

    'GET': fileWatcher,

    'POST': {

      'api': 'TEST',

      'regex-api': new RegexAPI()
    }
  }
}