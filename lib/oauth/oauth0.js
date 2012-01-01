/*!
 * OAuth0
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauthcore   = require('./oauthcore'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = OAuth0;


function OAuth0(options, defaults) {
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

  this.name = options.name || defaults.name;

  this.path = {
    'signIn':  options.path['login']  || options.path['base'] + '/signin',
    'signOut': options.path['logout'] || options.path['base'] + '/signout',
    'auth':    options.path['auth']   || options.path['base'] + '/auth',
    'api':     options.path['api']    || new RegExp('^' + options.path['base'] + '/api' + '(/.*)')
  };

  this.host = {
    'base':          options.host['base'],
    'callback':      options.host['callback']      || options.host['base'] + this.path['auth'],
    'request_token': options.host['request_token'] || defaults.host['request_token'],
    'access_token':  options.host['access_token']  || defaults.host['access_token'],
    'authenticate':  options.host['authenticate']  || defaults.host['authenticate'],
    'authorize':     options.host['authorize']     || defaults.host['authorize'],
    'signin':        options.host['signin']        || defaults.host['signin'],
    'signout':       options.host['signout']       || defaults.host['signout'],
    'api':           options.host['api']           || defaults.host['api']
  };
}

OAuth0.prototype.session = function session(req, obj) {
  if (!req.session) return {};

  if (!req.session.auth) req.session.auth = {};
  if (!req.session.auth[this.name]) req.session.auth[this.name] = {};
  if ('undefined' !== typeof obj) req.session.auth[this.name] = obj;

  return req.session.auth[this.name];
};

OAuth0.prototype.mime = function mime(data) {
  var type = (data.type || '').split(';')[0];
  var parser = OAuth0.prototype.mime.parse[type];
  if (parser) {
    return parser(data.body);
  }
};

OAuth0.prototype.mime.parse = {
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

OAuth0.prototype.redirect = function redirect(response, location) {
  response.writeHead(302, {'Location': location});
  response.end();
};
