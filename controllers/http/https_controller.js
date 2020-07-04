"use strict";

const _fs = require('fs')

const _https = require('https')

const HttpController = require('./http_controller.js')

const Context = require('./context.js')

module.exports = class HttpsController extends HttpController {

  constructor(serverConfig) {

    super(serverConfig)

  }

  start() {

    this.key = _fs.readFileSync(this.keyPath)

    this.cert = _fs.readFileSync(this.certPath)

    this.httpsServer = _https.createServer({ cert: this.cert, key: this.key })

    this.httpsServer.on('request', this.httpServerRequest.bind(this))

    this.httpsServer.on('error', this.httpServerError.bind(this))

    this.httpsServer.listen(this.port)
  }
}