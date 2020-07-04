"use strict"

const { Transform } = require('stream');

const $LEVEL = Symbol('LEVEL');
const $STACK = Symbol('STACK');
const $CONTEXT = Symbol('CONTEXT');
const $FORMATTER = Symbol('FORMATTER')

class Formatter extends Transform {

    constructor(formatter, options = {}) {
        super({ ...options, ...{ writableObjectMode: true, readableObjectMode: true, autoDestroy: false, emitClose: false } });

        this[$CONTEXT] = {/* [$CONTEXT] */ };
        this[$FORMATTER] = formatter.toString();

        (function (formatter) {

            this.formatter = eval(formatter); //  ...please... Ecclesiastes 3:1-8

        }).call(this[$CONTEXT], this[$FORMATTER]);
    }

    async _transform(chunk, encoding, callback) {

        this[$CONTEXT].LEVEL = chunk[$LEVEL];
        this[$CONTEXT].STACK = chunk[$STACK];
        //  chunk[$LEVEL] and chunk[$STACK] get assinged in the logger.
        //  this[$CONTEXT] *will be* the context of the formatter.

        try {

            chunk = await this[$CONTEXT].formatter(chunk instanceof Buffer ? chunk.toString() : chunk)
        }
        catch (e) {

            chunk = 'Calling the formatter: "' + this[$CONTEXT].formatter.toString() + '" failed.  Logging error instead: ' + e;
            console.error(chunk);
        }

        callback(null, chunk);
    }
}

class Level extends Transform {

    constructor(level, options = {}) {
        super({ ...options, ...{ writableObjectMode: true, readableObjectMode: true, autoDestroy: false, emitClose: false } });

        this[$LEVEL] = level;
    }

    pipe(stream, options) {

        try {
            if (!this._readableState.pipes.includes(stream)) {

                return super.pipe(steam, options);
            }
            else {

                return stream;
            }
        }
        catch (e) {

            if (!(this._readableState.pipes === stream)) {

                return super.pipe(stream, options);
            }
            else {
                return stream;
            }
        }
    }

    _transform(chunk, encoding, callback) {
        this.push(chunk);
        callback();
    }
}


class Logger {

    constructor(config = { stack: false, level: null }) {

        this.level = config.level ? config.level : {
            error: new Level('ERROR'),
            warn: new Level('WARN'),
            info: new Level('INFO'),
            debug: new Level('DEBUG')
        }

        this.stack = config.stack === true ? true : false;

        let last;

        Object.keys(this.level).forEach((level) => {

            super[level] = function (chunk) {
                //  Add the log level function to the prototype of the logger.

                switch (typeof chunk) {
                    case 'string':
                    case 'number':
                    case 'bigint':
                    case 'boolean':
                        chunk = Buffer.from(chunk.toString());
                    default:
                }
                //  At this point chunk must be an object.
                //  Now that chunk is an object Symbol properties can be set on it.

                if (this.stack) {
                    chunk[$STACK] = Error().stack;
                }
                //  NB: The stack trace needs to parsed into a line number, etc.

                chunk[$LEVEL] = level.toUpperCase();

                this.level[level].write(chunk);
            }

            this.level[level].on('error', this._error);

            if (last) {
                last.pipe(this.level[level]);
            }

            last = this.level[level];
        });
    }

    _error(e) {
        console.error(e);
    }
}

module.exports = {
    Logger: Logger,
    Formatter: Formatter,
    Level: Level
};