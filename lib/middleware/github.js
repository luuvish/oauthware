/*!
 * OAuthware - Middleware - Github
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth2 = require('../oauth').OAuth2;


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

Github.prototype.login = function login(handle) {
  OAuth2.prototype.login.call(this, handle);
};

Github.prototype.logout = function logout(handle) {
  OAuth2.prototype.logout.call(this, handle);
};

Github.prototype.auth = function auth(handle) {
  OAuth2.prototype.auth.call(this, handle);
  // data.type = 'application/x-www-form-urlencoded'
};

Github.prototype.api = function api(handle) {
  OAuth2.prototype.api.call(this, handle);
  // data.type == 'application/json'
};
