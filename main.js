/*
  Name: djuio
  Description: Simple I/O url shortener.
  Author: Uwe Dauernheim, @uwe_
  Copyright: 2010 Kreisquadratur
  Note: Later maybe switching to picard or express
  
  TODO:
   - switch main.js and io.js to have the main routes in main.js and not io.js 
     by using methods like .get() and .post().
*/

var sys = require("sys");
var http = require("http");
var url = require("url");

var io = require('./io');
var httphelper = require("./lib/httphelper");

IOLENGTH = 4;
IOHOST = "http://djui.de";


var server = http.createServer(function(request, response) {
  response.print = httphelper.print;
  response.printHTML = httphelper.printHTML;
  response.printJSON = httphelper.printJSON;
  
  var paths = {
    "/": function(req, res) {
      io.welcomer(res)
    },
    "/shorten": function(req, res) {
      io.shorter(req, res)
    },
    "*":function(req, res) {
      io.expander(res)
    }
  };

  // http://nodejs.org/api.html#_url_module
  uri = url.parse(request.url, true);
  if (uri.pathname in paths)
    paths[uri.pathname].apply(this, [request, response]);
  else
    paths["*"].apply(this, [request, response]);
});
server.listen("8080");
sys.puts("Server running at http://127.0.0.1:8080/");
