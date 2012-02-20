/*!
 * OAuthware - Service - 37Signals
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Signals37;


function Signals37(options) {
  if (!(this instanceof Signals37)) {
    return new Signals37(options);
  }

  options = this.merge(options, {
    name: '37signals',
    host: {
      'access_token': 'https://graph.facebook.com/oauth/access_token',
      'authorize':    'https://www.facebook.com/dialog/oauth',
      'logout':       'https://www.facebook.com/logout.php',
      'api':          'https://graph.facebook.com'
    }
  });

  oauth['v2.0'].call(this, options);
};

Signals37.prototype = Object.create(oauth['v2.0'].prototype);
Signals37.prototype.constructor = Signals37;

// Signals37.prototype.auth : data.type === 'text/plain'
// Signals37.prototype.api : data.type === 'application/json'
