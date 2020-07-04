"use strict"

const _path = require('path');

const _fs = require('fs');

const { HTTPResponse } = require(_path.resolve('exceptions'));

const { log } = require(_path.resolve('log'));

class DocRoot {

    constructor(docRoot) {

        this.docRoot = docRoot.endsWith(_path.sep) ? docRoot.trim() : docRoot.trim() + _path.sep;
    }

    getDocRoot() {

        return (args, ctx) => {

            let path = _path.normalize(this.docRoot + ctx.paths.reverse().join(_path.sep));

            if (path.endsWith(_path.sep)) {

                path = path + 'index.html';
            }

            ctx.paths = [];
            //  The path is being hijacked by this function. ctx.paths is set to []
            //  in order to prevent the return value of the function from being traversed.

            if (!path.startsWith(this.docRoot, 0)) {

                throw new HTTPResponse(404);
            }

            return new Promise((r, j) => {

                log.debug('Reading: ' + path);

                _fs.readFile(path, (err, data) => {

                    if (err) {

                        log.debug(err);

                        j(new HTTPResponse(404));
                        return;
                    }

                    r(data.toString());
                });
            });
        }
    }
}

module.exports = {
    DOC_ROOT: function (docRootPath) {

        return new DocRoot(docRootPath).getDocRoot();
    }
}