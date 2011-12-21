
/*!
 * ThingsUp
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 luuvish
 * CodeHolics Licensed
 */

/**
 * Module dependencies.
 */

var connect = require('connect'),
    auth = require('../index'),
    fs = require('fs'),
    Twitter = require('../lib/twitter'),
    Facebook = require('../lib/facebook');

/**
 * Web client server parameters
 *
 * hostname: host server domain name
 * port:     http port number
 * service:  subdomain name
 *
 * server listens to http://hostname:port/service/..
 */

var hostname = '127.0.0.1',
    port = 8020;

// catch Exception

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err.stack);
});

function connect_auth() {
  var twitter = auth.Twitter({
    consumerKey    : 'uRnESc07dpIGdBDVc1V7A',
    consumerSecret : 'vB3t0xlZgyQdenJGh59rvlagd7rTfsdX5ddeCuAIwTo',
    callback       : 'http://' + hostname + ':' + port + '/auth/twitter_callback'
  });
  var facebook = auth.Facebook({
    appId          : '214990631897215',
    appSecret      : '236d093791188ff7bed07a817a63e53a',
    scope          : 'email',
    callback       : 'http://' + hostname + ':' + port + '/auth/facebook_callback'
  });
  var redirectOnLogout = function(redirectUrl) {
    return function(authContext, loggedOutUser, callback) {
      authContext.response.writeHead(303, { 'Location': redirectUrl });
      authContext.response.end('');
      if (callback) callback();
    };
  };

  function routes(app) {
    app.get('/auth/facebook/access_token', function(req, res, next) {
      if (req.isAuthenticated()) {
        
      } else {
        
      }
      next();
    });
    app.get('/auth/twitter/access_token', function(req, res, next) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      if (req.isAuthenticated()) {
        res.end(JSON.stringify(req.getAuthDetails()));
      } else {
        res.end(JSON.stringify({'error': 'notauthenticated'}));
      }
    });
    app.get('/logout', function(req, res, next) {
      req.logout(); // Using the 'event' model to do a redirect on logout.
    });
  }

  var server = auth({
    strategies    : [ twitter, facebook ],
    trace         : true,
    logoutHandler : redirectOnLogout('/')
  });
  server.use(connect.router(routes));
  return server;
}

function routes(app) {
  // Setup the 'template' pages (don't use sync calls generally, but meh.)
  var content = fs.readFileSync(__dirname + '/auth/auth.html', 'utf8');

  app.get(/.*/, function(req, res, next) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    if (req.isAuthenticated()) {
      res.end(content.replace("#USER#", JSON.stringify(req.getAuthDetails().user)));
    } else {
      res.end(content.replace("#PAGE#", req.url));
    }
  });
}

function oauthware_twitter() {
  return new Twitter({
    consumerKey    : 'uRnESc07dpIGdBDVc1V7A',
    consumerSecret : 'vB3t0xlZgyQdenJGh59rvlagd7rTfsdX5ddeCuAIwTo',
    callback       : 'http://' + hostname + ':' + port + '/auth/twitter/callback'
  });
}
function oauthware_facebook() {
  return new Facebook({
    appId          : '214990631897215',
    appSecret      : '236d093791188ff7bed07a817a63e53a',
    scope          : 'email',
    callback       : 'http://' + hostname + ':' + port + '/auth/facebook/callback'
  });
}

/**
 * router hostname:port/domain/.. to /public/.. directory
 */

var server = connect.createServer(
  connect.logger(),
  connect.favicon(),
  connect['static'](__dirname + '/auth'),
  connect.cookieParser(),
  connect.session({
    secret : 'FlurbleGurgleBurgle', 
    store  : new connect.session.MemoryStore({ reapInterval: -1 })
  }),
//connect_auth(),
  oauthware_twitter(),
  oauthware_facebook(),
  connect.router(routes)
);

// listen to http://hostname:port

server.listen(port, hostname);
