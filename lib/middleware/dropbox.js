/*!
 * OAuthware - Service - Dropbox
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Dropbox;


function Dropbox(options) {
  if (!(this instanceof Dropbox)) {
    return new Dropbox(options);
  }

  options = this.merge(options, {
    name: 'dropbox',
    host: {
      'request_token': 'https://api.dropbox.com/1/oauth/request_token',
      'access_token':  'https://api.dropbox.com/1/oauth/access_token',
      'authorize':     'https://www.dropbox.com/1/oauth/authorize',
      'api':           'https://api.dropbox.com/1'
    }
  });

  oauth['v1.0'].call(this, options);
}

Dropbox.prototype = Object.create(oauth['v1.0'].prototype);
Dropbox.prototype.constructor = Dropbox;
