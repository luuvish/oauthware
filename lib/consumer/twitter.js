/*!
 * OAuthware - Twitter
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth       = require('../oauth'),
    connect     = require('connect'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = createTwitter;

function createTwitter(options) {
  var twitter = new Twitter(options),
      handle,
      self;

  self = function (req, res, next) {
    return handle(req, res, next);
  };

  self.router = function (fn) {
    return connect.router.call(self, fn);
  };

  self.path = twitter.path;

  self.fn = {
    signIn: function (req, res, next) {
      twitter.signIn(req, res, next);
    },
    signOut: function (req, res, next) {
      twitter.signOut(req, res, next);
    },
    authenticate: function (req, res, next) {
      twitter.authenticate(req, res, next);
    },
    api: function (req, res, next) {
      twitter.api(req, res, next);
    },
    route: function (app) {
      app.get(this.path.signIn, this.fn.signIn);
      app.get(this.path.signOut, this.fn.signOut);
      app.get(this.path.auth, this.fn.authenticate);
      app.get(this.path.api, this.fn.api);
    }
  };

  handle = self.router(self.fn.route);

  return self;
}

function Twitter(options) {
  if (!(this instanceof Twitter)) {
    return new Twitter(options);
  }

  var host = options.host || 'http://localhost/';
  var route = options.route || '/twitter';

  if ('/' === host[host.length - 1]) {
    host = host.slice(0, -1);
  }

  if ('/' !== route[0]) {
    route = '/' + route;
  }
  if ('/' === route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  this.path = {
    signIn:  options.signIn || route + '/signin',
    signOut: options.signOut || route + '/signout',
    auth:    options.auth || route + '/auth',
    api:     options.api || new RegExp('^' + route + '/api' + '(/.*)')
  };

  this.host = {
    'base':          host,
    'callback':      host + this.path.auth,
    'request_token': 'https://api.twitter.com/oauth/request_token',
    'access_token':  'https://api.twitter.com/oauth/access_token',
    'authenticate':  'https://api.twitter.com/oauth/authenticate',
    'authorize':     'https://api.twitter.com/oauth/authorize',
    'signout':       'https://api.twitter.com/1/account/end_session.json',
    'api':           'https://api.twitter.com/1'
  };

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

Twitter.prototype.signIn = function signIn(req, res, next) {
  var self = this;
  var sess = session(req);

  var options = {
    'url': self.host['request_token'],
    'headers': '',
    'body': {},
    'oauth': {
    //'realm':                  '', // OPTIONAL
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
    //'oauth_signature':        '', // DON'T FILL
    //'oauth_timestamp':        '', // DON'T FILL
    //'oauth_nonce':            '', // DON'T FILL
      'oauth_nonce_length':     32, // DEFAULT 32
    //'oauth_version':          '', // DEFAULT '1.0'
      'oauth_callback':         self.host['callback'] || 'oob'
      // oob (case sensitive) is out-of-band configuration
    }
  };

  oauth.post(options, function(err, data) {
    if (err) return next && next(err);

    if ('true' !== data['oauth_callback_confirmed']) {
      return next && next(new Error('oauth_callback_confirmed must be true'));
    }

    res.writeHead(302, {
      'Location': self.host['authenticate'] + '?'
        + querystring.stringify({oauth_token: data['oauth_token']})
    });
    res.end();

    session(req, data);
  });
};

Twitter.prototype.signOut = function signOut(req, res, next) {
  var sess = session(req);
  var self = this;

  if ('undefined' === typeof sess['oauth_token']) {
    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    session(req, {});
    return;
  }

  var options = {
    'url': self.host['signout'],
    'headers': {},
    'body': {},
    'oauth': {
    //'realm':                  '', // OPTIONAL
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
    //'oauth_signature':        '', // DON'T FILL
    //'oauth_timestamp':        '', // DON'T FILL
    //'oauth_nonce':            '', // DON'T FILL
      'oauth_nonce_length':     32  // DEFAULT 32
    //'oauth_version':          ''  // DEFAULT '1.0'
    }
  };

  oauth.post(options, function(err, data) {
    if (err) next && next(err);

    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    session(req, {});
  });
};

Twitter.prototype.authenticate = function authenticate(req, res, next) {
  var self = this;
  var sess = session(req);
  var url = parse(req.url, true);

  //console.log('req.connection.encrypted=' + req.connection.encrypted);
  //console.log('req.connection.proxySecure=' + req.connection.proxySecure);
  //console.log('req.url=' + req.url);
  //console.log('req.method=' + req.method);
  //console.log('req.headers.host=' + req.headers['host']);

  if (!url.query || !url.query.oauth_token || !url.query.oauth_verifier) {
    return next && next('error');
  }

  if ('undefined' === typeof sess['oauth_token_secret']) {
    return next && next('error');
  }

  var options = {
    'url': self.host['access_token'],
    'headers': {},
    'body': {},
    'oauth': {
    //'realm':                 '', // OPTIONAL
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            url.query.oauth_token,
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
    //'oauth_signature':        '', // DON'T FILL
    //'oauth_timestamp':        '', // DON'T FILL
    //'oauth_nonce':            '', // DON'T FILL
      'oauth_nonce_length':     32, // DEFAULT 32
    //'oauth_version':          '', // DEFAULT '1.0'
      'oauth_verifier':         url.query.oauth_verifier
    }
  };

  oauth.post(options, function(err, data) {
    if (err) next && next(err);

    if ('undefined' === typeof data['oauth_token'] ||
        'undefined' === typeof data['oauth_token_secret']) {
      return next && next('error');
    }

    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    session(req, data);
  });
};

Twitter.prototype.api = function api(req, res, next) {
  var self = this;
  var sess = session(req);

  if ('undefined' === typeof sess['oauth_token'] ||
      'undefined' === typeof sess['oauth_token_secret']) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{}');
    return;
  }

  var options = {
    'url': self.host['api'] + req.params,
    'headers': {},
    'body': {},
    'oauth': {
    //'realm':                  '', // OPTIONAL
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
    //'oauth_signature':        '', // DON'T FILL
    //'oauth_timestamp':        '', // DON'T FILL
    //'oauth_nonce':            '', // DON'T FILL
      'oauth_nonce_length':     32  // DEFAULT 32
    //'oauth_version':          ''  // DEFAULT '1.0'
    }
  };

  oauth.get(options, function(err, data) {
    res.writeHead(200, {'Content-Type': 'application/json'});

    if (err) return res.end(err);
    res.end(JSON.stringify(data));
  });
};

function session(req, obj) {
  if (!req.session) return {};

  if (!req.session.auth) req.session.auth = {};
  if (!req.session.auth.twitter) req.session.auth.twitter = {};
  if ('undefined' !== typeof obj) req.session.auth.twitter = obj;

  return req.session.auth.twitter;
}
