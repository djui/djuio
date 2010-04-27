var sys = require("sys")
var url = require("url")
var io = require("./lib/io")
var httphelper = require("./lib/httphelper").httphelper

IOHOST = "http://djui.de"
IODBPATH = "db/io.db"
IOHASHLENGTH = 4
IOHASHCHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

io.initialize()

function isUrl(s) {
  try {
    url.parse(s)
    return true
  }
  catch (e) {
    return false
  }
}

exports.server = function() {  
  return function(req, res) {
    uri = url.parse(req.url, true)
    path = uri.pathname
    
    sys.puts("[io] "+req.method+" "+req.url)
    
    
    if (path == "/~") {
      if (typeof(uri.query) === 'undefined' ||
          typeof(uri.query.url) === 'undefined' ||
          uri.query.url == "") {
          // @todo Make this a template
          httphelper.sendHTML(res, 200, 
            "<h1>Hejsan,</h1>\n" +
            "<p>this is <a href=\"http://twitter.com/uwe_\">@uwe_'s</a> " +
            "personal URL shortener.<br/>\nThanks " +
            "<a href=\"http://twitter.com/uwe_\">@janl</a> for inspiration!</p>\n" +
            "<p>You can try it out yourself by taking this url:</p>\n" +
            "<strong><code>http://djui.de/~?url=</code></strong>" +
            "<code>http://your.page.to/be/shortened?with=queries#and_hash</code>\n")
      } else if (!isUrl(uri.query.url)) {
        sys.puts("[io] Href parameter is not a valid URL")
        httphelper.sendPlain(res, 400, "ERROR: Href parameter is not a valid URL")
      } else {
        try {
          io.doShorten(uri.query.url, res)
        } catch (e) {
          sys.puts("[io] ERROR: " + e.description)
          httphelper.sendPlain(res, 500, "ERROR: " + e.description)
        }
      }
    } else if (hash = path.match(new RegExp("^/(~["+IOHASHCHARS+"]{4})$"))) {
      try {
        io.doExpand(hash[1], res)
      } catch (e) {
        sys.puts("[io] ERROR: " + e.description)
        httphelper.sendPlain(res, 500, "ERROR: " + e.description)
      }
    } else if (path == "/~stats") {
      try {
        io.doStats(res)
      } catch (e) {
        sys.puts("[io] ERROR: " + e.description)
        httphelper.sendPlain(res, 500, "ERROR: " + e.description)
      }
    } else {
      httphelper.sendPlain(res, 404, "ERROR: Not Found\n")
    }
  }
}
