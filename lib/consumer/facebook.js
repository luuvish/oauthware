/*!
 * Connect
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth       = require('../oauth'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = Facebook;

function Facebook(options) {
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
      request_token : route + '/auth',
      access_token  : route + '/callback',
      logout        : route + '/logout',
      user          : route + '/user'
    },
    url : {
      base          : baseUri,
      callback      : baseUri + route + '/callback',
      access_token : 'https://graph.facebook.com/oauth/access_token',
      authorize    : 'https://graph.facebook.com/oauth/authorize'
    },
    client_id      : options.appId,
    client_secret  : options.appSecret,
    scope          : options.scope
  };

  return function route(app) {
    app.get(self.options.route['request_token'], requestToken);
    app.get(self.options.route['access_token'], accessToken);
    app.get(self.options.route['logout'], logout);
    app.get(self.options.route['user'], user);
  };

  function session(req, obj) {
    if (!req.session) return {};

    if (!req.session.auth)          req.session.auth = {};
    if (!req.session.auth.facebook) req.session.auth.facebook = {};
    if (undefined !== obj)          req.session.auth.facebook = obj;

    return req.session.auth.facebook;
  }

  function requestToken(req, res, next) {
    var sess = session(req);

    sess['redirect_url'] = req.url;

    res.writeHead(302, {
      'Location': self.options.url.authorize + '?' + querystring.stringify({
        client_id    : self.options.client_id,
        type         : 'web_server',
        scope        : self.options.scope,
        redirect_uri : self.options.url.callback
      })
    });
    res.end();
  }

  function accessToken(req, res, next) {
    var url = parse(req.url, true);

    if (url.query.error_reason == 'user_denied') {
      return next && next('user_denied');
    }

    var options = {
      url     : self.options.url.access_token,
      headers : {
        'Content-Type'  : 'application/x-www-form-urlencoded'
      },
      body    : {
        'client_id'     : self.options.client_id,
        'client_secret' : self.options.client_secret,
        'type'          : 'web_server',
        'code'          : url.query && url.query.code,
        'redirect_uri'  : self.options.url.callback
      }
    };

    oauth.post(options, function(err, data) {
      if (err) return next && next(err);

      var sess = session(req);

      sess['access_token']  = data['access_token'];
      sess['refresh_token'] = data['refresh_token'];

      var options = {
        url     : 'https://graph.facebook.com/me' + '&' + querystring.stringify({
          access_token : sess['access_token']
        }),
        headers : {},
        body    : ''
      };

      oauth.get(options, function(err, data) {
        if (err) return next && next(err);

        sess['me'] = data;

        res.writeHead(302, { 'Location': self.options.url.base });
        res.end();
      });
    });
  }

  function logout(req, res, next) {
    session(req, {});

    res.writeHead(302, { 'Location': self.options.url.base });
    res.end();
  }

  function user(req, res, next) {
    var sess = session(req);
    var user = '{}';

    if (sess['access_token'] !== undefined) user = JSON.stringify(sess['me']);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(user);
  }
};
