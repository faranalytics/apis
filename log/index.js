const _fs = require('fs');

const { Logger, Formatter } = require('./pipes')

let serverLogFile = _fs.createWriteStream(process.cwd() + '/server.log', { flags: 'w' });

let log = new Logger();

// let logJson = new Logger();

// let jsonFormatter = new Formatter((message) => `${this.LEVEL}: ${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})} ${JSON.stringify(message, null, 2)}${'\n'}`);

let formatter = new Formatter((message) => `${this.LEVEL}: ${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})} ${typeof message == 'object' ? JSON.stringify(message) : message}${'\n'}`);

log.level.debug.pipe(formatter).pipe(process.stdout);

log.level.debug.pipe(formatter).pipe(serverLogFile);

// logJson.level.debug.pipe(jsonFormatter).pipe(process.stdout);

// logJson.level.debug.pipe(jsonFormatter).pipe(serverLogFile);

module.exports = { log: log };