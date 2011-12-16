/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */

var connect = require('connect'),
    StrategyExecutor = require('./strategyExecutor.js');

/* 
 * This file contains the methods that will become 'mixed-in' with the connect request object, namely:
 * 
 *   authenticate( [strategy|options], callback(err, succcessFailOngoing) )
 *   getAuthDetails
 *   isAuthenticated( [scope] )
 *   isUnAuthenticated( [scope] )
 *   logout( [scope], [callback(err)])
 */

var RequestMethods = {};

RequestMethods.authenticate = function(strategy, opts, callback, strategyExecutor, res, firstLoginHandler) {
  var strategy, opts, callback;
  var scope;

  var trace = this.getAuthDetails().trace;
  var req   = this;

  //ughhh pull this rubbish somewhere tidy...
  if (strategy && opts && callback) {
    var type = typeof strategy;
    if (strategy.constructor != Array) {
      strategy = [strategy];
    }
    scope = opts.scope;
  } else if (strategy && opts) {
    callback = opts;
    var type = typeof strategy;
    if (strategy.constructor == Array) {
       // do nothing
    } else if (type == 'string') {
      strategy = [strategy];
    } else if (type == 'object') {
      scope = strategy.scope;
      strategy = undefined;
    }
  } else if (strategy) {
    callback = strategy;
    strategy = undefined;
  }
  // Choose the first strategy defined if no strategy provided
  if (!strategy && strategyExecutor.strategies) {
    for (var k in strategyExecutor.strategies) {
      strategy = [strategyExecutor.strategies[k].name];
      break;
    }
  }

  // Sometimes the authentication scope needs to passed between requests, we store this information
  // transiently on the session.
  if (scope === undefined &&
      req.getAuthDetails().__performingAuthentication &&
      req.getAuthDetails().__originalScope) {
    scope = req.getAuthDetails().__originalScope;
  }

  trace("Authenticating (" + this.headers.host + this.url + ")", scope, ">>>");
  if (req.isAuthenticated(scope)) {
    delete req.getAuthDetails().__performingAuthentication;
    delete req.getAuthDetails().__originalUrl;
    delete req.getAuthDetails().__originalScope;
    trace("Authentication successful (Already Authenticated)", scope, "<<<");
    return callback(null, true);
  }

  var authContext = {scope:scope, request:req, response:res};

  function authCallback(error, executionResult) {
    //TODO: This needs tidying up, the HTTP strategies have bled...
    if (executionResult) {
      req.getAuthDetails().errorResponse = executionResult.errorResponse;
      if (req.getAuthDetails().__originalUrl)
        executionResult.originalUrl = req.getAuthDetails().__originalUrl;
      else
        executionResult.originalUrl = req.url;
    }

    if (error) {
      delete req.getAuthDetails().__performingAuthentication;
      delete req.getAuthDetails().__originalUrl;
      delete req.getAuthDetails().__originalScope;
      trace("Authentication error: " + error, scope, "<<<");
      return callback(error);
    }

    if (executionResult.authenticated === true) {
      trace("Authentication successful", scope, "<<<");
      executionResult.originalUrl = req.getAuthDetails().__originalUrl;
      delete req.getAuthDetails().__originalUrl;
      delete req.getAuthDetails().__originalScope;

      if (scope === undefined) {
        req.getAuthDetails().user = executionResult.user;
      } else {
        if (req.getAuthDetails().scopedUsers[scope] === undefined)
          req.getAuthDetails().scopedUsers[scope] = {};
        req.getAuthDetails().scopedUsers[scope].user = executionResult.user;
      }

      if (req.getAuthDetails().__performingAuthentication) {
        try {
          delete req.getAuthDetails().__performingAuthentication;
          trace("Firing 'FirstLogin' Handler", scope, "$$$");
          firstLoginHandler(authContext, executionResult, callback);
        } catch(e) {
          trace("error: With executing firstLoginHandler" + e.stack);
        }
        return;
      }
      return callback(null, executionResult.authenticated);
    }

    if (executionResult.authenticated === false) {
      delete req.getAuthDetails().__performingAuthentication;
      delete req.getAuthDetails().__originalUrl;
      delete req.getAuthDetails().__originalScope;
      trace("Authentication failed", scope, "<<<");
      return callback(null, executionResult.authenticated);
    }

    req.getAuthDetails().__performingAuthentication = true;
    req.getAuthDetails().__originalUrl = req.url;
    req.getAuthDetails().__originalScope = scope;
    trace("Authentication ongoing (Requires browser interaction)", scope, "<<<");
    return callback(null, executionResult.authenticated);
  }

  strategyExecutor.authenticate(strategy, authContext, authCallback);
};

// mixins...
RequestMethods.getAuthDetails = function() {
  return this._connect_auth;
};

RequestMethods.isAuthenticated = function(scope) {
  var ad = this.getAuthDetails();
  if (scope === undefined)
    return (ad.user) ? true : false;
  return (ad.scopedUsers[scope] && ad.scopedUsers[scope].user) ? true : false;
};

RequestMethods.isUnAuthenticated = function(scope) {
  return !this.isAuthenticated(scope);
};

RequestMethods.logout = function(authContext, logoutHandler, middlewareCallback) {
  var ad = this.getAuthDetails(),
      user;

  ad.trace("Logout", authContext.scope, "!!!");

  if (authContext.scope === undefined) {
    user = ad.user;
    delete ad.user;
    ad.scopedUsers = {};
  } else {
    user = ad.scopedUsers[authContext.scope].user;
    delete ad.scopedUsers[authContext.scope].user;
  }

  logoutHandler(authContext, user, middlewareCallback);
};



var Events = {};

Events.defaultLogoutHandler = function(authContext, loggedOutUser, callback) {
  if (callback) callback();
};

/**
 * Provides a basic 'out of the box' factory function for 
 * redirecting a user to a specified url on logout
 */

Events.redirectOnLogout = function(redirectUrl) {
  return function(authContext, loggedOutUser, callback) {
    authContext.response.writeHead(303, { 'Location': redirectUrl });
    authContext.response.end('');
    if (callback) callback();
  };
};

Events.defaultFirstLoginHandler = function(authContext, executionResult, callback) {
  if (callback) callback(null, true);
};



var Tracing = {};

// Dead end for when no tracing mechanism specified
Tracing.nullTrace = function() {};

/*
 * The standard tracing function, provides information in the form of:
 *
 * 17:54:40-647 [e78ocZ] (Scope) >>> Authenticating (testtwitter.com/?login_with=never)
 * 
 * Viewing these lines offer useful diagnostics to determine why authentication is failing (the session id within the square brackets
 * and the provided url giving the greatest clues!)
 */

Tracing.standardTrace = function(message, authContext, linePrefix) {
  var d = new Date();
  var id;

  if (authContext.request.sessionID) {
    id = authContext.request.sessionID.substring(0,6);
  } else {
    id = authContext.request.socket.remoteAddress;
  }

  var scope = (authContext.scope ? " (" + authContext.scope +")" : "");
  var linePrefix = (linePrefix? " " + linePrefix : "");

  // Silly little function nabbed from: http://www.irt.org/script/183.htm
  function pad(number, length) {
    var str = '' + number;
    while (str.length < length)
      str = '0' + str;
    return str;
  }

  message = message.replace(/\n/g, "\n                     " + linePrefix);
  console.log(pad(d.getHours(),2) + ":" +
              pad(d.getMinutes(),2) + ':' +
              pad(d.getSeconds(),2) + '-' +
              pad(d.getMilliseconds(),3) +
              " ["+id+"]" + scope + linePrefix + " " + message);
};



/**
 * Construct the authentication middleware.
 * Construction can take 2 forms:
 *    auth(<Strategy>()|[<Strategy>()])  -  A single configured strategy, or array of strategies.
 *    auth({ strategies:<Strategy>()|[<Strategy>()...]
 *           [trace: true|false|function(message, req, [scope])}])   - More powerful variant that allows for passing in other configuration options, none yet defined.
 */

module.exports = function(optionsOrStrategy) {
  var i, strategies, strategyExecutor, options, traceFunction, server;

  if (!optionsOrStrategy)
    throw new Error("You must specify at least one strategy to use the authentication middleware, even if it is anonymous.");
  // Constructor form 1
  if (Array.isArray(optionsOrStrategy) ||
     (optionsOrStrategy.authenticate !== undefined && optionsOrStrategy.strategies === undefined)) {
    strategies = Array.isArray(optionsOrStrategy) ? optionsOrStrategy : [optionsOrStrategy];
    options = {trace: false};
  } else {
    options = optionsOrStrategy;
    strategies = Array.isArray(optionsOrStrategy.strategies) ? optionsOrStrategy.strategies : [optionsOrStrategy.strategies];
  }

  if (!options.trace) // If options.trace is specified as false or undefined we no-op the messages.
    traceFunction = Tracing.nullTrace;
  else if (options.trace === true) // If options.trace is really true then we log out to console
    traceFunction = Tracing.standardTrace;
  else // Custom provided trace function
    traceFunction = options.trace;

  var logoutHandler     = options.logoutHandler || Events.defaultLogoutHandler;
  var firstLoginHandler = options.firstLoginHandler || Events.defaultFirstLoginHandler;

  // Construct the strategy executor.
  strategyExecutor = new StrategyExecutor(strategies);

  // Construct the middleware that adapts the request object to provide authentication primitives.
  server = connect.createServer(  
    function auth(req, res, next) {
      // Mix-in the static utility methods (the methods are directly on the request, and don't need the response object).
      req.getAuthDetails    = RequestMethods.getAuthDetails;
      req.isAuthenticated   = RequestMethods.isAuthenticated;
      req.isUnAuthenticated = RequestMethods.isUnAuthenticated;

      // If there is a session middleware, use it.
      if (req.session && req.session.auth)
        req._connect_auth = req.session.auth;
      else if (!req.getAuthDetails()) { // Create the auth holder if needed.
        req._connect_auth = { scopedUsers: {} };
        if (req.session)
          req.session.auth = req._connect_auth;
      }

      // Assign a tracer so if needed routes can trace.
      req.getAuthDetails().trace = function(message, scope, linePrefix) {
        traceFunction(message, {scope:scope, request:req, response:res}, linePrefix);
      };

      // These methods require the request & response to be in their closures.
      req.authenticate = function(strategy, opts, middlewareCallback) {
        RequestMethods.authenticate.call(this, strategy, opts, middlewareCallback, strategyExecutor, res, firstLoginHandler);
      };

      req.logout = function(scope, middlewareCallback) {
        if (typeof scope === 'function' && middlewareCallback === undefined) {
          middlewareCallback = scope;
          scope = undefined;
        }
        RequestMethods.logout.call(this, {scope:scope, request:req, response:res}, logoutHandler, middlewareCallback);
      };

      // Now we've added our requisite methods to the request, call the next part of the middleware chain
      // (which may in fact be a middleware piece that enforces authentication!)
      next();
    }
  );

  // Some strategies require routes to be defined, so give them a chance to do so.
  for (i in strategies) {
    // Build the authentication routes required
    if (strategies[i].router)
      server.use('/', connect.router(strategies[i].router));
  }

  return server;
};
