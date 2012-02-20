/*!
 * OAuthware - Service - Evernote
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Evernote;


function Evernote(options) {
  if (!(this instanceof Evernote)) {
    return new Evernote(options);
  }

  options = this.merge(options, {
    name: 'evernote',
    host: {
      'request_token': 'https://www.evernote.com/oauth',
      'access_token':  'https://www.evernote.com/oauth',
      'authorize':     'https://www.evernote.com/oauth/OAuth.action',
      'api':           'https://www.evernote.com/1'
    }
  });

  oauth['v1.0'].call(this, options);
}

Evernote.prototype = Object.create(oauth['v1.0'].prototype);
Evernote.prototype.constructor = Evernote;

// Evernote.prototype.login : data.type === 'text/html'
// Evernote.prototype.logout : data.type === 'application/json'
// Evernote.prototype.auth : data.type === 'text/html'
// Evernote.prototype.api : data.type === 'application/json'
