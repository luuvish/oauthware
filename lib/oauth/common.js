/*!
 * OAuthware - OAuth - Common
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var querystring = require('querystring');


exports = module.exports = {
  configure: configure,
  mime:      mime,
  merge:     merge
};


function configure(options) {
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

  self.name = options.name;

  self.path = {
    'login':  options.path['login']  || options.path['base'] + '/signin',
    'logout': options.path['logout'] || options.path['base'] + '/signout',
    'auth':   options.path['auth']   || options.path['base'] + '/auth',
    'api':    options.path['api']    || new RegExp('^' + options.path['base'] + '/api' + '(/.*)')
  };

  self.host = {
    'base':          options.host['base'],
    'callback':      options.host['callback'] || options.host['base'] + self.path['auth'],
    'request_token': options.host['request_token'],
    'access_token':  options.host['access_token'],
    'authorize':     options.host['authorize'],
    'logout':        options.host['logout'],
    'api':           options.host['api']
  };

  self.additional = options.additional || {};

  return self;
}


function merge(target, source) {
  var name;

  for (name in source) {
    if ('undefined' === typeof target[name]) {
      target[name] = source[name];
    } else {
      merge(target[name], source[name]);
    }
  }

  return target;
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
