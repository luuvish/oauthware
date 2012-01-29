/*!
 * OAuthware - Service - Facebook
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Facebook;


function Facebook(options) {
  if (!(this instanceof Facebook)) {
    return new Facebook(options);
  }

  options = this.merge(options, {
    name: 'facebook',
    host: {
      'access_token': 'https://graph.facebook.com/oauth/access_token',
      'authorize':    'https://www.facebook.com/dialog/oauth',
      'logout':       'https://www.facebook.com/logout.php',
      'api':          'https://graph.facebook.com'
    }
  });

  oauth['v2.0'].call(this, options);
};

Facebook.prototype = Object.create(oauth['v2.0'].prototype);
Facebook.prototype.constructor = Facebook;

// Facebook.prototype.auth : data.type === 'text/plain'
// Facebook.prototype.api : data.type === 'application/json'
