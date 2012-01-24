/*!
 * OAuthware - Middleware - Dropbox
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth1 = require('../oauth').OAuth1;


exports = module.exports = Dropbox;


function Dropbox(options) {
  if (!(this instanceof Dropbox)) {
    return new Dropbox(options);
  }

  var defaults = {
    name: 'dropbox',
    host: {
      'request_token': 'https://api.dropbox.com/1/oauth/request_token',
      'access_token':  'https://api.dropbox.com/1/oauth/access_token',
      'authorize':     'https://api.dropbox.com/1/oauth/authorize',
      'api':           'https://api.dropbox.com/1'
    }
  };

  OAuth1.call(this, options, defaults);
}

Dropbox.prototype = Object.create(OAuth1.prototype);
Dropbox.prototype.constructor = Dropbox;

Dropbox.prototype.login = function login(handle) {
  var query = {
    oauth_callback: this.host['callback']
  };

  OAuth1.prototype.login.call(this, handle, query);
  // data.type = 'text/html'
};

Dropbox.prototype.logout = function logout(handle) {
  OAuth1.prototype.logout.call(this, handle);
  // data.type = 'application/json'
};

Dropbox.prototype.auth = function auth(handle) {
  OAuth1.prototype.auth.call(this, handle);
  // data.type = 'text/html'
};

Dropbox.prototype.api = function api(handle) {
  OAuth1.prototype.api.call(this, handle);
  // data.type = 'application/json'
};
