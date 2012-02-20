/*!
 * OAuthware - Service - Justintv
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Justintv;


function Justintv(options) {
  if (!(this instanceof Justintv)) {
    return new Justintv(options);
  }

  options = this.merge(options, {
    name: 'justintv',
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

Justintv.prototype = Object.create(oauth['v1.0a'].prototype);
Justintv.prototype.constructor = Justintv;

// Justintv.prototype.login : data.type === 'text/html'
// Justintv.prototype.logout : data.type === 'application/json'
// Justintv.prototype.auth : data.type === 'text/html'
// Justintv.prototype.api : data.type === 'application/json'
