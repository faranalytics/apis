"use strict";

module.exports = {

    "^.*$": {

        "GET": require('./media_types'),

        "POST": require('./media_types')
    }
}