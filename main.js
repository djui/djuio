/*
  Name: djuio
  Description: Simple I/O url shortener.
  Author: Uwe Dauernheim, @uwe_
  Copyright: 2010 Kreisquadratur
  Note: Later maybe switching to picard or express
*/

var http = require("http"),
    sys = require("sys"),
    url = require("url");

var io = require("./core"),
    date = require("./date");

var ioLength = 4,
    ioHost = "http://djui.de";

function respond(res, status, str) {
  var body = str;
  res.sendHeader(status, [ ["Content-Type", "text/plain"]
                       , ["Content-Length", body.length]
                       ]);
  res.sendBody(body);
  res.finish();
}

function respondHTML(res, status, str) {
  var body = str;
  res.sendHeader(status, [ ["Content-Type", "text/html"]
                       , ["Content-Length", body.length]
                       ]);
  res.sendBody(body);
  res.finish();
}

function respondJSON(res, status, obj) {
  var body = JSON.stringify(obj);
  res.sendHeader(status, [ ["Content-Type", "text/json"]
                       , ["Content-Length", body.length]
                       ]);
  res.sendBody(body);
  res.finish();
}

var server = http.createServer(function (req, res) {
  var paths = {
    "/": function(uri, req, res) {
      respondHTML(res, 200, 
        "Hejsan, this is <a href=\"http://twitter.com/uwe_\">@uwe_'s</a> personal URL shortener.<br/>\n" + 
        "Thanks to <a href=\"http://twitter.com/uwe_\">@janl</a> for inspiration!");
    },
    "/shorten": function(uri, req, res) {      
      if (typeof(uri.query) === 'undefined' || 
          typeof(uri.query.url) === 'undefined' ||
          uri.query.url == "") {
        sys.debug("ERROR: URL parameter undefined");
        respond(res, 200, "ERROR: URL parameter undefined");
        return;
      }

      var shortUrl = ioHost + "/" + io.transform(ioLength);
      var item = {
        "id": shortUrl,
        "target": uri.query.url, 
        "date":  date.rfc3339(),
        "counter": 0};        
      io.store(item);
      sys.debug("Store: " + JSON.stringify(item));

      respond(res, 200, shortUrl);
    },
    "*": function(uri, req, res) {
      var target = io.lookup(ioHost + uri.pathname);
      sys.debug("Lookup: " + ioHost + uri.pathname + " => " + target);
      if (target !== null) {
        var body = "If you don't get redirected, please go to " + target + "\n";
        res.sendHeader(302, [ ["Content-Type", "text/html"],
                             ["Content-Length", body.length],
                             ["Location", target]]);
        res.sendBody(body);
        res.finish();
      } else {
        respond(res, 404, "File not found.");
      }
    }
  };

  // http://nodejs.org/api.html#_url_module
  uri = url.parse(req.url, true);
  
  if (uri.pathname in paths)
    paths[uri.pathname].apply(this, [uri, req, res]);
  else
    paths["*"].apply(this, [uri, req, res]);
});
server.listen("8080");
sys.puts("Server running at http://127.0.0.1:8000/");