/*!
 * OAuthware - Service - Gowalla
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../oauth');


exports = module.exports = Gowalla;


function Gowalla(options) {
  if (!(this instanceof Gowalla)) {
    return new Gowalla(options);
  }

  options = this.merge(options, {
    name: 'gowalla',
    host: {
      'access_token': 'https://api.gowalla.com/api/oauth/token',
      'authorize':    'https://gowalla.com/api/oauth/new',
      'api':          'https://api.gowalla.com'
    }
  });

  oauth['v2.0'].call(this, options);
};

Gowalla.prototype = Object.create(oauth['v2.0'].prototype);
Gowalla.prototype.constructor = Gowalla;

// Gowalla.prototype.auth : data.type === 'text/plain'

Gowalla.prototype.api = function api(handler) {
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
