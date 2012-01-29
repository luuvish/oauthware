/*!
 * OAuthware - Service - Github
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Github;


function Github(options) {
  if (!(this instanceof Github)) {
    return new Github(options);
  }

  options = this.merge(options, {
    name: 'github',
    host: {
      'access_token': 'https://github.com/login/oauth/access_token',
      'authorize':    'https://github.com/login/oauth/authorize',
      'api':          'https://api.github.com'
    }
  });

  oauth['v2.0'].call(this, options);
};

Github.prototype = Object.create(oauth['v2.0'].prototype);
Github.prototype.constructor = Github;

// Github.prototype.auth : data.type === 'application/x-www-form-urlencoded'
// Github.prototype.api : data.type === 'application/json'
