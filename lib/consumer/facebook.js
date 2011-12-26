/*!
 * Facebook
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


exports = module.exports = Facebook;

function Facebook(options) {
  if (!(this instanceof Facebook)) {
    return new Facebook(options);
  }

  var self    = this;
  var baseUri = options.baseUri || 'http://localhost/';
  var route   = options.route || '/facebook';

  if ('/' == baseUri[baseUri.length - 1]) {
    baseUri = baseUri.slice(0, -1);
  }
  if ('/' != route[0]) {
    route = '/' + route;
  }
  if ('/' == route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  this.options = {
    route : {
      login        : route + '/auth',
      callback     : route + '/callback',
      logout       : route + '/logout',
      user         : route + '/user',
      graph        : route + '/graph'
    },
    url : {
      base         : baseUri,
      callback     : baseUri + route + '/callback',
      access_token : 'https://graph.facebook.com/oauth/access_token',
      authorize    : 'https://graph.facebook.com/oauth/authorize',
      login        : 'https://www.facebook.com/dialog/oauth',
      logout       : 'https://www.facebook.com/logout.php',
      graph        : 'https://graph.facebook.com'
    },
    oauth : {
      client_id     : options.appId,
      client_secret : options.appSecret,
      scope         : options.scope
    }
  };

  return connect.router(function route(app) {
    app.get(self.options.route['login'], login);
    app.get(self.options.route['callback'], accessToken);
    app.get(self.options.route['logout'], logout);
    app.get(self.options.route['user'], user);
    app.get(self.options.route['graph'], graph);
  });

  function session(req, obj) {
    if (!req.session) return {};

    if (!req.session.auth)          req.session.auth = {};
    if (!req.session.auth.facebook) req.session.auth.facebook = {};
    if (undefined !== obj)          req.session.auth.facebook = obj;

    return req.session.auth.facebook;
  }

  function login(req, res, next) {
    var sess = session(req);

    res.writeHead(302, {
      'Location' : self.options.url.login + '?' + querystring.stringify({
        'client_id'    : self.options.oauth['client_id'],
        'redirect_uri' : self.options.url.callback,
        'scope'        : self.options.oauth['scope'],
        'type'         : 'web_server'
      })
    });
    res.end();
  }

  function accessToken(req, res, next) {
    var url = parse(req.url, true);

    if (url.query && url.query.error == 'access_denied') {
      return next && next({
        error             : url.query.error,            // 'access_denied'
        error_reason      : url.query.error_reason,     // 'user_denied'
        error_description : url.query.error_description // 'The user denied your request'
      });
    }

    if (!url.query || !url.query.code) {
      return next && next('error');
    }

    var options = {
      url     : self.options.url.access_token,
      headers : {
        'Content-Type'  : 'application/x-www-form-urlencoded'
      },
      body    : {
        'client_id'     : self.options.oauth['client_id'],
        'redirect_uri'  : self.options.url.callback,
        'client_secret' : self.options.oauth['client_secret'],
        'code'          : url.query.code,
        'type'          : 'web_server'
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

      if (undefined === data['access_token']) {
        return next && next(err);
      }

      res.writeHead(302, { 'Location': self.options.url.base });
      res.end();

      session(req, data);
    });
  }

  function logout(req, res, next) {
    var sess = session(req);

    if (undefined === sess['access_token']) {
      res.writeHead(302, { 'Location': self.options.url.base });
      res.end();

      session(req, {});
      return;
    }

    res.writeHead(302, {
      'Location' : self.options.url.logout + '?' + querystring.stringify({
        'next'          : self.options.url.base,
        'access_token'  : sess['access_token']
      })
    });
    res.end();

    session(req, {});
  }

  function user(req, res, next) {
    var sess = session(req);

    if (undefined === sess['access_token']) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
      return;
    }

    var options = {
      url     : 'https://graph.facebook.com/me' + '&' + querystring.stringify({
        access_token : sess['access_token']
      }),
      headers : {},
      body    : ''
    };

    oauth.get(options, function(err, data) {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(err);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
  }

  function graph(req, res, next) {
    var sess = session(req);

    if (undefined === sess['access_token']) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
      return;
    }

    var options = {
      url     : 'https://graph.facebook.com/me' + '&' + querystring.stringify({
        access_token : sess['access_token']
      }),
      headers : {},
      body    : ''
    };

    oauth.get(options, function(err, data) {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(err);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
  }
};
