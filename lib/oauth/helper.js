/*!
 * OAuthware - OAuth - Helper
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = {
  configure: configure,
  mime:      mime,
  handle:    handle,
  merge:     merge
};


function configure(options, defaults) {
  var self = {};

  if ('undefined' === typeof options.path) {
    options.path = {};
  }
  if ('string' === typeof options.path) {
    options.path = {'base': options.path};
  }
  options.path['base'] = options.path['base'] || ('/' + options.name);

  if ('/' !== options.path['base'][0]) {
    options.path['base'] = '/' + options.path['base'];
  }
  options.path['base'] = options.path['base'].replace(/\/$/, '');

  if ('undefined' === typeof options.host) {
    options.host = {};
  }
  if ('string' === typeof options.host) {
    options.host = {'base': options.host};
  }
  options.host['base'] = options.host['base'] || 'http://localhost/';

  options.host['base'] = options.host['base'].replace(/\/$/, '');

  self.name = options.name || defaults.name;

  self.path = {
    'login':  options.path['login']  || options.path['base'] + '/signin',
    'logout': options.path['logout'] || options.path['base'] + '/signout',
    'auth':   options.path['auth']   || options.path['base'] + '/auth',
    'api':    options.path['api']    || new RegExp('^' + options.path['base'] + '/api' + '(/.*)')
  };

  self.host = {
    'base':          options.host['base'],
    'callback':      options.host['callback']      || options.host['base'] + self.path['auth'],
    'request_token': options.host['request_token'] || defaults.host['request_token'],
    'access_token':  options.host['access_token']  || defaults.host['access_token'],
    'authenticate':  options.host['authenticate']  || defaults.host['authenticate'],
    'authorize':     options.host['authorize']     || defaults.host['authorize'],
    'login':         options.host['login']         || defaults.host['login'],
    'logout':        options.host['logout']        || defaults.host['logout'],
    'api':           options.host['api']           || defaults.host['api']
  };

  return self;
}


function mime(data) {
  var type = (data.type || '').split(';')[0];
  var parser = mime.parse[type];
  if (parser) {
    return parser(data.body);
  }
}

mime.parse = {
  'text/plain': function (body) {
    return querystring.parse(body);
  },
  'text/html': function (body) {
    return querystring.parse(body);
  },
  'text/javascript': function (body) {
    return JSON.parse(body);
  },
  'application/x-www-form-urlencoded': function (body) {
    return querystring.parse(body);
  },
  'application/json': function (body) {
    return JSON.parse(body);
  }
};


function handle(req, res, next) {
  var self = this;
  var url = parse(req.url, true);
  return {
    method: req.method,
    path: url.pathname,
    query: url.query,
    params: req.params,
    session: function (obj) {
      if (!req.session) return {};

      if (!req.session.auth) req.session.auth = {};
      if (!req.session.auth[self.name]) req.session.auth[self.name] = {};
      if ('undefined' !== typeof obj) req.session.auth[self.name] = obj;

      return req.session.auth[self.name];
    },
    redirect: function (location) {
      res.writeHead(302, {'Location': location});
      res.end();
    },
    json: function (data) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(data));
    },
    error: function (err) {
      console.log('err=%j',err);
      next && next(err);
    }
  };
}

function merge(target, source) {
  var name;

  for (name in source) {
    if ('undefined' === typeof target[name]) {
      target[name] = source[name];
    }
  }
}
