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
const { match } = require('assert');

class RegexAPI {

    constructor() {

        this.api = this.node.bind(this);
    }

    node({ regexInput, textInput }, ctx) {

        let matches = [...textInput.matchAll(new RegExp(regexInput, 'g'))].map(
            x => ({ match: x[0], index: x.index })
        );

        return matches;
    }

    python({ regexInput, textInput }, ctx) {

        return "PYTHON TEST";
    }
}

module.exports = RegexAPI;

// {regexInput: "a", textInput: "b", lang: "python"}
// console.log(_util.inspect(new RegexAPI));
// console.log((new RegexAPI).api)

// let regexAPI = new RegexAPI();

// console.log(_util.inspect(

//     regexAPI.node({regexInput: "(?:is|a)", textInput: "This is a string.", lang: "python"}))

// );