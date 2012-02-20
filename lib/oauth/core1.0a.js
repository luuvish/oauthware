/*!
 * OAuthware - OAuth - OAuth1.0a
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var common      = require('./common'),
    request     = require('./request'),
    querystring = require('querystring');

/**
 * expose OAuth1a constructor as the module
 */

exports = module.exports = OAuth1a;

/**
 * OAuth version 1.0a Constructor
 *
 * Options:
 *
 *   - 'name'    OAuth service name
 *   - 'path'    HTTP request route paths
 *   - 'host'    OAuth service request URLs
 *   - 'additional'  Additional parameters, as defined by the Service Provider
 *
 * Examples:
 *
 *   new OAuth1a({
 *     'name': 'Service name',
 *     'path': {
 *       'base':          'Base route path',
 *       'login':         'Login route path',
 *       'logout':        'Logout route path',
 *       'authorized':    'Authorization redirect route path',
 *       'api':           'Accessing Protected Resource route path'
 *     },
 *     'host': {
 *       'base':          'Service Base URL',
 *       'authorized':    'An absolute URL to which the Service Provider will redirect
 *                         the User back when the Obtaining User Authorization step is completed',
 *       'request_token': 'Request Token URL',
 *       'access_token':  'Access Token URL',
 *       'authorize':     'User Authorization URL',
 *       'api':           'Accessing Protected Resource URL'
 *     },
 *     'additional': {
 *       'request_token': { Additional parameters ... },
 *       'access_token':  { Additional parameters ... },
 *       'authorize':     { Additional parameters ... },
 *       'api':           { Additional parameters ... }
 *     }
 *   })
 *
 * @param {Object} options
 * @return {OAuth1a}
 */

function OAuth1a(options) {
  var self = this.configure(options);

  this.name = self.name;
  this.path = self.path;
  this.host = self.host;
  this.additional = self.additional;

  this.oauth = {
    'oauth_consumer_key':     options.consumerKey,
    'oauth_consumer_secret':  options.consumerSecret,
    'oauth_signature_method': 'HMAC-SHA1',
    'oauth_version':          '1.0'
  };

  if ('undefined' === typeof this.oauth['oauth_consumer_key']) {
    throw new Error('oauth_consumer_key must be defined');
  }
  if ('undefined' === typeof this.oauth['oauth_consumer_secret']) {
    throw new Error('oauth_consumer_secret must be defined');
  }
}

OAuth1a.prototype.constructor = OAuth1a;

OAuth1a.prototype.configure = common.configure;
OAuth1a.prototype.merge     = common.merge;
OAuth1a.prototype.mime      = common.mime;

/**
 * RFC5849 Section 3.1
 *
 *  An authenticated request includes several protocol parameters.  Each
 *  parameter name begins with the "oauth_" prefix, and the parameter
 *  names and values are case sensitive.  Clients make authenticated
 *  requests by calculating the values of a set of protocol parameters
 *  and adding them to the HTTP request as follows:
 *
 *  1.  The client assigns value to each of these REQUIRED (unless
 *      specified otherwise) protocol parameters:
 *
 *      oauth_consumer_key
 *        The identifier portion of the client credentials (equivalent to
 *        a username).  The parameter name reflects a deprecated term
 *        (Consumer Key) used in previous revisions of the specification,
 *        and has been retained to maintain backward compatibility.
 *
 *      oauth_token
 *        The token value used to associate the request with the resource
 *        owner.  If the request is not associated with a resource owner
 *        (no token available), clients MAY omit the parameter.
 *
 *      oauth_signature_method
 *        The name of the signature method used by the client to sign the
 *        request, as defined in Section 3.4.
 *
 *      oauth_timestamp
 *        The timestamp value as defined in Section 3.3.  The parameter
 *        MAY be omitted when using the "PLAINTEXT" signature method.
 *
 *      oauth_nonce
 *        The nonce value as defined in Section 3.3.  The parameter MAY
 *        be omitted when using the "PLAINTEXT" signature method.
 *
 *      oauth_version
 *        OPTIONAL.  If present, MUST be set to "1.0".  Provides the
 *        version of the authentication process as defined in this
 *        specification.
 *
 *  2.  The protocol parameters are added to the request using one of the
 *      transmission methods listed in Section 3.5.  Each parameter MUST
 *      NOT appear more than once per request.
 *
 *  3.  The client calculates and assigns the value of the
 *      "oauth_signature" parameter as described in Section 3.4 and adds
 *      the parameter to the request using the same method as in the
 *      previous step.
 *
 *  4.  The client sends the authenticated HTTP request to the server.
 */

/**
 * RFC5849 Section 2.1
 *
 *  The client obtains a set of temporary credentials from the server by
 *  making an authenticated (Section 3) HTTP "POST" request to the
 *  Temporary Credential Request endpoint (unless the server advertises
 *  another HTTP request method for the client to use). The client
 *  constructs a request URI by adding the following REQUIRED parameter
 *  to the request (in addition to the other protocol parameters, using
 *  the same parameter transmission method):
 *
 *  oauth_callback: An absolute URI back to which the server will
 *                  redirect the resource owner when the Resource Owner
 *                  Authorization step (Section 2.2) is completed. If
 *                  the client is unable to receive callbacks or a
 *                  callback URI has been established via other means,
 *                  the parameter value MUST be set to "oob" (case
 *                  sensitive), to indicate an out-of-band
 *                  configuration.
 *
 *  Servers MAY specify additional parameters.
 *
 *  When making the request, the client authenticates using only the
 *  client credentials. The client MAY omit the empty "oauth_token"
 *  protocol parameter from the request and MUST use the empty string as
 *  the token secret value.
 */

/**
 * Example
 *
 *   'oauth': {
 *     'realm':                  'basic'         (OPTIONAL)
 *     'oauth_consumer_key':     CONSUMER_KEY    (REQUIRED)
 *     'oauth_consumer_secret':  CONSUMER_SECRET (REQUIRED)
 *     'oauth_signature_method': 'HMAC-SHA1'     (REQUIRED)
 *     'oauth_signature':        '',             (DON'T FILL)
 *     'oauth_timestamp':        '',             (DON'T FILL)
 *     'oauth_nonce':            '',             (DON'T FILL)
 *     'oauth_nonce_length':     32,             (REQUIRED)(DEFAULT 32)
 *     'oauth_version':          '1.0',          (OPTIONAL)(DEFAULT '1.0')
 *     'oauth_callback':         REDIRECT_URI    (REQUIRED)(DEFAULT 'oob)
 *                               oob (case sensitive) is out-of-band configuration
 *   }
 */

OAuth1a.prototype.login = function login(handler) {
  var self = this,
      sess = handler.session(),
      options, query;

  options = self.merge({
    'url': self.host['request_token'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32,
      'oauth_callback':         self.host['callback'] || 'oob'
    }
  }, self.additional['request_token']);

  request.post(options, function(err, data) {
    if (err) return handler.error(err);

    data = self.mime(data);

    if ('true' !== data['oauth_callback_confirmed']) {
      return handler.error(new Error('oauth_callback_confirmed must be true'));
    }

    query = self.merge({
      oauth_token: data['oauth_token']
    }, self.additional['authorize']);

    handler.redirect(self.host['authorize'] + '?' + querystring.stringify(query));
    handler.session(data);
  });
};

OAuth1a.prototype.logout = function logout(handler) {
  var self = this,
      sess = handler.session(),
      options;

  if (!self.host['logout'] || 'undefined' === typeof sess['oauth_token']) {
    handler.redirect(self.host['base']);
    handler.session({});
    return;
  }

  options = self.merge({
    'url': self.host['logout'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  }, self.additional['logout']);

  request.post(options, function(err, data) {
    if (err) return handler.error(err);

    data = self.mime(data);

    handler.redirect(self.host['base']);
    handler.session({});
  });
};

/**
 * RFC5849 Section 2.3
 *
 * The client obtains a set of token credentials from the server by
 *  making an authenticated (Section 3) HTTP "POST" request to the Token
 *  Request endpoint (unless the server advertises another HTTP request
 *  method for the client to use).  The client constructs a request URI
 *  by adding the following REQUIRED parameter to the request (in
 *  addition to the other protocol parameters, using the same parameter
 *  transmission method):
 *
 *  oauth_verifier
 *        The verification code received from the server in the previous
 *        step.
 *
 *  When making the request, the client authenticates using the client
 *  credentials as well as the temporary credentials.  The temporary
 *  credentials are used as a substitute for token credentials in the
 *  authenticated request and transmitted using the "oauth_token"
 *  parameter.
 */
OAuth1a.prototype.auth = function auth(handler) {
  var self = this,
      sess = handler.session(),
      options,
      query = handler.query;

  if (!query || !query.oauth_token || !query.oauth_verifier) {
    return handler.error(new Error('error'));
  }

  if ('undefined' === typeof sess['oauth_token_secret']) {
    return handler.error(new Error('error'));
  }

  options = self.merge({
    'url': self.host['access_token'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            query.oauth_token,
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32,
      'oauth_verifier':         query.oauth_verifier
    }
  }, self.additional['access_token']);

  request.post(options, function(err, data) {
    if (err) return handler.error(err);

    data = self.mime(data);

    if ('undefined' === typeof data['oauth_token'] ||
        'undefined' === typeof data['oauth_token_secret']) {
      return handler.error(new Error('error'));
    }

    handler.redirect(self.host['base']);
    handler.session(data);
  });
};

OAuth1a.prototype.api = function api(handler) {
  var self = this,
      sess = handler.session(),
      options;

  if ('undefined' === typeof sess['oauth_token'] ||
      'undefined' === typeof sess['oauth_token_secret']) {
    handler.json({});
    return;
  }

  options = self.merge({
    'method': handler.method,
    'url': self.host['api'] + handler.params,
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  }, self.additional['api']);

  request(options, function(err, data) {
    if (err) return; //handler.error(err);

    data = self.mime(data);
    handler.json(data);
  });
};
