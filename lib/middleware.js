/*!
 * Middleware
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Handler = require('./handler'),
    connect = require('connect');


exports = module.exports = Middleware;


function Middleware(middleware) {
  var handle, router;

  handle = function (req, res, next) {
    return router(req, res, next);
  };

  handle.router = function (fn) {
    router = connect.router.call(handle, fn);
    return handle;
  };

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
