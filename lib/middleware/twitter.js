/*!
 * OAuthware - Service - Twitter
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Twitter;


function Twitter(options) {
  if (!(this instanceof Twitter)) {
    return new Twitter(options);
  }

  options = this.merge(options, {
    name: 'twitter',
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

Twitter.prototype = Object.create(oauth['v1.0a'].prototype);
Twitter.prototype.constructor = Twitter;

// Twitter.prototype.login : data.type === 'text/html'
// Twitter.prototype.logout : data.type === 'application/json'
// Twitter.prototype.auth : data.type === 'text/html'
// Twitter.prototype.api : data.type === 'application/json'
