"use strict"

const _util = require('util');

Object.assign(_util.inspect.defaultOptions, {
    colors: true,
    depth: null,
    showHidden: true,
    customInspect: false,
    showProxy: true,
    maxArrayLength: null
})

const _path = require('path');

const _fs = require('fs');

const { spawn } = require('child_process');

const net = require('net');


class SocketSpawner {

    constructor(
        command,
        args,
        options = {
            env: { 'PATH': process.env.PATH },
            cwd: __dirname,
            windowsVerbatimArguments: true
        },
        processes = 10,
        host = 'localhost'
    ) {

        this.symbol = Symbol();

        this.host = host;
        this.command = command;
        this.args = args;
        this.options = options;

        this.spawns = [];

        this.subprocessListeners = this.subprocessListeners(this);

        for (let i = 0; i < processes; i++) {

            this.addSubprocess(host, command, args, options);
        }

    }

    addSubprocess(host, command, args, options) {

        const port = Math.floor(Math.random() * 16384 + 49152);

        const subprocess = spawn(command, [...args, '--host ' + host, '--port ' + port.toString()], options);

        subprocess[this.symbol] = {
            host: host,
            port: port
        }

        subprocess.on('exit', this.subprocessListeners.subprocessExit);
        subprocess.on('error', this.subprocessListeners.subprocessError);
        subprocess.on('disconnect', this.subprocessListeners.subprocessDisconnect);
        subprocess.on('close', this.subprocessListeners.subprocessClose);

        this.spawns.unshift(subprocess);
    }

    subprocessListeners(ctx) {

        return {

            subprocessExit(code, signal) {

                console.error(`Event: exit; code: ${code} signal: ${signal}`);

                ctx.spawns = ctx.spawns.filter((cur) => !Object.is(cur, this));

                ctx.addSubprocess(ctx.host, ctx.command, ctx.args, ctx.options);
            },

            subprocessError(err) {
                console.error(`Event: error; err: ${err}`);
            },

            subprocessDisconnect() {
                console.log(`Event: disconnect`);
            },

            subprocessClose(code, signal) {
                console.log(`Event: close; code: ${code} signal: ${signal}`);
            }
        }
    }

    connect(request) {

        return new Promise((r, j) => {

            try {

                const subprocess = this.spawns.pop();

                const socket = net.createConnection({
                    host: subprocess[this.symbol].host,
                    port: subprocess[this.symbol].port
                });

                socket.on('connect', () => { });

                socket.on('ready', () => {
                    console.log('socket ready');
                    socket.end(request, 'utf8');
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
                    console.log('socket close');
                    if (hadError) {
                        j(hadError);
                    }
                    else {
                        r(Buffer.concat(data).toString('utf8'));
                        this.spawns.push(subprocess);
                    }
                });

                socket.on('error', (err) => {
                    console.log('socket error');
                    j(err)
                });

                // setTimeout(() => {

                //     if (subprocess.exitCode === null) {

                //         subprocess.kill('SIGKILL');
                //     }
                // }, 2000);
            }
            catch (e) {

                console.log(e);
                j(e);
            }
        });
    }
}


(async function () {

    let socketSpawner = new SocketSpawner('python3', ['subprocess.py']);

    setTimeout(async () => {
        try {
            let result = await socketSpawner.connect('TEST');

            console.log(result);

            result = await socketSpawner.connect('ABC');
            console.log(result);
        }
        catch(e) {
            console.log(e)
        }

    }, 1000)


})();

    //module.exports = RegexAPI;

    // let subprocess = spawn('python3', ['subprocess.py', 'localhost', '40400'], {'env': {'PATH': process.env.PATH},'cwd': __dirname});

    // subprocess.on('exit', () => {
    //     console.log('exit')
    // });

    // subprocess.on('error', () => {
    //     console.log('error');
    // });

    // subprocess.on('close', () => {
    //     console.log('close');
    // });

    // subprocess.stderr.on('data', (chunk) => {
    //     console.log(chunk.toString('utf8'));
    // });

    // (async function () {

    //     // let regexAPI = new RegexAPI();

    //     // let request = { regexInput: "(?:is|a)", textInput: "This is a string." };

    //     // let response = await regexAPI.python(request);

    //     // console.log('response: ', response);


    //     // response = await regexAPI.python(request);
    //     // //let response = await regexAPI.node(request);

    //     // console.log('response: ', response);

    // })();


// class ThreadManager {

//     constructor(path, threads, timeout) {

//         this.threads = [];



//     }
// }



// let subprocess = spawn('python3', ['-u', 'subprocess.py'], {
//     'env': this.env,
//     'cwd': __dirname,
// });


// subprocess.stdin.write('message', 'utf8', () => {
//     console.log('flush');
// });

// subprocess.stdout.on('data', (data) => {
//     console.log(data.toString('utf8'));
//     //  message
// });

// subprocess.stdout.on('close', () => { console.log('close'); });

// subprocess.stdout.on('end', () => { console.log('end'); });

// subprocess.stdout.on('error', () => { console.log('error'); });