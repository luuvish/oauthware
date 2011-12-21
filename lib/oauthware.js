/*!
 * Connect
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');

module.exports = OAuthware;

function OAuthware() {}

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
