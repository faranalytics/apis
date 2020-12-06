"use strict";

const _querystring = require('querystring');

module.exports = {

    '*': {

        '*': function ({rep, mediaType}, ctx) {

            if (ctx.url.search.match(/[=&]/)) {

                return _querystring.parse(decodeURIComponent(ctx.url.searchParams.toString()), "&", "=", { maxKeys: 0 });
            }

            return decodeURIComponent(ctx.url.search.replace(/^\?/, ''));
        }
    },

    'application': {

        'json': function ({rep, mediaType}, ctx) {

            console.log(JSON.parse(rep.toString('utf8')));

            return JSON.parse(rep.toString('utf8'));
        },

        // 'x-www-form-urlencoded': async function (rep, mediaType, ctx) {

        //     let searchParams = _querystring.parse(ctx.url.searchParams.toString(), "&", "=", { maxKeys: 0 });

        //     switch (mediaType.mediaRange.parameter.charset) {

        //         case 'utf-8':
        //         default:
        //             rep = _querystring.parse(rep.toString('utf8'));

        //             return Object.assign(rep, searchParams);
        //     }
        // }
    },

    // 'multipart': {

    //     'form-data': function (rep, mediaType, ctx) {

    //         return null;
    //     }
    // }
}