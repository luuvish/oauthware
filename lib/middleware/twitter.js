/*!
 * OAuthware - Middleware - Twitter
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth1 = require('../oauth').OAuth1;


exports = module.exports = Twitter;


function Twitter(options) {
  if (!(this instanceof Twitter)) {
    return new Twitter(options);
  }

  var defaults = {
    name: 'twitter',
    host: {
      'request_token': 'https://api.twitter.com/oauth/request_token',
      'access_token':  'https://api.twitter.com/oauth/access_token',
      'authenticate':  'https://api.twitter.com/oauth/authenticate',
      'authorize':     'https://api.twitter.com/oauth/authorize',
      'logout':        'https://api.twitter.com/1/account/end_session.json',
      'api':           'https://api.twitter.com/1'
    }
  };

  OAuth1.call(this, options, defaults);
}

Twitter.prototype = Object.create(OAuth1.prototype);
Twitter.prototype.constructor = Twitter;

Twitter.prototype.login = function login(handle) {
  var query = {
    force_login: 'true'
  };

  OAuth1.prototype.login.call(this, handle, query);
  // data.type = 'text/html'
};

Twitter.prototype.logout = function logout(handle) {
  OAuth1.prototype.logout.call(this, handle);
  // data.type = 'application/json'
};

Twitter.prototype.auth = function auth(handle) {
  OAuth1.prototype.auth.call(this, handle);
  // data.type = 'text/html'
};

Twitter.prototype.api = function api(handle) {
  OAuth1.prototype.api.call(this, handle);
  // data.type = 'application/json'
};
