/*!
 * Middleware
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var connect = require('connect');


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
    signIn: function (req, res, next) {
      middleware.signIn(req, res, next);
    },
    signOut: function (req, res, next) {
      middleware.signOut(req, res, next);
    },
    authenticate: function (req, res, next) {
      middleware.authenticate(req, res, next);
    },
    api: function (req, res, next) {
      middleware.api(req, res, next);
    },
    route: function (app) {
      app.get(this.path.signIn, this.handle.signIn);
      app.get(this.path.signOut, this.handle.signOut);
      app.get(this.path.auth, this.handle.authenticate);
      app.get(this.path.api, this.handle.api);
    }
  };

  return handle.router(handle.handle.route);
};
