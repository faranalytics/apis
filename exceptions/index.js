const _path = require('path');

const HTTP_RESPONSE = require(_path.resolve('controllers/http/http_response.json'))

class HTTPResponse extends Error {
    constructor(code, message) {
        super(typeof message == 'undefined' ? HTTP_RESPONSE[code] : message);
        this.code = code;
    }

    toString() {
        return HTTP_RESPONSE[this.code];
    }
}

class NoNegotiate extends Error {
    constructor() {
        super('NoNegotiate');
    }

    toString() {
        return super.constructor.name;
    }
}

module.exports = { HTTPResponse: HTTPResponse, NoNegotiate: NoNegotiate }