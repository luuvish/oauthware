/*!
 * Session
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

exports = module.exports = session;


function session(oauthware) {
  var stack = {};

  if ('undefined' === typeof oauthware) {
    oauthware = 'oauthware';
  }

  function handler(req, res, next) {
    if (!req.session) {
      throw new Error('Session must be created');
    }

    if (!req.session[oauthware]) {
      req.session[oauthware] = function (name) {
        if ('undefined' === typeof stack[name]) {
          return null;
        }
        return stack[name];
      };
    }

    next && next();
  }

  handler.use = function use(route, handle) {
    if ('function' === typeof route) {
      handle = route;
    }

    stack[handle.name] = {
      route:  route,
      name:   handle.name,
      path:   handle.path,
      handle: handle.handle
    };
  };

  return handler;
}
