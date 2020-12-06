"use strict";

const _path = require('path');

// const docRoot = require(_path.resolve('models/file_modeler'));

// const umichSalary = require(_path.resolve('models/umich_salary'));

const FileWatcher = require(_path.resolve('models/file_watcher'));

module.exports = {
  
  '^localhost$': {

    'GET': new FileWatcher('models/regex/doc_root'),

    'POST': {

      'api': 'test API'
    }
  }
}

module.exports['^localhost$'].GET[Symbol('HTTPhandler')] = function (rep, ctx) {

  if (ctx.url.pathname.match(/^\/$/)) {
    ctx.paths = ['index.html'];
  }
}