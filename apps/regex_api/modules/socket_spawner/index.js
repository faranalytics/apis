"use strict"

const _util = require('util');

Object.assign(_util.inspect.defaultOptions, {
    colors: true,
    depth: null,
    showHidden: true,
    customInspect: false,
    showProxy: true,
    maxArrayLength: null
});

const _path = require('path');

const _fs = require('fs');

const child_process = require('child_process');

const net = require('net');


class SocketSpawner {

    constructor(
        command,
        args = [],
        options = {
            env: { 'PATH': process.env.PATH },
            cwd: __dirname,
            windowsVerbatimArguments: true
        },
        processes = 10,
        processTimeout = 1000,
        host = 'localhost'
    ) {

        this.symbol = Symbol();

        this.host = host;
        this.command = command;
        this.args = args;
        this.options = options;
        this.spawnCount = processes;
        this.spawnTimeout = processTimeout;

        this.spawns = [];

        this.spawnListeners = this.spawnListeners(this);
        //  This can be accessed from other instance methods e.g., in order to remove listeners.

        while (this.spawns.length < this.spawnCount) {

            this.addSpawn();
        }

        return {

            'call': this.call.bind(this)
        }

    }

    addSpawn() {
        console.log('addSpawn');

        if (this.spawns.length < this.spawnCount) {

            const port = Math.floor(Math.random() * 16384 + 49152);

            const spawn = child_process.spawn(
                this.command,
                [...this.args, '--host ' + this.host, '--port ' + port.toString()],
                this.options
            );

            spawn[this.symbol] = {
                host: this.host,
                port: port
            }

            spawn.on('exit', this.spawnListeners.spawnExit);
            spawn.on('error', this.spawnListeners.spawnError);
            spawn.on('close', this.spawnListeners.spawnClose);

            this.spawns.unshift(spawn);
        }
    }

    spawnListeners(ctx) {

        return {

            spawnExit(code, signal) {
                console.error(`Spawn Event: exit; code: ${code} signal: ${signal}`);

                ctx.spawns = ctx.spawns.filter((cur) => !Object.is(cur, this));

                ctx.addSpawn();
            },

            spawnError(err) {
                console.error(`Spawn Event: error; err: ${err}`);
            },

            spawnClose(code, signal) {
                console.log(`Spawn Event: close; code: ${code} signal: ${signal}`);
            }
        }
    }

    call(request) {

        return new Promise((r, j) => {

            try {

                const spawn = this.spawns.pop();

                const socket = net.createConnection({
                    host: spawn[this.symbol].host,
                    port: spawn[this.symbol].port
                });

                socket.on('connect', () => { });

                socket.on('ready', () => {
                    console.log('socket ready');

                    socket.end(JSON.stringify(request), 'utf8');
                });

                const data = [];

                socket.on('data', (chunk) => {
                    console.log('socket data');

                    data.push(chunk);
                });

                socket.on('end', () => {
                    console.log('socket end');
                });

                socket.on('close', (hadError) => {

                    if (hadError) {

                        console.error(`Emitter: socket Event: close hadError: ${hadError}`);

                        spawn.kill('SIGKILL');

                        j(hadError);

                        return;
                    }

                    console.log('socket.readyState:', socket.readyState);

                    r(JSON.parse(Buffer.concat(data).toString('utf8')));

                    this.spawns.push(spawn);
                });

                socket.on('error', (err) => {

                    console.log('socket error');

                    spawn.kill('SIGKILL');

                    j(err);
                });

                setTimeout(() => {

                    if (socket.readyState != 'closed') {

                        spawn.kill('SIGKILL');
                    }
                }, this.spawnTimeout);
            }
            catch (e) {

                console.log(e);

                j(e);
            }
        });
    }
}

module.exports = SocketSpawner;


// (async function () {

//     let socketSpawner = new SocketSpawner('python3', ['subprocess.py']);

//     setTimeout(async () => {
//         try {

//             let request = JSON.stringify({ regexInput: "(?:is|a)", textInput: "This is a string a." });

//             let result = await socketSpawner.call(request);

//             console.log(result);

//             result = await socketSpawner.call(request);

//             console.log(result);

//         }
//         catch (e) {
//             console.log('catch');
//             console.log(e);
//         }

//     }, 1000);
// })();