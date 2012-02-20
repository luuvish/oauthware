/*!
 * OAuthware - Service - Dwolla
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Dwolla;


function Dwolla(options) {
  if (!(this instanceof Dwolla)) {
    return new Dwolla(options);
  }

  options = this.merge(options, {
    name: 'dwolla',
    host: {
      'access_token': 'https://graph.facebook.com/oauth/access_token',
      'authorize':    'https://www.facebook.com/dialog/oauth',
      'logout':       'https://www.facebook.com/logout.php',
      'api':          'https://graph.facebook.com'
    }
  });

  oauth['v2.0'].call(this, options);
};

Dwolla.prototype = Object.create(oauth['v2.0'].prototype);
Dwolla.prototype.constructor = Dwolla;

// Dwolla.prototype.auth : data.type === 'text/plain'
// Dwolla.prototype.api : data.type === 'application/json'
