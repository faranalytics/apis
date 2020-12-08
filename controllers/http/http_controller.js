"use strict";

const _http = require('http');

const _url = require('url');

const _fs = require('fs');

const _path = require('path');

const { NO_NEGOTIATE, DEFAULT_ROUTE, HANDLER } = require(_path.resolve('symbols'));

const HTTP_RESPONSE = require(_path.resolve('controllers/http/http_response.json'))

const { HTTPResponse, NoNegotiate } = require(_path.resolve('exceptions'));

const { wrapAsync, tryCallAsync } = require(_path.resolve('lib/try_call'));

const { compiledHTTPRegex } = require(_path.resolve('lib/regex.js'));

const { log } = require(_path.resolve('log'));

module.exports = class HttpController {

  constructor(config) {

    this.routerPath = config.routerPath;

    this.view = config.view;

    this.port = config.port;

    this.address = config.address;

    this.default = config.default;

    this.protocol = 'http';
  };

  start() {

    this.router = require(_path.resolve(this.routerPath));

    this.reqView = require(_path.resolve(this.view.reqViewRouterPath));

    this.resView = require(_path.resolve(this.view.resViewRouterPath));

    this.httpServer = _http.createServer();

    this.httpServer.on('request', this.httpServerRequest.bind(this));

    this.httpServer.on('error', this.httpServerError.bind(this));

    this.httpServer.listen(this.port, this.address);
  }

  stop() {

    this.httpServer.close();
  };

  async httpServerRequest(req, res) {
    //console.log('httpServerRequest');

    try {

      var uri = ((this.protocol + '://') || '') + (req.headers.host || '') + (req.url || '');

      // All  Internet-based HTTP/1.1 servers MUST respond with a 400 (Bad Request)
      // status code to any HTTP/1.1 request message which lacks a Host header field.
      // (https://tools.ietf.org/html/rfc2616#section-14.23)
      if (typeof req.headers.host == 'undefined') {

        //log.debug(uri);

        throw new HTTPResponse(400); // 400 Bad Request
      }

      //log.debug('URI: ' + uri);

      let url = new _url.URL(uri);

      //
      let rep = new Promise((resolve, reject) => {

        let data = [];

        let dataLength = 0;

        req.on('close', () => reject(new HTTPResponse('400')));

        req.on('data', (chunk) => {

          data.push(chunk);

          dataLength = dataLength + chunk.length;
        });

        req.on('end', () => resolve(Buffer.concat(data, dataLength)));
      });
      //  Accumulate the body of the request.

      let requestRep = await this.resolveRequest(req, res, url, uri, rep);
      //  Resolve path of the Content-Type header.

      let modelRep = await this.resolveModel(req, res, url, uri, requestRep);
      //  Resolve path of the URL path.

      let responseRep = await this.resolveResponse(req, res, url, uri, modelRep);
      //  Resolve path of the Accept header.

      let reps = await Promise.all([requestRep, modelRep, responseRep]);
      //  Each of the 3 models are traversed asynchonously.

      res.end(reps[2]);
      //  Send the response.  

    }
    catch (e) {

      if (e instanceof HTTPResponse) {

        switch (e.code) {

          case 400:
          case 404:
          case 406:
          case 415:
          case 500:
          default:

            //log.debug(e.code + ' ' + e.message + '; URI: ' + uri + '; Stack trace: ' + e.stack);
            console.error(e.code + ' ' + e.message + '; URI: ' + uri + '; Stack trace: ' + e.stack);
            res.writeHead(parseInt(e.code), {
              'Content-Length': Buffer.byteLength(e.message),
              'Content-Type': 'text/plain'
            });

            res.end(e.message);

            break;
        }
      }
      else if (e instanceof NoNegotiate) {
        console.log('NoNegotiate')
        //log.warn(e.message);
        //  This happens when a resolved function returns undefined.
        //  It implies that the function will handle content negotiation.
      }
      else {

        res.writeHead(500, {
          'Content-Length': Buffer.byteLength(HTTP_RESPONSE['500']),
          'Content-Type': 'text/plain'
        });

        res.end(HTTP_RESPONSE['500']);

        //log.debug('URI: ' + uri + '; Stack trace: ' + e.stack);
        console.error('URI: ' + uri + '; Stack trace: ' + e.stack);
      }
    }
  };

  async resolveRequest(req, res, url, uri, rep) {

    //log.debug('Request');

    //  rep: resolves to the unencoded Buffer.

    let mediaType = req.headers['content-type'];

    mediaType = typeof mediaType == 'undefined' ? this.default.reqMediaType : mediaType;

    let mediaTypes = this.parseMediaTypes(mediaType);
    //  Parse the media type string from Content-Type into a list of media type objects.

    mediaType = mediaTypes[0];
    //  The Content-Type header should contain a single media type; select the first object.

    if (typeof mediaType == 'undefined') {

      throw new HTTPResponse(415); //  415 Unsupported Media Type
      //  This can happen when a valid default isn't defined.
    }

    let model = this.selectModel(this.reqView, url, req.method);
    //  This selects the view model based on the regex match of hostname and the HTTP method.

    let paths = [mediaType.mediaRange.subtype, mediaType.mediaRange.type].map((x) => x.toLowerCase());

    rep = (async () => ({ rep: await rep, mediaType: mediaType }))();
    //  This is a special usage of the rep variable of the Context class constructor.
    //  Normally, the rep is just the object being passed to a function.  
    //  For requests, the representation is both the data and the mediaType.
    //  Hence, the Promise created by the anonymous async function will resolve once the rep gets resolved.

    let ctx = new Context('Request', req, res, model, model, paths, rep, url, uri, this);

    rep = await ctx.resolve();
    //  This traverses the request model according to the path of the media type.
    //  E.g., If the media type is application/json, 
    //  the traversal may result in a function that processes the JSON into a JavaScript object.

    if (typeof rep == 'undefined') {

      throw new HTTPResponse(415);
    }

    return rep;
  };


  async resolveModel(req, res, url, uri, rep) {

    //log.debug('Model');

    let path = decodeURI(url.pathname);

    if (path.length && path[0] == '/') {

      path = path.substring(1);
      //  This removes the leading "/"" from the pathname.
    }

    let paths = path === '' ? [''] : path.split('/').reverse();
    //  Reverse once instead of shifting multiple times.  
    //  This allows for the path segments to be popped from the array.

    let model = this.selectModel(this.router, url, req.method);

    let ctx = new Context('Model', req, res, model, model, paths, rep, url, uri, this);

    rep = await ctx.resolve();

    if (typeof rep == 'undefined') {
      
      throw new HTTPResponse(404);
    }

    return rep
  }


  async resolveResponse(req, res, url, uri, rep) {

    //log.debug('Response');

    let mediaType = req.headers['accept'];

    mediaType = typeof mediaType == 'undefined' ? this.default.resMediaType : mediaType;

    let mediaTypes = this.parseMediaTypes(mediaType);

    if (mediaTypes.length == 0) {

      throw new HTTPResponse(406);
    }

    mediaTypes = this.sortMediaTypes(mediaTypes)

    let model = this.selectModel(this.resView, url, req.method);

    let media = { rep: rep, mediaType: null }

    rep = (async (media) => {

      media.rep = await media.rep;

      return media;
    })(media);
    //  The mediaType changes on each iteration, so a reference is needed outside the Promise - see below.

    for (mediaType of mediaTypes) {

      let paths = [mediaType.mediaRange.subtype, mediaType.mediaRange.type].map((x) => x.toLowerCase());

      media.mediaType = mediaType;

      let ctx = new Context('Response', req, res, model, model, paths, rep, url, uri, this);
      // rep must be an object of the form {rep, mediaType}.

      let resRep = await ctx.resolve();

      if (typeof resRep == 'undefined') {

        continue;
      }
      else if (resRep instanceof Buffer) {
        //  The response view must return a buffer.
        //  The buffer must be encoded in the specified mediaType.
        //  Because a buffer was returned, it means that the mediaType was found and 
        //  the Content-Type header can be set with the current mediaType.

        if (!res.hasHeader('Content-Type')) {

          res.setHeader('Content-Type', mediaType.mediaRange.type + '/' + mediaType.mediaRange.subtype);
        }

        if (!res.hasHeader('Content-Length')) {

          res.setHeader('Content-Length', resRep.length);
        }

        return resRep;
      }
      else {
        throw new HTTPResponse(406);
        //  Response views do encoding so they must return either a Buffer (that contains the encoded representation) or, 
        //  if the view isn't present, undefined.
      }
    }

    throw new HTTPResponse(406);
    //  The response view must not have returned a Buffer.
  };

  selectModel(router, url, method) {

    //  The model is selected based on the regex match of the hostname and the method of the request.

    //  This can be cached:  Lookup first, then try to find match.
    //  But it can be different for each router.
    let host = Object.keys(router).find(x => url.hostname.match(new RegExp(x, 'i')));

    //  What if the host is not defined? HTTP Error?

    // Get the model from the router.
    let model = router[host][method];

    //  If model is undefined then: 405 Method Not Allowed.
    if (typeof model == 'undefined') {

      //log.debug({ url: url, method: method });

      throw new HTTPResponse(405); // 405 Method Not Allowed
    }

    return model;
  };

  parseMediaTypes(mediaTypes) {

    mediaTypes = [...mediaTypes.matchAll(compiledHTTPRegex['media-range'])];

    mediaTypes = mediaTypes.map((match) => {

      let mediaType = {
        mediaRange: {
          type: match.groups.type,
          subtype: match.groups.subtype,
          parameter: {}
        },
        acceptParam: {
          q: 1,
          acceptExtension: {},
        }
      };

      if (typeof match.groups.parameter != 'undefined') {

        [...match.groups.parameter.matchAll(compiledHTTPRegex['parameter'])].forEach((param) => {

          let parts = param[0].split('=', 2);

          mediaType.mediaRange.parameter[parts[0]] = parts[1];
        });
      }

      if (typeof match.groups.q != 'undefined') {

        let parts = match.groups.q.match(compiledHTTPRegex['q'])[0].split('=', 2);

        mediaType.acceptParam.q = parseFloat(parts[1]);
      }

      if (typeof match.groups['accept_extension'] != 'undefined') {

        [...match.groups['accept_extension'].matchAll(compiledHTTPRegex['accept-extension'])].forEach((param) => {

          let parts = param[0].split('=', 2);

          mediaType.acceptParam.acceptExtension[parts[0]] = parts[1];
        });
      }

      return mediaType;
    });

    return mediaTypes;
  }

  sortMediaTypes(mediaTypes) {

    mediaTypes = mediaTypes.sort((second, first) => {

      if (first.acceptParam.q < second.acceptParam.q)
        return -1

      if (second.acceptParam.q < first.acceptParam.q)
        return 1

      if (first.acceptParam.q === second.acceptParam.q) {

        if (first.mediaRange.type === '*' && second.mediaRange.type !== '*')
          return -1

        if (second.mediaRange.type === '*' && first.mediaRange.type !== '*')
          return 1

        if (first.mediaRange.type !== second.mediaRange.type)
          return 0

        if (first.mediaRange.type === second.mediaRange.type) {

          if (first.mediaRange.subtype === '*' && second.mediaRange.subtype !== '*')
            return -1

          if (second.mediaRange.subtype === '*' && first.mediaRange.subtype !== '*')
            return 1

          if (first.mediaRange.subtype !== second.mediaRange.subtype)
            return 0

          if (first.mediaRange.subtype === second.mediaRange.subtype) {

            firstSpecificity = [
              ...Object.keys(first.mediaRange.parameter),
              ...Object.keys(first.acceptParam.acceptExtension)
            ].length

            secondSpecificity = [
              ...Object.keys(second.mediaRange.parameter),
              ...Object.keys(second.acceptParam.acceptExtension)
            ].length


            if (firstSpecificity < secondSpecificity)
              return -1

            if (secondSpecificity < firstSpecificity)
              return 1

            return 0
          }
        }
      }
    });

    return mediaTypes;
  };

  httpServerError(e) {

    switch (e.code) {

      case 'EADDRINUSE':

      default:

        this.stop();

        setTimeout(() => {

          this.start();
        }, 1000);
    }
  };
};


class Context {

  constructor(name, req, res, model, route, paths, arg, url, uri, server) {

    this.name = name;
    this.req = req;
    this.res = res;
    this.context = model;
    //  The context for function calls.
    this.model = model;
    //  The model object.
    this.route = route;
    //  The present state of the route.
    //  This may start out as the model object.
    this.paths = paths;//.map((cur) => cur.toString().toLowerCase());  //  This could be cleaned here.
    //  An array containing the path to the resource - sorted reverse.
    this.arg = arg;
    //  An argument object that may be spread into a function.
    this.url = url;
    this.uri = uri;
    this.server = server;
    this.path;

    this.resolve = this.resolve.bind(this);
  }

  async resolve() {

    //log.debug(
    // 'Procedure: ' + this.name +
    // '; URI: ' + this.uri +
    // (this.path ? '; Current path: ' + this.path + '; Paths: ' + this.paths : '; Paths: ' + this.paths));
    // console.log(
    //   'Procedure: ' + this.name +
    //   '; URI: ' + this.uri +
    //   (this.path ? '; Current path: ' + this.path + '; Paths: ' + this.paths : '; Paths: ' + JSON.stringify(this.paths))
    // );

    switch (this.route instanceof Buffer ? 'buffer' : typeof this.route) {

      case 'undefined':
        return undefined;
        //  NB:  The meaning of undefined depends on the context.
        //  In the resolveModel function this throws 404, however in resolveResponse
        //  it doesn't.
        break;

      case 'string':
      case 'number':
      case 'bigint':
      case 'boolean':
      case 'buffer':

        if (this.paths.length != 0) {

          return undefined;  //  Primitives and Buffer cannot have paths.
        }

        return this.route;
        break;

      case 'object':

        let symbols = Object.getOwnPropertySymbols(this.route);

        for (let symbol of symbols) {

          this.context = this.route;

          let route = this.route;

          this.route = this.route[symbol];

          await tryCallAsync(this.resolve);

          this.route = route;
        }

        if (this.paths.length === 0) {

          return this.route;
          //  The object could be large.
          //  The response view is reponsible for representing this to the client.
          //  The view may use Media Type characteristics in making a decision (e.g., depth) 
          //  on how the object should be represented.
        }
        else {

          let path = this.paths.pop();

          this.path = path;

          this.context = this.route;
          //  Set the context for a subsequent call to this.resolve.

          this.route = this.route[path];

          return await tryCallAsync(this.resolve);
        }
        break;

      case 'function':

        let rs = await tryCallAsync(this.route.bind(this.context), (this.paths.length == 0 ? await this.arg : undefined), this);
        //  Before calling the function, here we await the function arguments.

        if (rs === null) {
          //  The semantics are that a resource exists, but it is not known (unknown object), which implies
          //  that the function is going to handle content negotiation from here onward.
          throw new NoNegotiate();
        }

        this.route = rs;

        return await tryCallAsync(this.resolve);
        break;

      default:
        throw new HTTPResponse(505);
        break;
    }
  }
}