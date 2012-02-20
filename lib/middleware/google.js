/*!
 * OAuthware - Service - Google
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Google;


function Google(options) {
  if (!(this instanceof Google)) {
    return new Google(options);
  }

  options = this.merge(options, {
    name: 'google',
    host: {
      'access_token': 'https://accounts.google.com/o/oauth2/token',
      'authorize':    'https://accounts.google.com/o/oauth2/auth',
      'api':          'https://www.googleapis.com/oauth2/v1'
    }
  });

  oauth['v2.0'].call(this, options);
};

Google.prototype = Object.create(oauth['v2.0'].prototype);
Google.prototype.constructor = Google;

// Google.prototype.auth : data.type === 'text/plain'
// Google.prototype.api : data.type === 'application/json'
