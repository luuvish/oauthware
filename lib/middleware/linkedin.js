/*!
 * OAuthware - Middleware - Linkedin
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth1 = require('../oauth').OAuth1;


exports = module.exports = Linkedin;


function Linkedin(options) {
  if (!(this instanceof Linkedin)) {
    return new Linkedin(options);
  }

  var defaults = {
    name: 'linkedin',
    host: {
      'request_token': 'https://api.linkedin.com/uas/oauth/requestToken',
      'access_token':  'https://api.linkedin.com/uas/oauth/accessToken',
      'authenticate':  'https://api.linkedin.com/uas/oauth/authenticate',
      'authorize':     'https://api.linkedin.com/uas/oauth/authorize',
      'api':           'https://api.linkedin.com/v1'
    }
  };

  OAuth1.call(this, options, defaults);
}

Linkedin.prototype = Object.create(OAuth1.prototype);
Linkedin.prototype.constructor = Linkedin;

Linkedin.prototype.login = function login(handle) {
  OAuth1.prototype.login.call(this, handle);
  // data.type = 'text/plain'
};

Linkedin.prototype.logout = function logout(handle) {
  OAuth1.prototype.logout.call(this, handle);
};

Linkedin.prototype.auth = function auth(handle) {
  OAuth1.prototype.auth.call(this, handle);
  // data.type === 'text/plain'
};

Linkedin.prototype.api = function api(handle) {
  var options = {
    'headers': {
      'x-li-format': 'json'
    }
  };

  OAuth1.prototype.api.call(this, handle, options);
};
