/*!
 * OAuthware - Service - Foursquare
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth   = require('../oauth'),
    request = require('../oauth/request');


exports = module.exports = Foursquare;


function Foursquare(options) {
  if (!(this instanceof Foursquare)) {
    return new Foursquare(options);
  }

  options = this.merge(options, {
    name: 'foursquare',
    host: {
      'access_token': 'https://foursquare.com/oauth2/access_token',
      'authorize':    'https://foursquare.com/oauth2/authenticate',
      'api':          'https://api.foursquare.com/v2'
    }
  });

  oauth['v2.0'].call(this, options);
};

Foursquare.prototype = Object.create(oauth['v2.0'].prototype);
Foursquare.prototype.constructor = Foursquare;

// Foursquare.prototype.auth : data.type === 'text/plain'

Foursquare.prototype.api = function api(handler) {
  var self = this,
      sess = handler.session();

  if ('undefined' === typeof sess['access_token']) {
    handler.json({});
    return;
  }

  options = self.merge({
    method: handler.method,
    url:    self.host['api'] + handler.params,
    query:  {oauth_token: sess['access_token']}
  }, self.additional['api']);

  request(options, function(err, data) {
    if (err) return; //handle.error(err);

    data = self.mime(data);
    handler.json(data);
  });
};
