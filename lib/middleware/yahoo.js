/*!
 * OAuthware - Service - Yahoo
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Yahoo;


function Yahoo(options) {
  if (!(this instanceof Yahoo)) {
    return new Yahoo(options);
  }

  options = this.merge(options, {
    name: 'yahoo',
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

Yahoo.prototype = Object.create(oauth['v1.0a'].prototype);
Yahoo.prototype.constructor = Yahoo;

// Yahoo.prototype.login : data.type === 'text/html'
// Yahoo.prototype.logout : data.type === 'application/json'
// Yahoo.prototype.auth : data.type === 'text/html'
// Yahoo.prototype.api : data.type === 'application/json'
