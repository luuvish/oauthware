
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

function connect_oauthware() {
  return connect.createServer(
    new Twitter({
      consumerKey    : 'uRnESc07dpIGdBDVc1V7A',
      consumerSecret : 'vB3t0xlZgyQdenJGh59rvlagd7rTfsdX5ddeCuAIwTo',
      callback       : 'http://' + hostname + ':' + port + '/auth/twitter/callback'
    }),
    new Facebook({
      appId          : '214990631897215',
      appSecret      : '236d093791188ff7bed07a817a63e53a',
      scope          : 'email',
      callback       : 'http://' + hostname + ':' + port + '/auth/facebook/callback'
    })
  );
}

/**
 * router hostname:port/domain/.. to /public/.. directory
 */

var server = connect.createServer(
  connect.logger(),
  connect.favicon(),
  connect['static'](__dirname + '/consumer'),
  connect.cookieParser(),
  connect.session({
    secret : 'FlurbleGurgleBurgle', 
    store  : new connect.session.MemoryStore({ reapInterval: -1 })
  }),
  connect_oauthware()
);

// listen to http://hostname:port

server.listen(port, hostname);
