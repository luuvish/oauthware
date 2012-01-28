/*!
 * OAuthware - Middleware - Tumblr
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth1a = require('../oauth')['v1.0a'];


exports = module.exports = Tumblr;


function Tumblr(options) {
  if (!(this instanceof Tumblr)) {
    return new Tumblr(options);
  }

  var defaults = {
    name: 'tumblr',
    host: {
      'request_token': 'http://www.tumblr.com/oauth/request_token',
      'access_token':  'http://www.tumblr.com/oauth/access_token',
      'authorize':     'http://www.tumblr.com/oauth/authorize',
      'api':           'http://api.tumblr.com/v2'
    }
  };

  OAuth1a.call(this, options, defaults);
}

Tumblr.prototype = Object.create(OAuth1a.prototype);
Tumblr.prototype.constructor = Tumblr;

Tumblr.prototype.login = function login(handle) {
  OAuth1a.prototype.login.call(this, handle);
  // data.type = 'text/html'
};

Tumblr.prototype.logout = function logout(handle) {
  OAuth1a.prototype.logout.call(this, handle);
  // data.type = 'application/json'
};

Tumblr.prototype.auth = function auth(handle) {
  OAuth1a.prototype.auth.call(this, handle);
  // data.type = 'text/html'
};

Tumblr.prototype.api = function api(handle) {
  OAuth1a.prototype.api.call(this, handle);
  // data.type = 'application/json'
};
