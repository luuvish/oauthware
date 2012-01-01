/*!
 * OAuth2
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauthcore   = require('./oauthcore'),
    OAuth0      = require('./oauth0'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = OAuth2;


function OAuth2(options, defaults) {
  OAuth0.call(this, options, defaults);

  this.oauth = {
    'type':          options.type || 'web_server',
    'client_id':     options.clientId || options.appId,
    'client_secret': options.clientSecret || options.appSecret,
    'state':         options.state,
    'scope':         options.scope
  };

  if ('undefined' === typeof this.oauth['client_id']) {
    throw new Error('client_id must be defined');
  }
  if ('undefined' === typeof this.oauth['client_secret']) {
    throw new Error('client_secret must be defined');
  }
  if ('web_server' !== this.oauth['type'] && 'user_agent' !== this.oauth['type']) {
    throw new Error('type must be web_server or user_agent');
  }
}

OAuth2.prototype = Object.create(OAuth0.prototype);
OAuth2.prototype.constructor = OAuth2;

OAuth2.prototype.login = function login(req, res, next) {
  var self = this;
  var sess = self.session(req);
  var query = {
    'type':         self.oauth['type'],
    'client_id':    self.oauth['client_id'],
    'redirect_uri': self.host['callback']
  };

  if ('undefined' !== typeof self.oauth['state']) {
    query['state'] = self.oauth['state'];
  }
  if ('undefined' !== typeof self.oauth['scope']) {
    query['scope'] = self.oauth['scope'];
  }

  res.writeHead(302, {
    'Location': self.host['authorize'] + '?' + querystring.stringify(query)
  });
  res.end();
};

OAuth2.prototype.logout = function logout(req, res, next) {
  var self = this;
  var sess = self.session(req);
  var query = {
    'next':         self.host['base'],
    'access_token': sess['access_token']
  };

  if ('undefined' === typeof sess['access_token']) {
    res.writeHead(302, {'Location': self.host['base']});
  } else {
    res.writeHead(302, {
      'Location': self.host['signout'] + '?' + querystring.stringify(query)
    });
  }
  res.end();

  self.session(req, {});
};

OAuth2.prototype.auth = function auth(req, res, next) {
  var self = this;
  var url = parse(req.url, true);

  (function validate() {
    if ('undefined' === typeof url.query) return false;

    if ('undefined' !== typeof url.query['error']) return false;
      // error MUST be set to user_denied
      // url.query.error = 'access_denied'
      // url.query.error_reason = 'user_denied'
      // url.query.error_description = 'The user denied your request'

    if ('web_server' === self.oauth['type']) {
      if ('undefined' === typeof url.query['code']) return false;
    }

    // Facebook defines response_type=token instead of type=user_agent
    if ('user_agent' === self.oauth['type']) {
      if ('undefined' === typeof url.query['access_token']) return false;
      if ('undefined' !== typeof url.query['expires_in']) {}
    }

    if ('undefined' !== typeof self.oauth['state']) {
      if ('undefined' === typeof url.query['state']) return false;
      if (self.oauth['state'] != url.query['state']) return false;
    }

    return true;
  }());

  if ('user_agent' === self.oauth['type']) {
    self.session(req, {
      'access_token': url.query['access_token'],
      'expires_in':   url.query['expires_in']
    });
    return;
  }

  var options = {
    url: self.host['access_token'],
    body: {
      'type':          self.oauth['type'],
      'client_id':     self.oauth['client_id'],
      'client_secret': self.oauth['client_secret'],
      'redirect_uri':  self.host['callback'],
      'code':          url.query['code']
    }
  };

  oauthcore.post(options, function(err, data) {
    // 400 Bad Request
    // error = 'incorrect_client_credentials'
    // Facebook
    // error.type = 'OAuthException'
    // error.message = 'Error validating verification code.'
    if (err) return next && next(err);

    data = self.mime(data);

    if ('undefined' === typeof data['access_token']) {
      return next && next(err);
    }
    // 'expires_in'
    // 'refresh_token'
    // 'scope'

    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    self.session(req, data);
  });
};

OAuth2.prototype.api = function api(req, res, next) {
  var self = this;
  var sess = self.session(req);

  if ('undefined' === typeof sess['access_token']) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{}');
    return;
  }

  var options = {
    url:   self.host['api'] + req.params,
    query: {access_token: sess['access_token']}
  };

  oauthcore.get(options, function(err, data) {
    res.writeHead(200, {'Content-Type': 'application/json'});

    if (err) return res.end(err);

    data = self.mime(data);
    res.end(JSON.stringify(data));
  });
};
