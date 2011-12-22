/*!
 * Connect
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var connect = require('connect'),
    fs      = require('fs');

exports = module.exports = OAuthware;

exports.version = '0.1.1';

function OAuthware() {}

OAuthware.router = function router(options) {
  var server = connect.createServer();

  for (var key in options) {
    if (key === 'Twitter') {
      server.use(connect.router(new OAuthware.Twitter(options[key])));
    }
    if (key === 'Facebook') {
      server.use(connect.router(new OAuthware.Facebook(options[key])));
    }
  }

  return server;
};

/**
 * Auto-load consumer middlewares
 */

fs.readdirSync(__dirname + '/consumer').forEach(function (filename) {
  if (/\.js$/.test(filename)) {
    var name = filename.substring(0, filename.lastIndexOf('.'));
    var camelCaseName = name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
    Object.defineProperty(OAuthware, camelCaseName, { 
      get : function() {
        return require('./consumer/' + name);
      },
      enumerable : true
    });
  }
});
