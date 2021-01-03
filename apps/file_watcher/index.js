"use strict"

const _path = require('path');

const _fs = require('fs');

const { log } = require(_path.resolve('log'));


class FileWatcher {

    constructor(path) {

        this.path = path;

        this.root = {}

        this.fn(this.path, this.root).then((r)=>{this.root, r});

        return this.root;
    }

    async fn(path = this.path, root = {}) {

        let dirents = await _fs.promises.readdir(path, { withFileTypes: true });

        while (dirents.length) {

            let dirent = dirents.pop();

            if (dirent.isDirectory()) {

                root[dirent.name] = await this.fn(path + _path.sep + dirent.name, {});

            }
            else if (dirent.isFile()) {

                let filehandle = await _fs.promises.open(path + _path.sep + dirent.name, 'r');

                root[dirent.name] = await filehandle.readFile({ encoding: 'utf8' });

                filehandle.close()
            }
        }

        return root;
    }
}

module.exports = FileWatcher;

// let fw = new FileWatcher('./models/file_watcher/doc_root');

// (async () => {

// let dir = await fw.fn();
// console.log(JSON.stringify(dir))
// })()

// let fw = new FileWatcher('./models/file_watcher/doc_root');

// setTimeout(()=>{console.log(fw)}, 1000)