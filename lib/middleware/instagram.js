/*!
 * OAuthware - Middleware - Instagram
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth2 = require('../oauth').OAuth2;


exports = module.exports = Instagram;


function Instagram(options) {
  if (!(this instanceof Instagram)) {
    return new Instagram(options);
  }

  var defaults = {
    name: 'instagram',
    host: {
      'access_token': 'https://api.instagram.com/oauth/access_token',
      'authorize':    'https://api.instagram.com/oauth/authorize',
      'api':          'https://api.instagram.com/v1'
    }
  };

  OAuth2.call(this, options, defaults);
};

Instagram.prototype = Object.create(OAuth2.prototype);
Instagram.prototype.constructor = Instagram;

Instagram.prototype.login = function login(handle) {
  var query = {
    'response_type': 'code'
  };

  OAuth2.prototype.login.call(this, handle, query);
};

Instagram.prototype.logout = function logout(handle) {
  OAuth2.prototype.logout.call(this, handle);
};

Instagram.prototype.auth = function auth(handle) {
  var options = {
    'grant_type': 'authorization_code'
  };

  OAuth2.prototype.auth.call(this, handle, options);
};

Instagram.prototype.api = function api(handle) {
  OAuth2.prototype.api.call(this, handle);
};
