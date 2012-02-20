/*!
 * OAuthware - Service - Vimeo
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Vimeo;


function Vimeo(options) {
  if (!(this instanceof Vimeo)) {
    return new Vimeo(options);
  }

  options = this.merge(options, {
    name: 'vimeo',
    host: {
      'request_token': 'http://vimeo.com/oauth/request_token',
      'access_token':  'http://vimeo.com/oauth/access_token',
      'authorize':     'http://vimeo.com/oauth/authorize',
      'api':           'http://vimeo.com/api/v2'
    }
  });

  oauth['v1.0a'].call(this, options);
}

Vimeo.prototype = Object.create(oauth['v1.0a'].prototype);
Vimeo.prototype.constructor = Vimeo;

// Vimeo.prototype.login : data.type === 'text/html'
// Vimeo.prototype.logout : data.type === 'application/json'
// Vimeo.prototype.auth : data.type === 'text/html'
// Vimeo.prototype.api : data.type === 'application/json'
