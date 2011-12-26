/*!
 * OAuthware
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var connect = require('connect'),
    fs      = require('fs');

exports = module.exports = createServer;

exports.version = '0.1.5';


function createServer() {
  return connect.createServer.apply(connect, Array.prototype.slice.call(arguments));
}

// support oauthware.createServer()

exports.createServer = createServer;

// auto-load getters

exports.middleware = {};

/**
 * Auto-load bundled middleware with getters.
 */

fs.readdirSync(__dirname + '/consumer').forEach(function(filename){
  if (/\.js$/.test(filename)) {
    var name = filename.substring(0, filename.lastIndexOf('.'));
    Object.defineProperty(exports.middleware, name, {
      get: function () {
        return require('./consumer/' + name);
      },
      enumerable: true
    });
  }
});

// expose getters as first-class exports

for (var key in exports.middleware) {
  exports[key] = exports.middleware[key];
}
