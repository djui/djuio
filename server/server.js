var sys = require("sys")
var url = require("url")
var io = require("./lib/io")
var fs = require("fs")
var mustache = require("./vendor/mustache")
var httphelper = require("./lib/httphelper").httphelper

IODBPATH = "db/io.db"
IOHASHLENGTH = 4
IOHASHCHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

io.initialize()
var indexTemplate = fs.readFileSync(__dirname+"/templates/index.html")
var statsTemplate = fs.readFileSync(__dirname+"/templates/stats.html")

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
    host = req.headers["x-forwarded-server"] || req.headers.host
    host = "http://"+host+"/"
    
    sys.puts("[io] "+req.method+" "+req.url)
    
    if (path == "/~") {
      if (typeof(uri.query) === 'undefined' ||
          typeof(uri.query.url) === 'undefined' ||
          uri.query.url == "") {
        httphelper.sendHTML(res, 200, mustache.to_html(indexTemplate, {host: host}))
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
    } else if (hash = path.match(
        new RegExp("^/(~["+IOHASHCHARS+"]{"+IOHASHLENGTH+"})$"))) {
      try {
        io.doExpand(hash[1], res)
      } catch (e) {
        sys.puts("[io] ERROR: " + e.description)
        httphelper.sendPlain(res, 500, "ERROR: " + e.description)
      }
    } else if (path == "/~stats") {
      try {
        var stats = io.doStats()
        httphelper.sendHTML(res, 200, mustache.to_html(statsTemplate, {host: host, items: stats}))
      } catch (e) {
        sys.puts("[io] ERROR: " + e.description)
        httphelper.sendPlain(res, 500, "ERROR: " + e.description)
      }
    } else {
      httphelper.sendPlain(res, 404, "ERROR: Not Found\n")
    }
  }
}
