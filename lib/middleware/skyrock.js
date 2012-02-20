/*!
 * OAuthware - Service - Skyrock
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Skyrock;


function Skyrock(options) {
  if (!(this instanceof Skyrock)) {
    return new Skyrock(options);
  }

  options = this.merge(options, {
    name: 'skyrock',
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

Skyrock.prototype = Object.create(oauth['v1.0a'].prototype);
Skyrock.prototype.constructor = Skyrock;

// Skyrock.prototype.login : data.type === 'text/html'
// Skyrock.prototype.logout : data.type === 'application/json'
// Skyrock.prototype.auth : data.type === 'text/html'
// Skyrock.prototype.api : data.type === 'application/json'
