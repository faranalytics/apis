"use strict"

const _path = require('path');

const _fs = require('fs');

const { HTTPResponse } = require(_path.resolve('exceptions'));

const { log } = require(_path.resolve('log'));


function docRoot(model, dir) {

    (async function (model, dir){

        let dirents = await _fs.promises.readdir(dir, { withFileTypes: true })

        await Promise.all(dirents.map(async (dirent) => {
    
            if (dirent.isDirectory()) {
    
                model[dirent.name] = {}
    
                return build(model[dirent.name], dir + _path.sep + dirent.name);
            }
            else if (dirent.isFile()) {
    
                model[dirent.name] = (await _fs.promises.readFile(dir + _path.sep + dirent.name));
    
                // _fs.watch(dir + _path.sep + dirent.name, (event, filename) => {
    
                //     model[dirent.name] = (await _fs.promises.readFile(dir + _path.sep + dirent.name));
                // });
            }
        }));
    })(model, dir);

    return model;
}

module.exports = docRoot;
