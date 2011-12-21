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
  this.options = {
    url : {
      access_token : 'https://graph.facebook.com/oauth/access_token',
      authorize    : 'https://graph.facebook.com/oauth/authorize'
    },
    client_id      : options.appId,
    client_secret  : options.appSecret,
    callback       : options.callback || '',
    scope          : options.scope
  };

  var self = this;

  return function (req, res, next) {
    var url = parse(req.url, true);

    if (url.pathname == '/auth/facebook') {
      return requestToken(req, res, next);
    }

    if (url.pathname == '/auth/facebook/callback') {
      return accessToken(req, res, next);
    }

    if (url.pathname == '/auth/facebook/logout') {
      
    }

    if (url.pathname == '/auth/facebook/user') {
      var user = {};
      if (req.session && req.session.auth && req.session.auth.facebook &&
          req.session.auth.facebook['access_token'] != undefined) {
        user = req.session.auth.facebook;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
      return;
    }

    next && next();
  };

  function requestToken(req, res, next) {
    req.session.auth = {};
    req.session.auth.facebook = {};
    req.session.auth.facebook['redirect_url'] = req.url;

    res.writeHead(302, {
      'Location': self.options.url.authorize + '?' + querystring.stringify({
        client_id    : self.options.client_id,
        type         : 'web_server',
        scope        : self.options.scope,
        redirect_uri : self.options.callback
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
        'redirect_uri'  : self.options.callback
      }
    };

    oauth.post(options, function(err, data) {
      if (err) return next && next(err);

      req.session.auth.facebook['access_token']  = data['access_token'];
      req.session.auth.facebook['refresh_token'] = data['refresh_token'];

      var options = {
        url     : 'https://graph.facebook.com/me' + '&' + querystring.stringify({
          access_token : req.session.auth.facebook['access_token']
        }),
        headers : {},
        body    : ''
      };

      oauth.get(options, function(err, data) {
        if (err) return next && next(err);

        req.session.auth.facebook['me'] = data;

        res.writeHead(302, { 'Location': '/' });
        res.end();
      });
    });
  }
};
