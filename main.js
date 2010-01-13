/*
  Name: djuio
  Description: Simple I/O url shortener.
  Author: Uwe Dauernheim, @uwe_
  Copyright: 2010 Kreisquadratur
  Note: Later maybe switching to picard or express
  
  TODO:
   - Implemented counter
   = Implement stats
   - Switch vendor code to git submodules (not couch, its buggy and was changed)
   - switch main.js and io.js to have the main routes in main.js and not io.js 
     by using methods like .get() and .post().
   - Using a router like http://github.com/defrex/node.routes.js/
   - Maybe include and use Undderscore.js @ http://documentcloud.github.com/underscore/
   - Go all crazy and use Simplex http://github.com/mshakhan/simplex/
*/

var sys = require("sys");
var http = require("http");
var url = require("url");

PORT = 8080;
IOHASHLENGTH = 4;
IOHOST = "http://djui.de";
IODBNAME = "io";

var io = require('./io');
var httphelper = require("./lib/httphelper");


var server = http.createServer(function(request, response) {
  process.mixin(response, httphelper);
  
  var paths = {
    "/": function(req, res) {
      io.welcomer(res)
    },
    "/shorten": function(req, res) {
      io.shorter(req, res)
    },
    "*":function(req, res) {
      io.expander(req, res)
    }
  };

  // http://nodejs.org/api.html#_url_module
  uri = url.parse(request.url, true);
  if (uri.pathname in paths)
    paths[uri.pathname].apply(this, [request, response]);
  else
    paths["*"].apply(this, [request, response]);
});
server.listen(PORT);
sys.debug("Server running at http://127.0.0.1:" + PORT + "/");
