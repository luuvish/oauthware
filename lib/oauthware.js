/*!
 * Connect
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Auth = require('./auth_middleware'),
    fs   = require('fs');

module.exports = Auth;

/**
 * Auto-load bundled strategies with getters.
 */
var STRATEGY_EXCLUSIONS = { "base.js"   : true,
                            "base64.js" : true };

var auths = [
  'anonymous.js',
  'basic.js',
  'http.js',
  'digest.js',
  'oauth.js',
  'facebook.js',
  'twitter.js',
  'openid.js'
];

function augmentAuthWithStrategy(filename, path) {
  if (/\.js$/.test(filename) && !STRATEGY_EXCLUSIONS[filename] && filename[0] != '_') {
    var name = filename.substr(0, filename.lastIndexOf('.'));
    var camelCaseName = name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
    Object.defineProperty(Auth, camelCaseName, { 
      get: function() {
        return require('./' + path+ '/' + name);
      },
      enumerable:true
    });
  }
}

//TODO: Meh could make this recurse neatly over directories, but I'm lazy.
fs.readdirSync(__dirname + '/auth.strategies').forEach(function(filename){
  augmentAuthWithStrategy(filename, '/auth.strategies');
});
