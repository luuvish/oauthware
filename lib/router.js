/*!
 * Router
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var connect = require('connect'),
    parse   = require('url').parse;


exports = module.exports = Router;


function Router(middleware) {
  var handle, router;

  handle = function (req, res, next) {
    return router(req, res, next);
  };

  handle.router = function (fn) {
    router = connect.router.call(handle, fn);
    return handle;
  };

  handle.name = middleware.name;
  handle.path = middleware.path;

  handle.handle = {
    login: function (req, res, next) {
      middleware.login(new Handler(middleware.name, req, res, next));
    },
    logout: function (req, res, next) {
      middleware.logout(new Handler(middleware.name, req, res, next));
    },
    auth: function (req, res, next) {
      middleware.auth(new Handler(middleware.name, req, res, next));
    },
    api: function (req, res, next) {
      middleware.api(new Handler(middleware.name, req, res, next));
    },
    route: function (app) {
      app.get(this.path.login, this.handle.login);
      app.get(this.path.logout, this.handle.logout);
      app.get(this.path.auth, this.handle.auth);
      app.get(this.path.api, this.handle.api);
      app.put(this.path.api, this.handle.api);
      app.post(this.path.api, this.handle.api);
      app.delete(this.path.api, this.handle.api);
    }
  };

  return handle.router(handle.handle.route);
};


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
