var sys = require("sys")
var url = require("url")
var io = require("./lib/io")
var mu = require("./vendor/mu/mu")
var httphelper = require("./lib/httphelper").httphelper

IOHOST = "http://djui.de"
IODBPATH = "db/io.db"
IOHASHLENGTH = 4
IOHASHCHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

mu.templateRoot = __dirname+"/templates"
mu.templateExtension = ""
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

exports.getServer = function() {  
  return function(req, res) {
    uri = url.parse(req.url, true)
    path = uri.pathname
    
    sys.puts("[io] "+req.method+" "+req.url)
    
    if (path == "/~") {
      if (typeof(uri.query) === 'undefined' ||
          typeof(uri.query.url) === 'undefined' ||
          uri.query.url == "") {
        mu.render("index.html", {host: IOHOST}, {}, function(err, buffer) {
           httphelper.sendHTML(res, 200, buffer)})
      
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
