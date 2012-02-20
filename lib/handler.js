/*!
 * OAuthware - Handler
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var parse = require('url').parse;


exports = module.exports = Handler;

function Handler(name, req, res, next) {
  if (!(this instanceof Handler)) {
    return new Handler(name, req, res, next);
  }

  var url = parse(req.url, true);

  this.name = name;
  this.req  = req;
  this.res  = res;
  this.next = next;

  this.method = req.method;
  this.path   = url.pathname;
  this.query  = url.query;
  this.params = req.params;
}

Handler.prototype.session = function session(data) {
  if (!this.req.session) return {};

  if (!this.req.session.auth) this.req.session.auth = {};
  if (!this.req.session.auth[this.name]) this.req.session.auth[this.name] = {};

  if ('undefined' !== typeof data) this.req.session.auth[this.name] = data;

  return this.req.session.auth[this.name];
};

Handler.prototype.error = function error(err) {
  this.next && this.next(err);
};

Handler.prototype.redirect = function redirect(location) {
  this.res.writeHead(302, {'Location': location});
  this.res.end();
};

Handler.prototype.json = function json(data) {
  var json;

  try {
    json = JSON.stringify(data);
  } catch (e) {
    json = data;
  }

  this.res.writeHead(200, {'Content-Type': 'application/json'});
  this.res.end(json);
};
