"use strict";

const _path = require('path');

const SocketSpawner = require(_path.resolve(__dirname + '/modules/socket_spawner'));

const python = (new SocketSpawner('python3', [__dirname + '/subprocess.py']));
const node = (new SocketSpawner('python3', [__dirname + '/subprocess.py']));

module.exports = {
    'python': function(arg) {

        return python.call(arg);
    },

    'node': node.call
};

// (async function () {

//     //let socketSpawner = new SocketSpawner('python3', [__dirname + '/subprocess.py']);

//     setTimeout(async () => {

//         try {

//             let request = { regexInput: "(?:is|a)", textInput: "This is a string a." };

//             // let result = await socketSpawner.call(request);

//             // console.log(result);

//             // result = await socketSpawner.call(request);

//             // console.log(result);

//             let result = await module.exports.python(request);

//             console.log(result);
//         }
//         catch (e) {
//             console.log('catch');
//             console.log(e);
//         }

//     }, 1000);
// })();