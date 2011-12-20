var https       = require('https'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = request;

exports.request = request;

// This 'hack' method is required for sites that don't use
// 'access_token' as the name of the access token (for requests).
// ( http://tools.ietf.org/html/draft-ietf-oauth-v2-16#section-7 )
// it isn't clear what the correct value should be atm, so allowing
// for specific (temporary?) override for now.
var _accessTokenName = "access_token";

function request(options, callback) {
  var method  = options.method,
      url     = parse(options.url, true),
      headers = {},
      body    = querystring.stringify(options.body);

  for (var key in options.headers) {
    headers[key] = options.headers[key];
  }
  headers['host']           = url.host;
  headers['content-length'] = body ? Buffer.byteLength(body) : 0;
  headers['accept']         = headers['accept']     || '*/*';
  headers['connection']     = headers['connection'] || 'close';
  headers['user-agent']     = headers['user-agent'] || 'OAuthware';

  options = {
    host    : url.hostname,
    port    : url.port,
    path    : url.path,
    method  : method,
    headers : headers
  };

  var req = https.request(options, function (res) {
    var buf = '';

    res.setEncoding('utf8');

    res.on("data", function (chunk) {
      buf += chunk;
    });

    res.on("end", function () {
      // redirect with response localtion headers
    /*if (res.statusCode == 301 || res.statusCode == 302) {
        options.url = res.headers.location;
        return request(options, callback);
      }*/

      if (res.statusCode >= 200 && res.statusCode <= 299) {
        var results;
        try {
          // As of http://tools.ietf.org/html/draft-ietf-oauth-v2-07
          // responses should be in JSON
          results = JSON.parse(buf);
        } catch (e) {
          // .... However both Facebook + Github currently use rev05 of the spec
          // and neither seem to specify a content-type correctly in their response headers :(
          // clients of these services will suffer a *minor* performance cost of the exception
          // being thrown
          results = querystring.parse(buf);
        }
        return callback && callback(null, results);
      //return callback && callback(null, querystring.parse(buf));
      }

      return callback && callback({ code: res.statusCode });
    });
  });

  req.on('error', function(err) {
    callback(err);
  });

  if (method == 'POST' && body ) {
     req.write(body);
  }
  req.end();
};
