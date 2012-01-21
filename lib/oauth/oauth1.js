/*!
 * OAuthware - OAuth - OAuth1
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuthcore   = require('./oauthcore'),
    request     = require('./request'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = OAuth1;


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

function OAuth1(options, defaults) {
  OAuthcore.call(this, options, defaults);

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

OAuth1.prototype = Object.create(OAuthcore.prototype);
OAuth1.prototype.constructor = OAuth1;

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

OAuth1.prototype.login = function login(handle, opts) {
  var self = this;
  var sess = handle.session();

  var options = {
    'url': self.host['request_token'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32,
      'oauth_callback':         self.host['callback'] || 'oob'
    }
  };

  request.post(options, function(err, data) {
    if (err) return handle.error(err);

    data = self.mime(data);

    if ('true' !== data['oauth_callback_confirmed']) {
      return handle.error(new Error('oauth_callback_confirmed must be true'));
    }

    var query = {
      oauth_token: data['oauth_token']
    };

    for (var name in opts) {
      if ('undefined' === typeof query[name]) {
        query[name] = opts[name];
      }
    }

    handle.redirect(self.host['authorize'] + '?' + querystring.stringify(query));
    handle.session(data);
  });
};

OAuth1.prototype.logout = function logout(handle) {
  var self = this;
  var sess = handle.session();

  if ('undefined' === typeof sess['oauth_token'] || !self.host['logout']) {
    handle.redirect(self.host['base']);
    handle.session({});
    return;
  }

  var options = {
    'url': self.host['logout'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  };

  request.post(options, function(err, data) {
    if (err) return handle.error(err);

    data = self.mime(data);

    handle.redirect(self.host['base']);
    handle.session({});
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
OAuth1.prototype.auth = function auth(handle) {
  var self = this;
  var sess = handle.session();
  var query = handle.query;

  //console.log('req.connection.encrypted=' + req.connection.encrypted);
  //console.log('req.connection.proxySecure=' + req.connection.proxySecure);
  //console.log('req.url=' + req.url);
  //console.log('req.method=' + req.method);
  //console.log('req.headers.host=' + req.headers['host']);

  if (!query || !query.oauth_token || !query.oauth_verifier) {
    return handle.error('error');
  }

  if ('undefined' === typeof sess['oauth_token_secret']) {
    return handle.error('error');
  }

  var options = {
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
  };

  request.post(options, function(err, data) {
    if (err) return handle.error(err);

    data = self.mime(data);

    if ('undefined' === typeof data['oauth_token'] ||
        'undefined' === typeof data['oauth_token_secret']) {
      return handle.error('error');
    }

    handle.redirect(self.host['base']);
    handle.session(data);
  });
};

OAuth1.prototype.api = function api(handle, opts) {
  var self = this;
  var sess = handle.session();

  if ('undefined' === typeof sess['oauth_token'] ||
      'undefined' === typeof sess['oauth_token_secret']) {
    handle.json({});
    return;
  }

  var options = {
    'method': handle.method,
    'url': self.host['api'] + handle.params,
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  };

  for (var name in opts) {
    if ('undefined' === typeof options[name]) {
      options[name] = opts[name];
    }
  }

  request(options, function(err, data) {
    if (err) return res.end(err);

    data = self.mime(data);
    handle.json(data);
  });
};
