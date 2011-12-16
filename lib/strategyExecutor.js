/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */

var util = require('util');

var AuthExecutionScope = function(authContext) {
  this.executionResult = { authenticated: false };
  this.authContext = authContext;
  this._trace = authContext.request.getAuthDetails().trace;
  this._scope = authContext.scope;
};

/**
 * Utility method for providing tracing functionality within an autthenitcation strategy
 * Takes a 'message' to log out
 */

AuthExecutionScope.prototype.trace = function(message) { 
  var messagePrefix = "";
  if (this.executionResult.currentStrategy) {
    messagePrefix = this.executionResult.currentStrategy + ": ";
  }
  this._trace(messagePrefix + message, this._scope, "***");
};

AuthExecutionScope.prototype.fail = function(callback) { 
  this.trace("Failed", "***");
  this.executionResult.authenticated = false;
  callback();
};

AuthExecutionScope.prototype.redirect = function(response, url, callback) {
  this.trace("Redirecting to: "+ url, "***");
  response.writeHead(303, { 'Location': url });
  response.end('');
  this.executionResult.authenticated = undefined;
  this._halt(callback);
};

AuthExecutionScope.prototype.success = function(user, callback) {
  this.trace("Succeeded", "***");
  this.executionResult.user = user;
  this.executionResult.authenticated = true;
  this._halt(callback);
};

AuthExecutionScope.prototype._halt = function(callback) {
  this.executionResult.halted = true;
  // We don't set a value for this.executionResult.authenticated
  // as it has either been set as a result of a call to fail/redirect/success or
  // is using the default value of 'false'
  callback();
};

AuthExecutionScope.prototype.halt = function(callback) {
  this.trace("Halted", "***");
  this.executionResult.authenticated = undefined;
  this._halt(callback);
};

AuthExecutionScope.prototype.pass = function(callback) {
  this.trace("Skipped", "***");
  callback();
};


module.exports = function(strategies) {
  this.strategies = {};
  for (var i in strategies)
    this.strategies[strategies[i].name] = strategies[i];
};

module.exports.prototype.authenticate = function(strategies, authContext, callback) {
  var executionScope = new AuthExecutionScope(authContext);

  if (!this.strategies || this.strategies.length == 0) {
    executionScope.trace("Unable to find a strategy to authenticate with", "###");
    return callback(null, executionScope.executionResult);
  }

  var strategiesToTest = [];
  for (var i in strategies) {
    if (this.strategies[strategies[i]])
      strategiesToTest.push(this.strategies[strategies[i]]);
  }

  if (strategiesToTest.length == 0) {
    executionScope.trace("Tested all strategies :" + util.inspect(executionScope.executionResult), "###");
    return callback(null, executionScope.executionResult);
  }

  var total = strategiesToTest.length;
  var complete = 0;
  var strategy;

  //todo: error handling urghhh
  //todo: scope!
  (function next(e) {
    if (executionScope.executionResult.halted || e || complete === total) {
      executionScope.trace("Tested all strategies", "###");
      return callback(e, executionScope.executionResult);
    }

    strategy = strategiesToTest[complete++];
    if (strategy.isValid === undefined || strategy.isValid()) {  
      executionScope.executionResult.currentStrategy = strategy.name;
      executionScope.trace("Attempting authentication with: " + strategy.name, "###");
      return strategy.authenticate.call(executionScope, authContext.request, authContext.response, next);
    }

    next();
  })();
};
