/*!
 * OAuthware - OAuth - Request
 * Copyright(c) 2011-2012 CodeHolics Inc.
 * Copyright(c) 2011-2012 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var http        = require('http'),
    https       = require('https'),
    parse       = require('url').parse,
    querystring = require('querystring'),
    crypto      = require('crypto');


exports = module.exports = request;

exports.request = request;

exports.get = function (options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }

  options = options || {};

  options.method = 'GET';
  options.body = {};

  request(options, callback);
};

exports.put = function (options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }

  options = options || {};

  options.method = 'PUT';

  request(options, callback);
};

exports.post = function (options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }

  options = options || {};

  options.method = 'POST';

  request(options, callback);
};

exports.delete = function (options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }

  options = options || {};

  options.method = 'DELETE';
  options.body = {};

  request(options, callback);
};


function prepareOptions(options) {
  var method  = options['method'] || 'GET',
      url     = options['url'],
      query   = options['query'] || '',
      body    = options['body'] || '',
      headers = {},
      key;

  if ('string' === typeof url) {
    url = parse(url, true);
  }
  url.query = requestUriQuery(url.query || {}, query);

  for (key in options.headers) {
    headers[key.toLowerCase()] = options.headers[key];
  }

  headers['host'] = url.host; // or be hostname:port if port is exist
  headers['content-type'] = headers['content-type'] || 'application/x-www-form-urlencoded';

  body = formEncodedBody(headers['content-type'], body);
  headers['content-length'] = Buffer.byteLength(body);

  headers['accept']     = headers['accept'] || '*/*';
  headers['connection'] = headers['connection'] || 'close';
  headers['user-agent'] = headers['user-agent'] || 'OAuthware';

  return {
    url:      url,
    oauth:    options.oauth || undefined,
    protocol: url.protocol,
    hostname: url.hostname,
    port:     url.port,
    method:   method.toUpperCase(),
    path:     url.pathname + (url.query ? '?' + url.query : ''),
    headers:  headers,
    body:     body
  };
}

function request(options, callback) {
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }

  options = options || {};

  var url = options.url,
      schemes = { 'http:': http, 'https:': https },
      scheme, req;

  options = prepareOptions(options);

  if (false === options.protocol in schemes) {
    return callback && callback(new Error('protocol must be http or https'));
  }

  if (options.oauth) {
    try {
      options.headers['authorization'] = authorization(options);
    } catch (e) {
      return callback && callback(e);
    }
  }

  scheme = schemes[options.protocol];
  req = scheme.request({
    hostname: options.hostname,
    port:     options.port,
    method:   options.method,
    path:     options.path,
    headers:  options.headers
  }, responseOAuth);

  req.on('error', function (err) {
    return callback && callback(err);
  });

  if (options.method === 'POST' || options.method === 'PUT') {
    if (options.body) {
      req.write(options.body);
    }
  }
  req.end();

  return req;

  function responseOAuth(res) {
    var buf = ''; 

    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      buf += chunk;
    });

    res.on('end', function () {
      // redirect with response localtion headers
      if (res.statusCode == 301 || res.statusCode == 302) {
        options.url = res.headers.location;
        return request(options, callback);
      }

      if (res.statusCode >= 200 && res.statusCode <= 299) {
        return callback && callback(null, {type: res.headers['content-type'], body: buf});
      }

      return callback && callback({code: res.statusCode, type: res.headers['content-type'], body: buf});
    });
  }
};

function authorization(options) {
  var method       = options.method,
      url          = options.url,
      oauth        = options.oauth,
      content      = {type: options.headers['content-type'], body: options.body},
      nonceLength  = oauth['oauth_nonce_length'] || 32,
      signatureKey = {},
      parameters   = {},
      name;

  if ('undefined' === typeof oauth['oauth_signature_method'] ||
      false === oauth['oauth_signature_method'] in signature) {
    throw new Error('signature method must be PLAINTEXT or HMAC-SHA1 or RSA-SHA1');
  }

  for (name in oauth) {
    if ('oauth_nonce_size' === name) continue;

    if ('oauth_consumer_secret' === name || 'oauth_token_secret' === name) {
      signatureKey[name] = oauth[name];
    }

    if ((/^realm$/i).test(name) || (/^oauth_/).test(name)) {
      parameters[name] = oauth[name]; 
    }
  }

  if ('undefined' === typeof parameters['oauth_timestamp']) {
    parameters['oauth_timestamp'] = timestamp();
  }
  if ('undefined' === typeof parameters['oauth_nonce']) {
    parameters['oauth_nonce'] = nonce(nonceLength);
  }
  if ('undefined' === typeof parameters['oauth_signature']) {
    parameters['oauth_signature'] = signature(
      signatureKey, method, url, parameters, content
    );
  }

  return authorizationHeader(parameters);
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
  var chars = nonce.CHARS,
      result = '',
      i;
  for (i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

nonce.CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

/**
 * RFC 5849 3.4
 */
function signature(key, method, url, oauth, content) {
  switch (oauth['oauth_signature_method']) {
  case 'PLAINTEXT':
    return signature['PLAINTEXT'](key);

  case 'HMAC-SHA1':
    return signature['HMAC-SHA1'](
      key,
      signatureBaseString(method, url, oauth, content)
    );

  case 'RSA-SHA1':
    return signature['RSA-SHA1'](
      key,
      signatureBaseString(method, url, oauth, content)
    );

  default:
    return '';
  }
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
function signatureBaseString(method, url, oauth, content) {
  if ('string' === typeof url) {
    url = parse(url, true);
  }

  return [
    encodePercent(method.toUpperCase()),

    encodePercent(signatureBaseStringUri(url)),

    encodePercent(
      normalizeParameters(
        signatureParameters(url.query, oauth, content)
      )
    )
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
  if ('string' === typeof url) {
    url = parse(url, true);
  }

  var scheme    = url.protocol || 'http:',
      authority = url.hostname || '',
      port      = url.port || '',
      path      = url.pathname || '/'; // conforms to RFC 2616 section 3.2.2

  if (scheme === 'http:' && port === '80') port = '';
  if (scheme === 'https:' && port === '443') port = '';
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
function signatureParameters(query, oauth, content) {
  var parameters = {};

  parameters = merge(parameters, query || {});

  parameters = merge(parameters, oauth || {});

  if ('application/x-www-form-urlencoded' === content.type) {
    parameters = merge(parameters, content.body || {});
  }

  for (name in parameters) {
    if ('oauth_signature' === name || (/^realm$/i).test(name)) {
      delete parameters[name];
    }
  }

  return parameters;

  function merge(target, source) {
    var name;
    if ('string' === typeof source) {
      source = querystring.parse(source, '&', '=');
    }
    for (name in source) {
      if (undefined === target[name]) {
        target[name] = source[name];
      } else {
        target[name] = [].concat(target[name], source[name]);
      }
    }
    return target;
  }
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
  var pairs = [],
      name, value,
      length, i;

  for (name in parameters) {
    value = parameters[name];
    if (Array.isArray(value)) {
      for (i = 0, length = value.length; i < length; i += 1) {
        pairs.push([encodePercent(name), encodePercent(value[i])]);
      }
    } else {
      pairs.push([encodePercent(name), encodePercent(value)]);
    }
  }

  pairs.sort(function (a, b) {
    // sorted by name
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    // sorted by value if these name is same
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
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
signature['HMAC-SHA1'] = function (key, text) {
  key = encodePercent(key['oauth_consumer_secret'] || '')
      + '&'
      + encodePercent(key['oauth_token_secret'] || '');

  return crypto.createHmac('sha1', key).update(text).digest('base64');
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
signature['RSA-SHA1'] = function (key, text) {
  key = encodePercent(key['oauth_consumer_secret'] || '')
      + '&'
      + encodePercent(key['oauth_token_secret'] || '');

  throw new Error('RSA-SHA1 not yet implemented');
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
signature['PLAINTEXT'] = function (key) {
  key = encodePercent(key['oauth_consumer_secret'] || '')
      + '&'
      + encodePercent(key['oauth_token_secret'] || '');

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
  var header = 'OAuth', // OAuth is case insensitive
      pairs = [],
      name;

  for (name in parameters) {
    if ((/^realm$/i).test(name)) { // realm is case insensitive
      pairs.push('realm="' + encodePercent(parameters[name]) + '"');
      break;
    }
  }

  for (name in parameters) {
    if (/^oauth_/.test(name)) {
      pairs.push(encodePercent(name) + '="' + encodePercent(parameters[name]) + '"');
    }
  }

  return [header, pairs.join(', ')].join(' ');
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
function formEncodedBody(type, body) {
  if ('application/x-www-form-urlencoded' !== type) {
    return body;
  }
  if ('string' === typeof body) {
    return body;
  }

  return querystring.stringify(body || {}, '&', '=');
}

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
function requestUriQuery(query) {
  if (1 >= arguments.length && 'string' === typeof query) {
    return query;
  }

  var target = {},
      source, name,
      length, i;

  for (i = 0, length = arguments.length; i < length; i += 1) {
    source = arguments[i] || {};

    if ('string' === typeof source) {
      source = querystring.parse(source, '&', '=');
    }

    for (name in source) {
      if ('undefined' === typeof target[name]) {
        target[name] = source[name];
      } else {
        target[name] = [].concat(target[name], source[name]);
      }
    }
  }

  return querystring.stringify(target, '&', '=');
}

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
function decodePercent(str) {
  if (!str) {
    return '';
  }

  str = str.replace(/\+/g, ' ');

  return decodeURIComponent(str);
}

function encodePercent(str) {
  if (!str) {
      return '';
  }

  str = encodeURIComponent(str);

  // RFC3986 Section 2.2~2.3
  //  reserved: gem-delims sub-delims
  //  gem-delims: : / ? # [ ] @
  //  sub-delims: ! $ & ' ( ) * + , ; =
  //  unreserved: ALPHA DIGIT - . _ ~
  //  encodeURIComponent() does not encode: ALPHA DIGIT - _ . ! ~ * ' ( )
  return str.replace(/\!/g, '%21')
            .replace(/\'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A');
};
