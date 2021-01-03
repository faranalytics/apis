"use strict";

const _path = require('path');

const { HANDLER } = require(_path.resolve('symbols'))

const FileWatcher = require(_path.resolve('apps/file_watcher'));

const routerModel = {

  'GET': {

    [HANDLER]: function (ctx) {

      if (ctx.url.pathname.match(/^.*\/$/)) {

        ctx.negotiate = false;

        ctx.res.writeHead(301, { Location: ctx.url.pathname + 'index.html' }).end();
      }
    },

    'regex-api': new FileWatcher(_path.resolve('apps/regex_api/doc_root'))

  },

  'POST': {

    'regex-api': require(_path.resolve('apps/regex_api'))
  }
}

module.exports = {

  '^localhost$': routerModel,

  '^faranalytics.net$': routerModel
}