/*!
 * OAuthware - Middleware - Instagram
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


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

  oauth['v2.0'].call(this, options, defaults);
};

Instagram.prototype = Object.create(oauth['v2.0'].prototype);
Instagram.prototype.constructor = Instagram;

Instagram.prototype.login = function login(handle) {
  var query = {
    'response_type': 'code'
  };

  oauth['v2.0'].prototype.login.call(this, handle, query);
};

Instagram.prototype.auth = function auth(handle) {
  var options = {
    'grant_type': 'authorization_code'
  };

  oauth['v2.0'].prototype.auth.call(this, handle, options);
};
