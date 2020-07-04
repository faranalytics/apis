"use strict";

// CLEANUP THE UNUSED REGEX.
const regexCharset = {
    'specialCharacters': ['[', '\\', '^', '$', '.', '|', '?', '*', '+', '(', ')'],

    'charClassSpecialCharacters': ['[', ']', '\\', '^', '-'],
}


const httpCharset = {}

//  OCTET = <any 8-bit sequence of data>
httpCharset['OCTET'] = String.fromCharCode(...Array(255).keys()).split('')

//  CHAR = <any US-ASCII character (octets 0 - 127)>
httpCharset['CHAR'] = httpCharset['OCTET'].slice(0, 128)

//  CTL = <any US-ASCII control character (octets 0 - 31) and DEL (127)>
httpCharset['CTL'] = httpCharset['OCTET'].slice(0, 32).concat(httpCharset['OCTET'][127])

//  separators = "(" | ")" | "<" | ">" | "@" | "," | ";" | ":" | "\" | <"> | "/" | "[" | "]" | "?" | "=" | "{" | "}" | SP | HT
httpCharset['separators'] = ['(', ')', '<', '>', '@', ',', ';', ':', '\\', '"', '/', '[', ']', '?', '=', '{', '}', ' ', String.fromCharCode(9)]


const httpRegexComponent = {}

//  token = 1*<any CHAR except CTLs or separators>
httpRegexComponent['token'] = '[' + httpCharset['CHAR'].filter((x) => !(httpCharset['separators'].includes(x) || httpCharset['CTL'].includes(x)))
    .map((x) => regexCharset['charClassSpecialCharacters'].includes(x) ? '\\' + x : x)
    .join('') + ']+';

httpRegexComponent['quoted-pair'] = (
    '(?:\\\\[' +
    httpCharset['CHAR'].map((x) => regexCharset['charClassSpecialCharacters'].includes(x) ? '\\' + x : x)
        .join('') +
    '])');

httpRegexComponent['qdtext'] = (
    /*TEXT*/ '(?:[' +
    httpCharset['OCTET'].filter((x) => !httpCharset['CTL'].includes(x)) /*TEXT*/
        .filter((x) => x !== '"')
        .map((x) => regexCharset['charClassSpecialCharacters'].includes(x) ? '\\' + x : x)
        .join('') + '])'
);

httpRegexComponent['quoted-string'] = ('"(?:' + httpRegexComponent['quoted-pair'] + '|' +  httpRegexComponent['qdtext'] + '|' + '(?:\\r\\n(?=[ \\t])|[ \\t])' + ')*"')

httpRegexComponent['value'] = (
    '(?<==)(?:' + httpRegexComponent['token'] + '|' + httpRegexComponent['quoted-string'] + ')'
)

httpRegexComponent['qvalue'] = '(?<=\\=)(?:0(?:.[0-9]{0,3})?|1(?:.0{0,3})?)'

const compiledHTTPRegex = {}

// token = 1*<any CHAR except CTLs or separators>
compiledHTTPRegex['token'] = new RegExp(httpRegexComponent['token'])

compiledHTTPRegex['value'] = new RegExp(httpRegexComponent['value'])

compiledHTTPRegex['parameter'] = new RegExp('(?!q=)' + httpRegexComponent['token'] + '=' + httpRegexComponent['value'], 'g')

compiledHTTPRegex['q'] = new RegExp('(?=q=)' + httpRegexComponent['token'] + '=' + httpRegexComponent['qvalue'], 'g')

compiledHTTPRegex['accept-extension'] = new RegExp(httpRegexComponent['token'] + '(?:=' + httpRegexComponent['value'] + ')?', 'g')

// Linear white space(LWS) MUST NOT be used between the type and subtype, nor between an attribute and its value.
compiledHTTPRegex['media-range'] = new RegExp(
    '(?<=^|,)' +

    '(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?' +

    '(?<accept>' + 

    '(?<type>' + httpRegexComponent['token'] + ')' +

    '/' +

    '(?<subtype>' + httpRegexComponent['token'] + ')' +

    '(?<params>' +

    '(?<parameter>' +
    // 0 or more parameter.
    '(?:' + 
    '(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?;(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?' + // LWS
    '(?!q=)' + httpRegexComponent['token'] + '=' + httpRegexComponent['value'] +
    ')*' + 
    ')?' + // parameter

    '(?<q>' + // 1 q-value.
    '(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?;(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?' + // LWS
    '(?=q=)' + httpRegexComponent['token'] + '=' + httpRegexComponent['qvalue'] +
    ')?' + // <q>

    '(?<accept_extension>' +
    '(?:' + 
    '(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?;(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?' + // LWS
    httpRegexComponent['token'] + '(?:' + '=' + httpRegexComponent['value'] + ')' + 
    ')*' + 
    ')?' + // accept_extension

    ')' + //params

    ')' + //accept

    '(?:\\r\\n(?=[ \\t]+)|[ \\t]+)?' +

    '(?=,|$)'
    , 'g')

module.exports.compiledHTTPRegex = compiledHTTPRegex;

// let accept = 'text/html,application/xhtml+xml,application/xml;q=0.9;a="12",image/webp;b="111",image/apng,*/*;q=0.8, application/signed-exchange;v=b3;q=0.1 ; abc="123 \"  123" ';

// console.log([...accept.matchAll(compiledHTTPRegex['media-range'])]);

// let text = '"123 \\"  123"';

// httpRegexComponent['quoted-string'] = ('"(?:' + httpRegexComponent['quoted-pair'] + '|' +  httpRegexComponent['qdtext'] + ')*"')

// console.log([...text.matchAll(new RegExp(httpRegexComponent['quoted-string'], 'g'))]);

// // console.log([...text.matchAll(new RegExp(httpRegexComponent['quoted-pair'], 'g'))]);

// // console.log(httpRegexComponent['quoted-pair']);

// console.log(httpRegexComponent['qdtext'])
// console.log(httpRegexComponent['quoted-pair'])

// let test = '"(?:\\\\[!"#$%&()*+,\\-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\[\\\\\\]\\^_`abcdefghijklmnopqrstuvwxyz{|}~]|' + '(?:[123 \\\\])' + ')*"';

// console.log([...text.matchAll(new RegExp(test))]);
// console.log(test)
// console.log(httpRegexComponent['qdtext'])
