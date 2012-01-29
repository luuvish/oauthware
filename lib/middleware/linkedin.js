/*!
 * OAuthware - Service - Linkedin
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

  options = this.merge(options, {
    name: 'linkedin',
    host: {
      'request_token': 'https://api.linkedin.com/uas/oauth/requestToken',
      'access_token':  'https://api.linkedin.com/uas/oauth/accessToken',
      'authenticate':  'https://api.linkedin.com/uas/oauth/authenticate',
      'authorize':     'https://api.linkedin.com/uas/oauth/authorize',
      'api':           'https://api.linkedin.com/v1'
    },
    additional: {
      'api': {'headers': {'x-li-format': 'json'}}
    }
  });

  oauth['v1.0a'].call(this, options);
}

Linkedin.prototype = Object.create(oauth['v1.0a'].prototype);
Linkedin.prototype.constructor = Linkedin;

// Linkedin.prototype.login : data.type === 'text/plain'
// Linkedin.prototype.auth : data.type === 'text/plain'
