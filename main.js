/*
  Name: djuio
  Description: Simple I/O url shortener.
  Author: Uwe Dauernheim, @uwe_
  Copyright: 2010 Kreisquadratur
  - It features a simple statistics page ("/~stats")
  - It has a counter and an append-only db, filesystem based 
  
  TODO:
  - Use a real database as datastore
  - Using router methods like .get() and .post(), or...
  - Using a router like http://github.com/defrex/node.routes.js/
  - Maybe include and use Underscore.js @ http://documentcloud.github.com/underscore/
  - Go all crazy and use Simplex http://github.com/mshakhan/simplex/
  - Later maybe switching to picard or express
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
    var regexp = /^[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_%&?\/.=]+$/;
    return regexp.test(s);
}

var server = http.createServer(function(req, res) {
        // Add request send function to the request object
        process.mixin(res, httphelper);
        
        // @ http://nodejs.org/api.html#_url_module
        path = (url.parse(req.url, true)).pathname;
        
        if (path == "/") {
            res.sendHTML(302, "If you don't get redirected, please go to " +
                         "<a href=\"http://www.djui.de/\">http://www.djui.de/</a>\n",
                         [["Location", "http://www.djui.de/"]]);
        } else if (path == "/favicon.ico") {
            res.sendPlain(404, "ERROR: Not Found\n");
        } else if (path == "/robots.txt") {
            res.sendPlain(200, "User-agent: *\nDisallow: /~*\n");
        } else if (path == "/~stats") {
            try {
                io.doStats(res);
            } catch (e) {
                sys.error("ERROR: " + e.description);
                res.sendPlain(500, "ERROR: " + e.description);
            }
        } else if (path == "/~") {
            var uri = url.parse(req.url, true);
            if (typeof(uri.query) === 'undefined' ||
                typeof(uri.query.url) === 'undefined' ||
                uri.query.url == "") {
                res.sendHTML(200, 
                             "<h1>Hejsan,</h1>\n" +
                             "<p>this is <a href=\"http://twitter.com/uwe_\">@uwe_'s</a> " +
                             "personal URL shortener.<br/>\nThanks " +
                             "<a href=\"http://twitter.com/uwe_\">@janl</a> for inspiration!</p>\n" +
                             "<p>You can try it out yourself by taking this url:</p>\n" +
                             "<strong><code>http://djui.de/~?url=</code></strong>" +
                             "<code>http://your.page.to/be/shortened%3Fwith%3Dqueries</code>\n" +
                             "<p><em>Hint: You need to <a href=\"http://djui.de/~65sx\">" +
                             "percent-encode</a> your URL if it contains \"?\" queries.</em></p>\n");
                return;
            }
            
            if (!isUrl(uri.query.url)) {
                sys.debug("Href parameter is not a valid URL");
                res.sendPlain(400, "ERROR: Href parameter is not a valid URL");
                return;
            }
            
            try {
                io.doShorten(uri.query.url, res);
            } catch (e) {
                sys.error("ERROR: " + e.description);
                res.sendPlain(500, "ERROR: " + e.description);
            }
        }
        else { // if (path == "/~.{4}")
            var hash = path.substring(1);
            try {
                io.doExpand(hash, res);
            } catch (e) {
                sys.error("ERROR: " + e.description);
                res.sendPlain(500, "ERROR: " + e.description);
            }
        }
    });
io.initialize();
server.listen(PORT);
sys.debug("Server running at http://127.0.0.1:" + PORT + "/");
