/*!
 * OAuthware - OAuth - OAuth1.0
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var helper      = require('./helper'),
    request     = require('./request'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = OAuth1;


function OAuth1(options, defaults) {
  var self = helper.configure(options, defaults);

  this.name = self.name;
  this.path = self.path;
  this.host = self.host;

  this.oauth = {
    'oauth_consumer_key':     options.consumerKey,
    'oauth_consumer_secret':  options.consumerSecret,
    'oauth_signature_method': 'HMAC-SHA1',
    'oauth_version':          '1.0'
  };

  if ('undefined' === typeof this.oauth['oauth_consumer_key']) {
    throw new Error('oauth_consumer_key must be defined');
  }
  if ('undefined' === typeof this.oauth['oauth_consumer_secret']) {
    throw new Error('oauth_consumer_secret must be defined');
  }
}

OAuth1.prototype.constructor = OAuth1;

OAuth1.prototype.login = function login(handle, opts) {
  var self = this;
  var sess = handle.session();

  var options = {
    'url': self.host['request_token'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  };

  request.post(options, function(err, data) {
    if (err) return handle.error(err);

    data = helper.mime(data);

    var query = {
      oauth_token:    data['oauth_token'],
      oauth_callback: self.host['callback']
    };

    helper.merge(query, opts);

    handle.redirect(self.host['authorize'] + '?' + querystring.stringify(query));
    handle.session(data);
  });
};

OAuth1.prototype.logout = function logout(handle) {
  var self = this;
  var sess = handle.session();

  if ('undefined' === typeof sess['oauth_token'] || !self.host['logout']) {
    handle.redirect(self.host['base']);
    handle.session({});
    return;
  }

  var options = {
    'url': self.host['logout'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  };

  request.post(options, function(err, data) {
    if (err) return handle.error(err);

    data = helper.mime(data);

    handle.redirect(self.host['base']);
    handle.session({});
  });
};

OAuth1.prototype.auth = function auth(handle) {
  var self = this;
  var sess = handle.session();
  var query = handle.query;

  if (!query || !query.oauth_token) {
    return handle.error('error');
  }

  var options = {
    'url': self.host['access_token'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            query.oauth_token,
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  };

  request.post(options, function(err, data) {
    if (err) return handle.error(err);

    data = helper.mime(data);

    if ('undefined' === typeof data['oauth_token'] ||
        'undefined' === typeof data['oauth_token_secret']) {
      return handle.error('error');
    }

    handle.redirect(self.host['base']);
    handle.session(data);
  });
};

OAuth1.prototype.api = function api(handle, opts) {
  var self = this;
  var sess = handle.session();

  if ('undefined' === typeof sess['oauth_token'] ||
      'undefined' === typeof sess['oauth_token_secret']) {
    handle.json({});
    return;
  }

  var options = {
    'method': handle.method,
    'url': self.host['api'] + handle.params,
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  };

  helper.merge(options, opts);

  request(options, function(err, data) {
    if (err) return handle.error(err);

    data = helper.mime(data);
    handle.json(data);
  });
};
