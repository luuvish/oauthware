/*!
 * OAuthware - Middleware - Facebook
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauthcore   = require('../oauth/oauthcore'),
    OAuth2      = require('../oauth/oauth2'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = Facebook;


function Facebook(options) {
  if (!(this instanceof Facebook)) {
    return new Facebook(options);
  }

  var defaults = {
    name: 'facebook',
    host: {
      'access_token': 'https://graph.facebook.com/oauth/access_token',
      'authorize':    'https://www.facebook.com/dialog/oauth',
      'signout':      'https://www.facebook.com/logout.php',
      'api':          'https://graph.facebook.com'
    }
  };

  OAuth2.call(this, options, defaults);
};

Facebook.prototype = Object.create(OAuth2.prototype);
Facebook.prototype.constructor = Facebook;

Facebook.prototype.login = function login(req, res, next) {
  OAuth2.prototype.login.call(this, req, res, next);
};

Facebook.prototype.logout = function logout(req, res, next) {
  OAuth2.prototype.logout.call(this, req, res, next);
};

Facebook.prototype.auth = function auth(req, res, next) {
  OAuth2.prototype.auth.call(this, req, res, next);
  // data.type == 'text/plain'
};

Facebook.prototype.api = function api(req, res, next) {
  OAuth2.prototype.api.call(this, req, res, next);
  // data.type == 'application/json'
};
