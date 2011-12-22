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
      mount        : options.mount,
      access_token : 'https://graph.facebook.com/oauth/access_token',
      authorize    : 'https://graph.facebook.com/oauth/authorize'
    },
    client_id      : options.appId,
    client_secret  : options.appSecret,
    scope          : options.scope
  };

  var self = this;

  return function route(app) {
    app.get(self.options.url.mount, requestToken);
    app.get(self.options.url.mount + '/callback', accessToken);
    app.get(self.options.url.mount + '/logout', logout);
    app.get(self.options.url.mount + '/user', user);
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

    var url  = req.url[0] == '/' ? req.url.substring(1) : req.url;
    var path = parse(req.headers.referer + url, true);

    res.writeHead(302, {
      'Location': self.options.url.authorize + '?' + querystring.stringify({
        client_id    : self.options.client_id,
        type         : 'web_server',
        scope        : self.options.scope,
        redirect_uri : path.href + '/callback'
      })
    });
    res.end();
  }

  function accessToken(req, res, next) {
    var url = parse(req.url, true);

    var pathname = url.pathname[0] == '/' ? url.pathname.substring(1) : url.pathname;
    var path = parse(req.headers.referer + pathname, true);

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
        'redirect_uri'  : path.href
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

        res.writeHead(302, { 'Location': '/' });
        res.end();
      });
    });
  }

  function logout(req, res, next) {
    session(req, {});

    res.writeHead(302, { 'Location': '/' });
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
