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
  var self, handle;

  self = function (req, res, next) {
    return handle(req, res, next);
  };

  self.router = function (fn) {
    handle = connect.router.call(self, fn);
    return self;
  };

  self.path = middleware.path;

  self.fn = {
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
      app.get(this.path.signIn, this.fn.signIn);
      app.get(this.path.signOut, this.fn.signOut);
      app.get(this.path.auth, this.fn.authenticate);
      app.get(this.path.api, this.fn.api);
    }
  };

  return self.router(self.fn.route);
};
