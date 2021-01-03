"use strict";

const _querystring = require('querystring');

module.exports = {

    '*': {

        '*': function (rep, mediaType, ctx) {

            if (ctx.url.pathname.match(/\.js$/)) {

                mediaType.mediaRange.type = 'text';
                mediaType.mediaRange.subtype = 'javascript';
            }
            else if (ctx.url.pathname.match(/\.css$/)) {

                mediaType.mediaRange.type = 'text';
                mediaType.mediaRange.subtype = 'css';
            }
            //  It is necessary in these cases to set the type and subtype in order for 
            //  resolveResponse to set the correct Content-Type.

            switch (mediaType.mediaRange.parameter.charset) {

                case 'utf-8':
                    return Buffer.from(rep, 'utf8');
                default:
                    return Buffer.from(rep, 'utf8');
            }

        }
    },

    'text': {

        'css': function (rep, mediaType, ctx) {

            switch (mediaType.mediaRange.parameter.charset) {

                case 'utf-8':
                    return Buffer.from(rep, 'utf8');
                default:
                    return Buffer.from(rep, 'utf8');
            }
        },

        'html': function (rep, mediaType, ctx) {

            switch (mediaType.mediaRange.parameter.charset) {

                case 'utf-8':
                    return Buffer.from(rep, 'utf8');
                default:
                    return Buffer.from(rep, 'utf8');
            }
        }
    },

    'application': {

        'json': function (rep, mediaType, ctx) {

            return Buffer.from(JSON.stringify(rep, function (key, value) {

                switch (typeof value) {
                    case 'object':
                    case 'string':
                    case 'number':
                        return value;
                    case 'function':
                        return ctx.url.protocol + '//' + ctx.url.host + ctx.url.pathname.replace(/\/$/, '') + '/' + encodeURI(key) + '?';
                    default:
                        return value;
                }
            }), 'utf8');
            //  Because this is application/json, the encoding should be utf8;
        },

        'x-www-form-urlencoded': function (rep, mediaType, ctx) {

            let qs = _querystring.stringify(rep, "&", "=");

            switch (mediaType.mediaRange.parameter.charset) {

                case 'utf-8':
                    return Buffer.from(qs, 'utf8');
                default:
                    return Buffer.from(qs, 'utf8');
            }
        }
    }
}