var sys = require("sys")
var url = require("url")
var fs = require("fs")
var router = require("./vendor/router").getRouter()
var mustache = require("./vendor/mustache")
var io = require("./lib/io")

var indexTemplate
var statsTemplate

exports.start = function(port, host) {
  io.initialize()
  indexTemplate = fs.readFileSync(__dirname+"/templates/index.html")
  statsTemplate = fs.readFileSync(__dirname+"/templates/stats.html")
  return router.listen(port, host)    
}

exports.end = function() {
  return router.end()
}

router.get("/~", index)
router.get("/~stats", stats)
router.get("/(~.{4})", expand)
router.get("/~(.{5,})", shorten)

function index(req, res) {
  res.simpleHtml(200, mustache.to_html(indexTemplate))
}

function stats(req, res) {
  try {
    var stats = io.doStats()
    res.simpleHtml(200, mustache.to_html(statsTemplate, {items: stats}))
  } catch (e) {
    sys.puts("[io] ERROR: doStats - " + e.description)
    res.simpleHtml(500, "ERROR: " + e.description)
  }
}

function expand(req, res, hash) {
  try {
    io.doExpand(res, hash)
  } catch (e) {
    sys.puts("[io] ERROR: doExpand - " + e.description)
    res.simpleText(500, "ERROR: " + e.description)
  }
}

function shorten(req, res, href) {
  sys.puts(sys.inspect(href))
  try {
    url.parse(href)
  } catch (e) {
    sys.puts("[io] Href parameter is not a valid URL")
    res.simpleText(400, "ERROR: Href parameter is not a valid URL")
    return
  }
  try {
    io.doShorten(res, href)
  } catch (e) {
    sys.puts("[io] ERROR: doShorten - " + e.description)
    res.simpleText(500, "ERROR: " + e.description)
  }
}
