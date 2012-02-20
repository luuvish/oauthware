/*!
 * OAuthware - Service - Angellist
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Angellist;


function Angellist(options) {
  if (!(this instanceof Angellist)) {
    return new Angellist(options);
  }

  options = this.merge(options, {
    name: 'angellist',
    host: {
      'access_token': 'https://angel.co/api/oauth/token',
      'authorize':    'https://angel.co/api/oauth/authorize',
      'api':          'https://api.angel.co/1'
    }
  });

  oauth['v2.0'].call(this, options);
};

Angellist.prototype = Object.create(oauth['v2.0'].prototype);
Angellist.prototype.constructor = Angellist;

// Angellist.prototype.auth : data.type === 'text/plain'
// Angellist.prototype.api : data.type === 'application/json'
