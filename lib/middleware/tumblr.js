/*!
 * OAuthware - Service - Tumblr
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuth1a = require('../oauth')['v1.0a'];


exports = module.exports = Tumblr;


function Tumblr(options) {
  if (!(this instanceof Tumblr)) {
    return new Tumblr(options);
  }

  options = this.merge(options, {
    name: 'tumblr',
    host: {
      'request_token': 'http://www.tumblr.com/oauth/request_token',
      'access_token':  'http://www.tumblr.com/oauth/access_token',
      'authorize':     'http://www.tumblr.com/oauth/authorize',
      'api':           'http://api.tumblr.com/v2'
    },
    additional: {
      'request_token': {'oauth': {'realm': 'http://www.tumblr.com'}}
    }
  });

  OAuth1a.call(this, options);
}

Tumblr.prototype = Object.create(OAuth1a.prototype);
Tumblr.prototype.constructor = Tumblr;
