/*!
 * OAuthware - Service - Readability
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Readability;


function Readability(options) {
  if (!(this instanceof Readability)) {
    return new Readability(options);
  }

  options = this.merge(options, {
    name: 'readability',
    host: {
      'request_token': 'https://api.twitter.com/oauth/request_token',
      'access_token':  'https://api.twitter.com/oauth/access_token',
      'authorize':     'https://api.twitter.com/oauth/authorize',
      'logout':        'https://api.twitter.com/1/account/end_session.json',
      'api':           'https://api.twitter.com/1'
    },
    additional: {
      'authorize': {'force_login': 'true'}
    }
  });

  oauth['v1.0a'].call(this, options);
}

Readability.prototype = Object.create(oauth['v1.0a'].prototype);
Readability.prototype.constructor = Readability;

// Readability.prototype.login : data.type === 'text/html'
// Readability.prototype.logout : data.type === 'application/json'
// Readability.prototype.auth : data.type === 'text/html'
// Readability.prototype.api : data.type === 'application/json'
