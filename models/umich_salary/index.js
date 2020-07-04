"use strict"

const _path = require('path');

const _fs = require('fs');

const { log } = require(_path.resolve('log'));

log.debug('Loading the UMICH_SALARY_API.');

const { HTTPResponse } = require(_path.resolve('exceptions'));

const _util = require('util');

Object.assign(_util.inspect.defaultOptions, {
    colors: true,
    depth: null,
    showHidden: true,
    customInspect: false,
    showProxy: true,
    maxArrayLength: null
});

const SOURCE = require('./store.json');

class Search {

    constructor(collection) {

        this.collection = collection;
    }

    search() {

        return (query, ctx) => {

            if (ctx.paths != 0) {
                return this.collection;
                //  The client is trying to access a specific resource and not a search.
                //  Return the entire collection, so path resolution can continue into the *object*.
            }

            query = query.toLowerCase();

            query = query.replace(/[^a-z -]/, '');

            let queries = query.split('');

            query = '^' + queries.join('.{0,2}?') + '.{0,10}?';

            let rgx = new RegExp(query, 'i');

            let response = {};
            //  The response object will contain the filtered keys and their respective values.

            Object.keys(this.collection).forEach((cur, idx, arr) => {

                if (rgx.test(cur.toLowerCase())) {

                    response[cur] = this.collection[cur];
                }
            });

            if (!['campus', 'year', 'department'].includes(ctx.path) && Object.keys(response).length > 200) {
                ctx.res.statusCode = 403;
                return response;
            }

            if (Object.keys(response).length === 0) {

                return undefined;
            }

            return response;
        }
    }
}


let store = {
    campuses: [],
    years: [],
    departments: []
}

function build(store, hier, cur) {

    let record = JSON.stringify(cur);

    let context = store;

    hier.forEach((part, idx, arr) => {

        if (typeof context[part] == 'undefined') {

            context[part] = {};
        }

        if (idx != arr.length - 1 && typeof context[part][cur[part]] == 'undefined') {

            context[part][cur[part]] = {};
        }
        else if (typeof context[part][cur[part]] == 'undefined') {

            context[part][cur[part]] = [];
        }

        if (idx == arr.length - 1) {

            context[part][cur[part]].push(record);
        }

        context = context[part][cur[part]];
    });
}

SOURCE.forEach((cur, idx, arr) => {
    //  For each record in SOURCE, populate the respective
    //  last_name and first_name keys.

    if (!store.campuses.includes(cur['campus'])) {

        store.campuses.push(cur['campus'])
    }

    if (!store.years.includes(cur['year'])) {

        store.years.push(cur['year'])
    }

    if (!store.departments.includes(cur['department'])) {

        store.departments.push(cur['department'])
    }

    build(store, ['campus', 'year', 'last_name', 'first_name', 'department'], cur);

    build(store, ['campus', 'year', 'department', 'last_name', 'first_name'], cur);

});

store = JSON.stringify(store);
//  For brevity and clarity, we're going to use the JSON object and its parse method in order to replace
//  the department, last_name and first_name keys in store.
//  This happens just once when the module loads.

store = JSON.parse(store, function (key, value) {
    //  At both the last_name key and the first_name keys, 
    //  replace the respective object with a search method that can reference the replaced object.

    if (['campus', 'year', 'department', 'last_name', 'first_name'].includes(key) && typeof value == 'object') {

        let search = new Search(value);

        return search.search();
    }

    return value;
});

let template = _fs.readFileSync(__dirname + '/index.html').toString();

let recents = [];

let searches = 0;

module.exports = {

    api: async function (arg, ctx) {

        ctx.route = store;
        //  This sets the object that will act as the route for the path.

        let rs = await ctx.resolve();
        //  rs is the resulting resource.

        if (ctx.uri.match(/campus\/[^\/]+\/year\/[^\/]+\/last_name\/[^\/]+\/first_name\/[^\/]+\/department\/[^\/]+\/[0-9]+$/) && !recents.includes(rs)) {
            // In this case rs is a record.

            recents.push(JSON.parse(rs));

            if (recents.length > 100) {

                recents.shift();
            }

            searches = searches + 1;

            if (searches == 5) {
                //  At every 5 records returned, save the current state of recents.

                _fs.writeFileSync(__dirname + '/recents.json', JSON.stringify(recents));

                searches = 0;
            }
        }

        return rs;
    },

    'index.html': function (arg, ctx) {

        let trs = []

        try {
            trs = _fs.readFileSync(__dirname + '/recents.json');

            trs = JSON.parse(trs);

            trs = trs.map((cur) => {

                return '<tr><td>' +
                    cur.department +
                    '</td><td>' +
                    cur.first_name +
                    '</td><td>' +
                    cur.last_name +
                    '</td><td>' +
                    cur.ftr +
                    '</td></tr>';
            });


            trs = trs.join('');

            template = template.replace(/(?<=<tbody id\="recents">).*?(?=<\/tbody>)/, trs);
        }
        catch (e) {

        }

        return template;
    }
};

log.debug('UMICH_SALARY_API Loaded.');
