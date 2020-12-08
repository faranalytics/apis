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

const { exec, spawn } = require('child_process');

class RegexAPI {

    constructor() {

        this.api = this.node.bind(this);

        this.env = {
            'PATH': process.env.PATH
        }
    }

    node({ regexInput, textInput }, ctx) {

        try {

            let regex = new RegExp(regexInput, 'g');

            let matches = [...textInput.matchAll(regex)].map(

                x => ({ match: x[0], index: x.index })
            );

            return matches;
        }
        catch {

        }
    }

    async python(request, ctx) {

        try {

            let results = await new Promise((r, j) => {

                try {

                    _fs.writeFileSync(__dirname + '/input.json', JSON.stringify(request));

                    exec('python3 index.py',
                        {
                            'env': this.env,
                            'cwd': __dirname
                        },
                        (error, stdout, stderr) => {

                            // console.error(error);
                            // console.error(stderr);
                            // console.error(stdout);

                            try {

                                if (error) {

                                    throw new Error(error);
                                }

                                let results = JSON.parse(_fs.readFileSync(__dirname + '/output.json'));

                                r(results);
                            }
                            catch (e) {

                                j(e)
                            }
                        });
                }
                catch (e) {

                    j(e)
                }
            });

            return results;
        }
        catch (e) {

            console.error(e);
        }
    }
}

module.exports = RegexAPI;

//{regexInput: "a", textInput: "b", lang: "python"}
// console.log(_util.inspect(new RegexAPI));
// console.log((new RegexAPI).api)

// let regexAPI = new RegexAPI();

// console.log(_util.inspect(

//     regexAPI.node({regexInput: "(?:is|a)", textInput: "This is a string.", lang: "python"}))

// );

// (async function(){
//     console.log(await regexAPI.python({regexInput: "(?:a|is)", textInput: "This is a string."}))
// }())

//console.log(JSON.parse("{\"regexInput\": \"(?:is|a)\", \"textInput\": \"This is a string.\"}"))