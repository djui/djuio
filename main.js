/*
  Name: djuio
  Description: Simple I/O url shortener.
  Author: Uwe Dauernheim, @uwe_
  Copyright: 2010 Kreisquadratur
  Note: Later maybe switching to picard or express
  
  TODO:
   - Implemented counter
   - Implement stats
   - Use a real database as datastore
   - Using router methods like .get() and .post(), or...
   - Using a router like http://github.com/defrex/node.routes.js/
   - Maybe include and use Underscore.js @ http://documentcloud.github.com/underscore/
   - Go all crazy and use Simplex http://github.com/mshakhan/simplex/
*/

var sys = require("sys");
var http = require("http");
var url = require("url");
PORT = 8000;
IOHASHLENGTH = 4;
IOHOST = "http://djui.de";
IODBPATH = "io.db";

var io = require("./io");
var httphelper = require("./lib/httphelper");


// Thanks Boaz Yahav @ http://www.weberdev.com/get_example-4228.html
function isUrl(s) {
    var regexp = /^[A-Za-z]+:\/\/[A-Za-z0-9-_]+\\.[A-Za-z0-9-_%&\?\/.=]+$/;
    return regexp.test(s);
}

var server = http.createServer(function(req, res) {
        // Add request send function to the request object
        process.mixin(res, httphelper);
        
        // @ http://nodejs.org/api.html#_url_module
        path = (url.parse(req.url, true)).pathname;
        
        if (path == "/") {
            res.sendHTML(200, 
                         "Hejsan, this is <a href=\"http://twitter.com/uwe_\">@uwe_'s</a> personal URL shortener.<br/>\n" + 
                         "Thanks to <a href=\"http://twitter.com/uwe_\">@janl</a> for inspiration!");
        } else if (path == "/shorten") {
            var uri = url.parse(req.url, true);
            href = uri.query.url || "";
            if (href === "") {
                sys.debug("Href parameter undefined");
                res.sendPlain(200, "ERROR: Href parameter undefined");
                return;
            } else if (!isUrl(href)) {
                sys.debug("Href parameter is not a valid URL");
                res.sendPlain(200, "ERROR: Href parameter is not a valid URL");
                return;
            }
            io.doShorten(href, res);
        } else {
            var hash = path.substring(1);
            io.doExpand(hash, res);
        };
    });
io.initialize();
server.listen(PORT);
sys.debug("Server running at http://127.0.0.1:" + PORT + "/");
