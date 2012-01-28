/*!
 * OAuthware - Middleware - Twitter
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


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

  oauth['v1.0a'].call(this, options, defaults);
}

Twitter.prototype = Object.create(oauth['v1.0a'].prototype);
Twitter.prototype.constructor = Twitter;

Twitter.prototype.login = function login(handle) {
  var query = {
    force_login: 'true'
  };

  oauth['v1.0a'].prototype.login.call(this, handle, query);
  // data.type = 'text/html'
};

// logout : data.type = 'application/json'
// auth : data.type = 'text/html'
// api : data.type = 'application/json'
