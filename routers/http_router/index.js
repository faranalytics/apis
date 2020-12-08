"use strict";

const _path = require('path');

const RegexAPI = require(_path.resolve('models/regex_api'));

const FileWatcher = require(_path.resolve('models/file_watcher'));

let fileWatcher = new FileWatcher('models/regex_api/doc_root');


const routerModel = {

  'GET': {

    [Symbol('HTTPhandler')]: function (rep, ctx) {
      console.log('HTTPhandler')
      console.log(ctx.paths)

      if (ctx.url.pathname.match(/^.*\/$/)) {
        console.log(ctx.paths)
        ctx.paths.shift();
        ctx.paths.unshift('index.html');
      }
    },

    'regex-api': fileWatcher
  },

  'POST': {

    'api': 'TEST',

    'regex-api': new RegexAPI()
  }
}

module.exports = {

  '^localhost$': routerModel,

  '^faranalytics.net$': routerModel
}