var http        = require('http'),
    https       = require('https'),
    parse       = require('url').parse,
    querystring = require('querystring'),
    crypto      = require('crypto');


exports = module.exports = OAuth;

function OAuth() {}


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
OAuth.prototype.requestToken = function (options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options  = {};
  }

  var oauth_callback = options['oauth_callback']  || 'oob';
  // oob (case sensitive) is out-of-band configuration
  options = makeRequest(options);
  options.authorization['oauth_callback'] = oauth_callback;

  var parsedUrl = parse(options.url);
  options.headers['Host']           = parsedUrl.host; // MUST be hostname:port if port is exist
  options.headers['Content-Type']   = options.contentType;
  options.authorization['oauth_signature'] = signature(options);
  options.headers['Authorization']  = authorizationHeader(options.authorization);
  options.entityBody = querystring.stringify(options.entityBody);
  options.headers['Content-Length'] = Buffer.byteLength(options.entityBody);

  var protocol = parsedUrl.protocol == "https:" ? https : http;

  var opts = {
    hostname : parsedUrl.hostname,
    port     : parsedUrl.port,
    method   : options.method.toUpperCase(),
    path     : parsedUrl.path,
    headers  : options.headers
  };

  var req = performSecureRequest(protocol, opts, callback);

  req.on('error', function (err) {
    return callback && callback(err);
  });

  if (options.entityBody) {
    req.write(options.entityBody);
  }
  req.end();
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
OAuth.prototype.accessToken = function (options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options  = {};
  }

  var oauth_verifier = options['oauth_verifier'] || '';
  options = makeRequest(options);
  options.authorization['oauth_verifier'] = oauth_verifier;

  var parsedUrl = parse(options.url);
  options.headers['Host']           = parsedUrl.host; // MUST be hostname:port if port is exist
  options.headers['Content-Type']   = options.contentType;
  options.authorization['oauth_signature'] = signature(options);
  options.headers['Authorization']  = authorizationHeader(options.authorization);
  options.entityBody = querystring.stringify(options.entityBody);
  options.headers['Content-Length'] = Buffer.byteLength(options.entityBody);

  var protocol = parsedUrl.protocol == "https:" ? https : http;
  
  var opts = {
    hostname : parsedUrl.hostname,
    port     : parsedUrl.port,
    method   : options.method.toUpperCase(),
    path     : parsedUrl.path,
    headers  : options.headers
  };

  var req = performSecureRequest(protocol, opts, callback);

  req.on('error', function (err) {
    return callback && callback(err);
  });

  if (options.entityBody) {
    req.write(options.entityBody);
  }
  req.end();
};


function performSecureRequest(protocol, options, callback) {
  var req = protocol.request(options, function (res) {
    var buf = ''; 

    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      buf += chunk;
    });

    res.on('end', function () {
      // Follow 301 or 302 redirects with Location HTTP header
      if (res.statusCode == 301 || res.statusCode == 302) {
        return performSecureRequest({}, callback);
      }

      if (res.statusCode >= 200 && res.statusCode <= 299) {
        return callback && callback(null, querystring.parse(buf));
      }
      return callback && callback({ statusCode: res.statusCode, data: buf });
    });
  });

  return req;
}
OAuth.prototype['delete'] = function(url, oauth_token, oauth_token_secret, callback) {
  var options = {
    oauth_token: oauth_token,
    oauth_token_secret: oauth_token_secret,
    method: "DELETE",
    url: url,
    extra_params: null,
    post_body: "",
    post_content_type: null
  };

  return performSecureRequest(options, callback);
};

OAuth.prototype.get = function(url, oauth_token, oauth_token_secret, callback) {
  var options = {
    oauth_token: oauth_token,
    oauth_token_secret: oauth_token_secret,
    method: "GET",
    url: url,
    extra_params: null,
    post_body: "",
    post_content_type: null
  };

  return performSecureRequest(options, callback);
};

OAuth.prototype._putOrPost = function(method, url, oauth_token, oauth_token_secret, post_body, post_content_type, callback) {
  var extra_params = null;
  if (typeof post_content_type == "function") {
    callback = post_content_type;
    post_content_type = null;
  }
  if (typeof post_body != "string") {
    post_content_type = "application/x-www-form-urlencoded";
    extra_params = post_body;
    post_body = null;
  }
  var options = {
    oauth_token: oauth_token,
    oauth_token_secret: oauth_token_secret,
    method: method,
    url: url,
    extra_params: extra_params,
    post_body: post_body,
    post_content_type: post_content_type
  };

  return performSecureRequest(options, callback);
};

OAuth.prototype.put = function(url, oauth_token, oauth_token_secret, post_body, post_content_type, callback) {
  return oauth.prototype._putOrPost(
    "PUT", url,
    oauth_token, oauth_token_secret,
    post_body, post_content_type,
    callback);
};

OAuth.prototype.post = function(url, oauth_token, oauth_token_secret, post_body, post_content_type, callback) {
  return oauth.prototype._putOrPost(
    "POST", url,
    oauth_token, oauth_token_secret,
    post_body, post_content_type,
    callback);
};

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

 *  3.  The client calculates and assigns the value of the
 *      "oauth_signature" parameter as described in Section 3.4 and adds
 *      the parameter to the request using the same method as in the
 *      previous step.
 *
 *  4.  The client sends the authenticated HTTP request to the server.
 */
function makeRequest(options) {
  options = {
    method        : options.method || 'POST',
    url           : options.url,
    contentType   : options.contentType || 'application/x-www-form-urlencoded',
    signatureKey  : {
      'oauth_consumer_secret'  : options['oauth_consumer_secret'] || '',
      'oauth_token_secret'     : options['oauth_token_secret']    || ''
    },
    authorization : {
      'oauth_consumer_key'     : options['oauth_consumer_key'],
      'oauth_token'            : options['oauth_token'] || '',
      'oauth_signature_method' : options['oauth_signature_method'],
    //'oauth_signature'        : options['oauth_signature'] || '',
      'oauth_timestamp'        : options['oauth_timestamp'] || timestamp(),
      'oauth_nonce'            : options['oauth_nonce']     || nonce(options['oauth_nonce_length']),
      'oauth_version'          : options['oauth_version']   || '1.0'
    },
    entityBody    : {}
  };

  options.headers = {
    'Connection' : 'close',
    'Accept'     : '*/*',
    'User-Agent' : 'OAuthware'
  };

  return options;
}

/**
 * RFC5849 Section 3.3
 *
 *  The timestamp value MUST be a positive integer.  Unless otherwise
 *  specified by the server's documentation, the timestamp is expressed
 *  in the number of seconds since January 1, 1970 00:00:00 GMT.
 */
function timestamp() {
  return Math.floor((new Date()).getTime() / 1000);  
}

/**
 * RFC5849 Section 3.3
 *
 *  A nonce is a random string, uniquely generated by the client to allow
 *  the server to verify that a request has never been made before and
 *  helps prevent replay attacks when requests are made over a non-secure
 *  channel.  The nonce value MUST be unique across all requests with the
 *  same timestamp, client credentials, and token combinations.
 */
function nonce(length) {
  var chars = nonce.CHARS;
  var result = '';
  for (var i = 0; i < length; ++i) {
    var rnum = Math.floor(Math.random() * chars.length);
    result += chars[rnum];
  }
  return result;
}

nonce.CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

/**
 * RFC 5849 3.4
 */
function signature(options) {
  if (options.authorization.oauth_signature_method == "PLAINTEXT") {
    return OAuth.prototype['PLAINTEXT'](options.signatureKey);
  }

  var baseString = signatureBaseString(options);
  return OAuth.prototype['HMAC-SHA1'](options.signatureKey, baseString);
}

/**
 * RFC5849 Section 3.4.1.1
 *
 *  The signature base string is constructed by concatenating together,
 *  in order, the following HTTP request elements:
 *
 *  1.  The HTTP request method in uppercase.  For example: "HEAD",
 *      "GET", "POST", etc.  If the request uses a custom HTTP method, it
 *      MUST be encoded (Section 3.6).
 *
 *  2.  An "&" character (ASCII code 38).
 *
 *  3.  The base string URI from Section 3.4.1.2, after being encoded
 *      (Section 3.6).
 *
 *  4.  An "&" character (ASCII code 38).
 *
 *  5.  The request parameters as normalized in Section 3.4.1.3.2, after
 *      being encoded (Section 3.6).
 */
function signatureBaseString(options) {
  var parameters = signatureParameters(
    options.url, options.contentType,
    options.authorization, options.entityBody
  );

  return [
    encodePercent(options.method.toUpperCase()),
    encodePercent(signatureBaseStringUri(options.url)),
    encodePercent(normalizeParameters(parameters))
  ].join('&');
}

/**
 * RFC5849 Section 3.4.1.2
 *
 *  The scheme, authority, and path of the request resource URI [RFC3986]
 *  are included by constructing an "http" or "https" URI representing
 *  the request resource (without the query or fragment) as follows:
 *
 *  1.  The scheme and host MUST be in lowercase.
 *
 *  2.  The host and port values MUST match the content of the HTTP
 *      request "Host" header field.
 *
 *  3.  The port MUST be included if it is not the default port for the
 *      scheme, and MUST be excluded if it is the default.  Specifically,
 *      the port MUST be excluded when making an HTTP request [RFC2616]
 *      to port 80 or when making an HTTPS request [RFC2818] to port 443.
 *      All other non-default port numbers MUST be included.
 */
function signatureBaseStringUri(url) {
  var url       = parse(url),
      scheme    = url.protocol || 'http:',
      authority = url.hostname || '',
      port      = url.port     || '',
      path      = url.pathname || '/'; // conforms to RFC 2616 section 3.2.2

  if (scheme == 'http:'  && port == '80' ) port = '';
  if (scheme == 'https:' && port == '443') port = '';
  if (port) port = ':' + port;

  return scheme + '//' + authority + port + path;
}

/**
 * RFC5849 Section 3.4.1.3.1
 *
 *  The parameters from the following sources are collected into a single
 *  list of name/value pairs:
 *
 *  o  The query component of the HTTP request URI as defined by
 *     [RFC3986], Section 3.4.  The query component is parsed into a list
 *     of name/value pairs by treating it as an
 *     "application/x-www-form-urlencoded" string, separating the names
 *     and values and decoding them as defined by
 *     [W3C.REC-html40-19980424], Section 17.13.4.
 *
 *  o  The OAuth HTTP "Authorization" header field (Section 3.5.1) if
 *     present.  The header's content is parsed into a list of name/value
 *     pairs excluding the "realm" parameter if present.  The parameter
 *     values are decoded as defined by Section 3.5.1.
 *
 *  o  The HTTP request entity-body, but only if all of the following
 *     conditions are met:
 *
 *     *  The entity-body is single-part.
 *
 *     *  The entity-body follows the encoding requirements of the
 *        "application/x-www-form-urlencoded" content-type as defined by
 *        [W3C.REC-html40-19980424].
 *
 *     *  The HTTP request entity-header includes the "Content-Type"
 *        header field set to "application/x-www-form-urlencoded".
 *
 *     The entity-body is parsed into a list of decoded name/value pairs
 *     as described in [W3C.REC-html40-19980424], Section 17.13.4.
 *
 *  The "oauth_signature" parameter MUST be excluded from the signature
 *  base string if present.  Parameters not explicitly included in the
 *  request MUST be excluded from the signature base string (e.g., the
 *  "oauth_version" parameter when omitted).
 */
function signatureParameters(url, contentType, authorization, entityBody) {
  var url = parse(url, true),
      parameters = {},
      key;

  for (key in url.query) {
    parameters[key] = url.query[key];
  }

  for (key in authorization) {
    parameters[key] = authorization[key];
  }

  if (entityBody && contentType == 'application/x-www-form-urlencoded') {
    if ('string' === typeof entityBody) {
      var str = querystring.parse(entityBody);
      for (key in str) {
        parameters[key] = str[key];
      }
    } else {
      for (key in entityBody) {
        parameters[key] = entityBody[key];
      }
    }
  }

  if (parameters['oauth_signature']) delete parameters['oauth_signature'];
  if (parameters['relm']) delete parameters['relm'];

  return parameters;
}

/**
 * RFC5849 Section 3.4.1.3.2
 *
 *  The parameters collected in Section 3.4.1.3 are normalized into a
 *  single string as follows:
 *
 *  1.  First, the name and value of each parameter are encoded
 *      (Section 3.6).
 *
 *  2.  The parameters are sorted by name, using ascending byte value
 *      ordering.  If two or more parameters share the same name, they
 *      are sorted by their value.
 *
 *  3.  The name of each parameter is concatenated to its corresponding
 *      value using an "=" character (ASCII code 61) as a separator, even
 *      if the value is empty.
 *
 *  4.  The sorted name/value pairs are concatenated together into a
 *      single string by using an "&" character (ASCII code 38) as
 *      separator.
 */
function normalizeParameters(parameters) {
  if (parameters == null) {
    return '';
  }

  var pairs = [],
      key, value, encKey;

  for (key in parameters) {
    encKey = encodePercent(key);
    value = parameters[key];
    if (Array.isArray(value)) {
      value.forEach(function (v) {
        pairs.push([encKey, encodePercent(v)]);
      });
    } else {
      pairs.push([encKey, encodePercent(value)]);
    }
  }

  pairs.sort(function (a, b) {
    // sorted by name
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return  1;
    // sorted by value if these name is same
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return  1;
    return 0;
  });

  pairs = pairs.map(function (v) { return v.join('='); });

  return pairs.join('&');
}

/**
 * RFC5849 Section 3.4.2
 *
 *  The "HMAC-SHA1" signature method uses the HMAC-SHA1 signature
 *  algorithm as defined in [RFC2104]:
 *
 *   digest = HMAC-SHA1 (key, text)
 *
 *  The HMAC-SHA1 function variables are used in following way:
 *
 *  text    is set to the value of the signature base string from
 *          Section 3.4.1.1.
 *
 *  key     is set to the concatenated values of:
 *
 *          1.  The client shared-secret, after being encoded
 *              (Section 3.6).
 *
 *          2.  An "&" character (ASCII code 38), which MUST be included
 *              even when either secret is empty.
 *
 *          3.  The token shared-secret, after being encoded
 *              (Section 3.6).
 *
 *  digest  is used to set the value of the "oauth_signature" protocol
 *          parameter, after the result octet string is base64-encoded
 *          per [RFC2045], Section 6.8.
 */
OAuth.prototype['HMAC-SHA1'] = function (key, text) {
  key = encodePercent(key['oauth_consumer_secret'])
      + '&'
      + encodePercent(key['oauth_token_secret']);

  return crypto.createHmac("sha1", key)
               .update(text)
               .digest("base64");
};

/**
 * RFC5849 Section 3.4.3
 *
 *  The "RSA-SHA1" signature method uses the RSASSA-PKCS1-v1_5 signature
 *  algorithm as defined in [RFC3447], Section 8.2 (also known as
 *  PKCS#1), using SHA-1 as the hash function for EMSA-PKCS1-v1_5.  To
 *  use this method, the client MUST have established client credentials
 *  with the server that included its RSA public key (in a manner that is
 *  beyond the scope of this specification).
 *
 *  The signature base string is signed using the client's RSA private
 *  key per [RFC3447], Section 8.2.1:
 *
 *    S = RSASSA-PKCS1-V1_5-SIGN (K, M)
 *
 *  Where:
 *
 *  K     is set to the client's RSA private key,
 *
 *  M     is set to the value of the signature base string from
 *        Section 3.4.1.1, and
 *
 *  S     is the result signature used to set the value of the
 *        "oauth_signature" protocol parameter, after the result octet
 *        string is base64-encoded per [RFC2045] section 6.8.
 *
 *  The server verifies the signature per [RFC3447] section 8.2.2:
 *
 *    RSASSA-PKCS1-V1_5-VERIFY ((n, e), M, S)
 *
 *  Where:
 *
 *  (n, e) is set to the client's RSA public key,
 *
 *  M      is set to the value of the signature base string from
 *         Section 3.4.1.1, and
 *
 *  S      is set to the octet string value of the "oauth_signature"
 *         protocol parameter received from the client.
 */
OAuth.prototype['RSA-SHA1'] = function (key, text) {
  key = encodePercent(key['oauth_consumer_secret'])
      + '&'
      + encodePercent(key['oauth_token_secret']);

  return crypto.createHmac("sha1", key)
               .update(text)
               .digest("base64");
};

/**
 * RFC5849 Section 3.4.4
 *
 *  The "PLAINTEXT" method does not employ a signature algorithm.  It
 *  MUST be used with a transport-layer mechanism such as TLS or SSL (or
 *  sent over a secure channel with equivalent protections).  It does not
 *  utilize the signature base string or the "oauth_timestamp" and
 *  "oauth_nonce" parameters.
 *
 *  The "oauth_signature" protocol parameter is set to the concatenated
 *  value of:
 *
 *  1.  The client shared-secret, after being encoded (Section 3.6).
 *
 *  2.  An "&" character (ASCII code 38), which MUST be included even
 *      when either secret is empty.
 *
 *  3.  The token shared-secret, after being encoded (Section 3.6).
 */
OAuth.prototype['PLAINTEXT'] = function (key) {
  key = encodePercent(key['oauth_consumer_secret'])
      + '&'
      + encodePercent(key['oauth_token_secret']);

  return key;
};

/**
 * RFC5849 Section 3.5.1
 *
 *  Protocol parameters can be transmitted using the HTTP "Authorization"
 *  header field as defined by [RFC2617] with the auth-scheme name set to
 *  "OAuth" (case insensitive).
 *
 *  Protocol parameters SHALL be included in the "Authorization" header
 *  field as follows:
 *
 *  1.  Parameter names and values are encoded per Parameter Encoding
 *      (Section 3.6).
 *
 *  2.  Each parameter's name is immediately followed by an "=" character
 *      (ASCII code 61), a """ character (ASCII code 34), the parameter
 *      value (MAY be empty), and another """ character (ASCII code 34).
 *
 *  3.  Parameters are separated by a "," character (ASCII code 44) and
 *      OPTIONAL linear whitespace per [RFC2617].
 *
 *  4.  The OPTIONAL "realm" parameter MAY be added and interpreted per
 *      [RFC2617] section 1.2.
 */
function authorizationHeader(parameters) {
  var header = 'OAuth'; // OAuth is case insensitive
  var params = [];

  for (var name in parameters) {
    var value = parameters[name];
    if ((/^realm$/i).test(name)) { // realm is case insensitive
      params.push('realm="' + encodePercent(value) + '"');
    }
  }

  for (var name in parameters) {
    var value = parameters[name];
    if (/^oauth_/.test(name)) {
      params.push(encodePercent(name) + '="' +
                  encodePercent(value) + '"');
    }
  }

  return header + ' ' + params.join(', ');
}

/**
 * RFC5849 Section 3.5.2
 *
 *  Protocol parameters can be transmitted in the HTTP request entity-
 *  body, but only if the following REQUIRED conditions are met:
 *
 *  o  The entity-body is single-part.
 *
 *  o  The entity-body follows the encoding requirements of the
 *     "application/x-www-form-urlencoded" content-type as defined by
 *     [W3C.REC-html40-19980424].
 *
 *  o  The HTTP request entity-header includes the "Content-Type" header
 *     field set to "application/x-www-form-urlencoded".
 *
 *  The entity-body MAY include other request-specific parameters, in
 *  which case, the protocol parameters SHOULD be appended following the
 *  request-specific parameters, properly separated by an "&" character
 *  (ASCII code 38).
 */
function formEncodedBody() {}

/**
 * RFC5849 Section 3.5.3
 *
 *  Protocol parameters can be transmitted by being added to the HTTP
 *  request URI as a query parameter as defined by [RFC3986], Section 3.
 *
 *  The request URI MAY include other request-specific query parameters,
 *  in which case, the protocol parameters SHOULD be appended following
 *  the request-specific parameters, properly separated by an "&"
 *  character (ASCII code 38).
 */
function requestUriQuery() {}

/**
 * RFC5849 Section 3.6
 *
 *  Existing percent-encoding methods do not guarantee a consistent
 *  construction of the signature base string.  The following percent-
 *  encoding method is not defined to replace the existing encoding
 *  methods defined by [RFC3986] and [W3C.REC-html40-19980424].  It is
 *  used only in the construction of the signature base string and the
 *  "Authorization" header field.
 *
 *  This specification defines the following method for percent-encoding
 *  strings:
 *
 *  1.  Text values are first encoded as UTF-8 octets per [RFC3629] if
 *      they are not already.  This does not include binary values that
 *      are not intended for human consumption.
 *
 *  2.  The values are then escaped using the [RFC3986] percent-encoding
 *      (%XX) mechanism as follows:
 *
 *      *  Characters in the unreserved character set as defined by
 *         [RFC3986], Section 2.3 (ALPHA, DIGIT, "-", ".", "_", "~") MUST
 *         NOT be encoded.
 *
 *      *  All other characters MUST be encoded.
 *
 *      *  The two hexadecimal characters used to represent encoded
 *         characters MUST be uppercase.
 *
 *  This method is different from the encoding scheme used by the
 *  "application/x-www-form-urlencoded" content-type (for example, it
 *  encodes space characters as "%20" and not using the "+" character).
 *  It MAY be different from the percent-encoding functions provided by
 *  web-development frameworks (e.g., encode different characters, use
 *  lowercase hexadecimal characters).
 */
function decodePercent(s) {
  if (s == null) {
    return '';
  }

  s = s.replace(/\+/g, ' ');

  return decodeURIComponent(s);
}

function encodePercent(s) {
  if (s == null) {
      return '';
  }

  if (Array.isArray(s)) {
      var e = '';
      for (var i = 0; i < s.length; ++s) {
          if (e != '') e += '&';
          e += encodePercent(s[i]);
      }
      return e;
  }

  // RFC3986 Section 2.2~2.3
  //  reserved: gem-delims sub-delims
  //  gem-delims: : / ? # [ ] @
  //  sub-delims: ! $ & ' ( ) * + , ; =
  //  unreserved: ALPHA DIGIT - . _ ~
  //  encodeURIComponent() does not encode: ALPHA DIGIT - _ . ! ~ * ' ( )
  s = encodeURIComponent(s);

  s = s.replace(/\!/g, '%21')
       .replace(/\'/g, '%27')
       .replace(/\(/g, '%28')
       .replace(/\)/g, '%29')
       .replace(/\*/g, '%2A');
  return s;
};
