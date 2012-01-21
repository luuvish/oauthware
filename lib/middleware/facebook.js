/*!
 * OAuthware - Middleware - Facebook
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth2 = require('../oauth').OAuth2;


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
      'logout':       'https://www.facebook.com/logout.php',
      'api':          'https://graph.facebook.com'
    }
  };

  OAuth2.call(this, options, defaults);
};

Facebook.prototype = Object.create(OAuth2.prototype);
Facebook.prototype.constructor = Facebook;

Facebook.prototype.login = function login(handle) {
  OAuth2.prototype.login.call(this, handle);
};

Facebook.prototype.logout = function logout(handle) {
  OAuth2.prototype.logout.call(this, handle);
};

Facebook.prototype.auth = function auth(handle) {
  OAuth2.prototype.auth.call(this, handle);
  // data.type == 'text/plain'
};

Facebook.prototype.api = function api(handle) {
  OAuth2.prototype.api.call(this, handle);
  // data.type == 'application/json'
};
