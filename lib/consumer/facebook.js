/*!
 * OAuthware - Facebook
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


exports = module.exports = createFacebook;

function createFacebook(options) {
  var facebook = new Facebook(options),
      handle,
      self;

  self = function (req, res, next) {
    return handle(req, res, next);
  };

  self.router = function (fn) {
    return connect.router.call(self, fn);
  };

  self.path = facebook.path;

  self.fn = {
    signIn: function (req, res, next) {
      facebook.signIn(req, res, next);
    },
    signOut: function (req, res, next) {
      facebook.signOut(req, res, next);
    },
    authenticate: function (req, res, next) {
      facebook.authenticate(req, res, next);
    },
    api: function (req, res, next) {
      facebook.api(req, res, next);
    },
    user: function (req, res, next) {
      facebook.user(req, res, next);
    },
    graph: function (req, res, next) {
      facebook.graph(req, res, next);
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
};

function Facebook(options) {
  if (!(this instanceof Facebook)) {
    return new Facebook(options);
  }

  var host = options.host || 'http://localhost/';
  var route = options.route || '/facebook';

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
    'base':         host,
    'callback':     host + this.path.auth,
    'access_token': 'https://graph.facebook.com/oauth/access_token',
    'authorize':    'https://graph.facebook.com/oauth/authorize',
    'signin':       'https://www.facebook.com/dialog/oauth',
    'signout':      'https://www.facebook.com/logout.php',
    'api':          'https://graph.facebook.com'
  };

  this.oauth = {
    'client_id':     options.clientId || options.appId,
    'client_secret': options.clientSecret || options.appSecret,
    'scope':         options.scope || ''
  };

  if ('undefined' === typeof this.oauth['client_id']) {
    throw new Error('client_id must be defined');
  }
  if ('undefined' === typeof this.oauth['client_secret']) {
    throw new Error('client_secret must be defined');
  }
};

Facebook.prototype.signIn = function signIn(req, res, next) {
  var self = this;
  var sess = session(req);

  res.writeHead(302, {
    'Location': self.host['signin'] + '?' + querystring.stringify({
      'client_id':    self.oauth['client_id'],
      'redirect_uri': self.host['callback'],
      'scope':        self.oauth['scope'],
      'type':         'web_server'
    })
  });
  res.end();
};

Facebook.prototype.signOut = function signOut(req, res, next) {
  var self = this;
  var sess = session(req);

  if ('undefined' === typeof sess['access_token']) {
    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    session(req, {});
    return;
  }

  res.writeHead(302, {
    'Location': self.host['signout'] + '?' + querystring.stringify({
      'next': self.host['base'],
      'access_token': sess['access_token']
    })
  });
  res.end();

  session(req, {});
};

Facebook.prototype.authenticate = function authenticate(req, res, next) {
  var self = this;
  var url = parse(req.url, true);

  if (url.query && url.query.error === 'access_denied') {
    return next && next({
      error:             url.query.error,            // 'access_denied'
      error_reason:      url.query.error_reason,     // 'user_denied'
      error_description: url.query.error_description // 'The user denied your request'
    });
  }

  if (!url.query || !url.query.code) {
    return next && next('error');
  }

  var options = {
    url: self.host['access_token'],
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      'client_id':     self.oauth['client_id'],
      'redirect_uri':  self.host['callback'],
      'client_secret': self.oauth['client_secret'],
      'code':          url.query.code,
      'type':          'web_server'
    }
  };

  oauth.post(options, function(err, data) {
    if (err) {
      // {
      //   'error': {
      //     'type': 'OAuthException',
      //     'message': 'Error validating verification code.'
      //   }
      // }
      return next && next(err);
    }

    if ('undefined' === typeof data['access_token']) {
      return next && next(err);
    }

    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    session(req, data);
  });
};

Facebook.prototype.api = function api(req, res, next) {
  var self = this;
  var sess = session(req);

  if ('undefined' === typeof sess['access_token']) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{}');
    return;
  }

  var options = {
    url: self.host['api'] + req.params + '&'
      + querystring.stringify({access_token: sess['access_token']}),
    headers: {},
    body: {}
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
  if (!req.session.auth.facebook) req.session.auth.facebook = {};
  if ('undefined' !== typeof obj) req.session.auth.facebook = obj;

  return req.session.auth.facebook;
}
