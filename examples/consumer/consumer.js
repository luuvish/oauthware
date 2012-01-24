
/*!
 * Consumer
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 luuvish
 * CodeHolics Licensed
 */

/**
 * Module dependencies.
 */

var oauthware = require('../../index'),
    connect   = require('connect'),
    parse     = require('url').parse,
    fs        = require('fs');

/**
 * Web client server parameters
 *
 * hostname: host server domain name
 * port:     http port number
 * service:  subdomain name
 *
 * server listens to http://hostname:port/service/..
 */

var serverUrl = 'http://127.0.0.1:8020/oauthware/',
    url       = parse(serverUrl),
    protocol  = url.protocol || 'http:',
    hostname  = url.hostname || '127.0.0.1',
    port      = url.port     || (protocol === 'https:' ? '443' : '80'),
    pathname  = url.pathname || '/',
    server,
    config,
    oauth;

// catch Exception

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err.stack);
});

/**
 * router hostname:port/domain/.. to /public/.. directory
 */

if (protocol === 'https:') {
  server = connect.createServer({
    key: fs.readFileSync(__dirname + '/server-key.pem'),
    cert: fs.readFileSync(__dirname + '/server-cert.pem')
  });
} else {
  server = connect.createServer();
}

function redirect(pathname) {
  if ('/' === pathname[pathname.length - 1]) {
    pathname = pathname.slice(0, -1);
  }

  return function redirect(req, res, next) {
    if (pathname == parse(req.url).pathname) {
      res.statusCode = 301;
      res.setHeader('Location', pathname + '/');
      res.end('Redirecting to ' + pathname + '/');
      return;
    }
    next();
  };
}

//server.use(connect.logger());
server.use(redirect(pathname));

server.use(pathname, connect.favicon())
      .use(pathname, connect.static(__dirname + '/public'))
      .use(pathname, connect.cookieParser())
      .use(pathname, connect.session({
        secret: 'FlurbleGurgleBurgle', 
        store: new connect.session.MemoryStore({ reapInterval: -1 })
      }));

oauth = oauthware.createServer();
server.use(pathname, oauth);

try {
  config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
} catch (e) {
  console.log('config.json is not found (%j)', e);
}

for (var m in config) {
  if (oauthware[m]) {
    config[m].host = serverUrl;
    config[m].path = '/' + m;

    oauth.use(oauthware[m](config[m]));
  }
}

// listen to http://hostname:port

server.listen(port, hostname);

console.log('listen to ' + protocol + '//' + hostname + ':' + port + pathname);
