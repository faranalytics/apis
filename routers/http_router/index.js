"use strict";

const _path = require('path');

const docRoot = require(_path.resolve('models/file_modeler'));

const umichSalary = require(_path.resolve('models/umich_salary'));

exports["^localhost$"] = {};
exports["^localhost$"]["GET"] = docRoot(umichSalary, 'models/umich_salary/doc_root');
exports["^localhost$"]["GET"][Symbol('HTTPhandler')] = function (rep, ctx) {

  if (ctx.url.pathname.match(/^\/$/)) {
    ctx.paths = ['index.html'];
  }
}

exports["^umich-salary\\.faranalytics\\.net*$"] = exports["^localhost$"]

