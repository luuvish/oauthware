/*!
 * OAuthware
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var middleware = require('./middleware'),
    connect    = require('connect'),
    fs         = require('fs');

exports = module.exports = createServer;

exports.version = '0.2.4';


var OAuthware = function OAuthware(middleware) {
  if (!(this instanceof OAuthware)) {
    return new OAuthware(middleware);
  }

  connect.HTTPServer.call(this, []);

  if ('object' === typeof middleware[0]) {
    this.options = middleware.shift();
  }

  middleware.forEach(function (handle) {
    if ('function' === typeof handle) {
      this.use(handle);
    } else if (Array.isArray(handle)) {
      this.use(handle[0], handle[1]);
    } else if ('object' === typeof handle) {
      this.use(handle.route, handle.handle);
    }
  }, this);
};

OAuthware.prototype = Object.create(connect.HTTPServer.prototype);
OAuthware.prototype.constructor = OAuthware;

OAuthware.prototype.use = function (route, handle) {
  return connect.HTTPServer.prototype.use.call(this, route, handle);
};


function createServer() {
  return new OAuthware(Array.prototype.slice.call(arguments));
}

// support oauthware.createServer()

exports.createServer = createServer;

// auto-load getters

exports.middleware = {};

/**
 * Auto-load bundled middleware with getters.
 */

fs.readdirSync(__dirname + '/middleware').forEach(function (filename) {
  if (/\.js$/.test(filename)) {
    var name = filename.substring(0, filename.lastIndexOf('.'));
    Object.defineProperty(exports.middleware, name, {
      get: function () {
        var provider = require('./middleware/' + name);
        return function (options) {
          return middleware(provider.apply(null, Array.prototype.slice.call(arguments)));
        };
      },
      enumerable: true
    });
  }
});

// expose getters as first-class exports

for (var key in exports.middleware) {
  exports[key] = exports.middleware[key];
}
