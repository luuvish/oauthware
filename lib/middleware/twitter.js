/*!
 * OAuthware - Middleware - Twitter
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauthcore   = require('../oauth/oauthcore'),
    OAuth1      = require('../oauth/oauth1'),
    parse       = require('url').parse,
    querystring = require('querystring');


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
      'signout':       'https://api.twitter.com/1/account/end_session.json',
      'api':           'https://api.twitter.com/1'
    }
  };

  OAuth1.call(this, options, defaults);
}

Twitter.prototype = Object.create(OAuth1.prototype);
Twitter.prototype.constructor = Twitter;

Twitter.prototype.signIn = function signIn(req, res, next) {
  OAuth1.prototype.login.call(this, req, res, next);
  // data.type = 'text/html'
};

Twitter.prototype.signOut = function signOut(req, res, next) {
  OAuth1.prototype.logout.call(this, req, res, next);
  // data.type = 'application/json'
};

Twitter.prototype.authenticate = function authenticate(req, res, next) {
  OAuth1.prototype.auth.call(this, req, res, next);
  // data.type = 'text/html'
};

Twitter.prototype.api = function api(req, res, next) {
  OAuth1.prototype.api.call(this, req, res, next);
  // data.type = 'application/json'
};
