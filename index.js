"use strict";

// process.on('unhandledRejection', (reason, promise) => {
//     console.log('Unhandled Rejection at:', promise, 'reason:', reason);
//   });


// Memory
try {
    global.gc();

    let mu = process.memoryUsage();
    
    Object.keys(mu).forEach((k) => { console.log(k, Math.round(mu[k] / 1000 / 1000 * 100) / 100, 'MB') });
}
catch (e) {
    console.error(e);
}
//

const _util = require('util');

Object.assign(_util.inspect.defaultOptions, {
    colors: true,
    depth: null,
    showHidden: true,
    customInspect: false,
    showProxy: true,
    maxArrayLength: null
})

try {

    let config = require('./config.js')

    if (!Array.isArray(config.servers))
        throw new Error('config.servers is missing.');

    module.exports.servers = config.servers.map(config => {

        try {

            let Controller = require(process.cwd() + '/' + config['controllerPath']);

            let controller = new Controller(config);

            controller.start();

            return controller;
        }
        catch (e) {

            console.log('Unable to instantiate server configuration: \n' + _util.inspect(config));

            console.log(e.message);

            console.log(e.stack);
        }
    })
}
catch (e) {

    console.log(e);
}
