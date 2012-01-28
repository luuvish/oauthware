/*!
 * OAuthware - Middleware - Linkedin
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


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

  oauth['v1.0a'].call(this, options, defaults);
}

Linkedin.prototype = Object.create(oauth['v1.0a'].prototype);
Linkedin.prototype.constructor = Linkedin;

// login : data.type = 'text/plain'
// auth : data.type === 'text/plain'

Linkedin.prototype.api = function api(handle) {
  var options = {
    'headers': {
      'x-li-format': 'json'
    }
  };

  oauth['v1.0a'].prototype.api.call(this, handle, options);
};
