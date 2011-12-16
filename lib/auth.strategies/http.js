/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */

var base   = require("./base.js"),
    digest = require('./digest.js'),
    basic  = require('./basic.js'); 

module.exports = function(options) {
  options  = options || {};
  var that = base(options);
  var my   = {};

  that.name = options.name || "http";
  if (options.basicStrategy) {
    my.basicStrategy = options.basicStrategy;
  } 
  else if (options.useBasic !== false) {
    my.basicStrategy = basic(options);
  }

  if (options.digestStrategy) {
    my.digestStrategy = options.digestStrategy;
  } 
  else if (options.useDigest !== false) {
    my.digestStrategy = digest(options);
  }
  if (my.basicStrategy) my.basicStrategy.embedded = true;
  if (my.digestStrategy) my.digestStrategy.embedded = true;  

  that.isValid = function() {
    return (my.digestStrategy !== undefined || my.basicStrategy !== undefined);
  };

  that.getAuthenticateResponseHeader = function(executionScope) {
     var challenges = "";
     if (my.digestStrategy)
        challenges += my.digestStrategy.getAuthenticateResponseHeader(executionScope);
     if (my.digestStrategy && my.basicStrategy)
        challenges += ", ";
     if (my.basicStrategy)
        challenges += my.basicStrategy.getAuthenticateResponseHeader(executionScope);
     return challenges;
   };

   that.authenticate = function(req, res, callback) {
      var authHeader = req.headers.authorization;
      if (authHeader) {
        if (authHeader.match(/^[Bb]asic.*/) && my.basicStrategy) {
          this.trace('Selecting Basic Authentication');
          my.basicStrategy.authenticate.call(this, req, res, callback);
        } else if (authHeader.match(/^[Dd]igest.*/) && my.digestStrategy) {
          this.trace('Selecting Digest Authentication');
          my.digestStrategy.authenticate.call(this, req, res, callback);
        } else {  
          this.trace('Bad Http Request');
          that._badRequest(this, req, res, callback);
        }
      } else {
        this.trace('Un-Authenticated');
        that._unAuthenticated(this, req, res, callback);
      }
  };

  return that;
};
