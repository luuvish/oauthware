/*!
 * OAuthware - Service - Vkontakte
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Vkontakte;


function Vkontakte(options) {
  if (!(this instanceof Vkontakte)) {
    return new Vkontakte(options);
  }

  options = this.merge(options, {
    name: 'vkontakte',
    host: {
      'access_token': 'https://graph.facebook.com/oauth/access_token',
      'authorize':    'https://www.facebook.com/dialog/oauth',
      'logout':       'https://www.facebook.com/logout.php',
      'api':          'https://graph.facebook.com'
    }
  });

  oauth['v2.0'].call(this, options);
};

Vkontakte.prototype = Object.create(oauth['v2.0'].prototype);
Vkontakte.prototype.constructor = Vkontakte;

// Vkontakte.prototype.auth : data.type === 'text/plain'
// Vkontakte.prototype.api : data.type === 'application/json'
