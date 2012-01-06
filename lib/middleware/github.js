/*!
 * OAuthware - Middleware - Github
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


exports = module.exports = Github;


function Github(options) {
  if (!(this instanceof Github)) {
    return new Github(options);
  }

  var defaults = {
    name: 'github',
    host: {
      'access_token': 'https://github.com/login/oauth/access_token',
      'authorize':    'https://github.com/login/oauth/authorize',
      'api':          'https://api.github.com'
    }
  };

  OAuth2.call(this, options, defaults);
};

Github.prototype = Object.create(OAuth2.prototype);
Github.prototype.constructor = Github;

Github.prototype.login = function login(req, res, next) {
  OAuth2.prototype.login.call(this, req, res, next);
};

Github.prototype.logout = function logout(req, res, next) {
  var self = this;

  res.writeHead(302, {'Location': self.host['base']});
  res.end();

  self.session(req, {});
};

Github.prototype.auth = function auth(req, res, next) {
  OAuth2.prototype.auth.call(this, req, res, next);
  // data.type = 'application/x-www-form-urlencoded'
};

Github.prototype.api = function api(req, res, next) {
  OAuth2.prototype.api.call(this, req, res, next);
  // data.type == 'application/json'
};
