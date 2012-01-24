/*!
 * OAuthware - Middleware - Tumblr
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth1 = require('../oauth').OAuth1;


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

  OAuth1.call(this, options, defaults);
}

Tumblr.prototype = Object.create(OAuth1.prototype);
Tumblr.prototype.constructor = Tumblr;

Tumblr.prototype.login = function login(handle) {
  OAuth1.prototype.login.call(this, handle);
  // data.type = 'text/html'
};

Tumblr.prototype.logout = function logout(handle) {
  OAuth1.prototype.logout.call(this, handle);
  // data.type = 'application/json'
};

Tumblr.prototype.auth = function auth(handle) {
  OAuth1.prototype.auth.call(this, handle);
  // data.type = 'text/html'
};

Tumblr.prototype.api = function api(handle) {
  OAuth1.prototype.api.call(this, handle);
  // data.type = 'application/json'
};
