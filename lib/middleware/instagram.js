/*!
 * OAuthware - Service - Instagram
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Instagram;


function Instagram(options) {
  if (!(this instanceof Instagram)) {
    return new Instagram(options);
  }

  options = this.merge(options, {
    name: 'instagram',
    host: {
      'access_token': 'https://api.instagram.com/oauth/access_token',
      'authorize':    'https://api.instagram.com/oauth/authorize',
      'api':          'https://api.instagram.com/v1'
    }
  });

  oauth['v2.0'].call(this, options);
};

Instagram.prototype = Object.create(oauth['v2.0'].prototype);
Instagram.prototype.constructor = Instagram;
