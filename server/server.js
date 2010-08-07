var sys = require("sys") // ONLY FOR DEBUG PURPOSES
var url = require("url")
var fs = require("fs")
var router = require("./lib/node-router").getServer()
var mustache = require("./lib/mustache")
var io = require("./lib/io")

var indexTemplate
var statsTemplate

// Thanks Boaz Yahav @ http://www.weberdev.com/get_example-4228.html
function isUrl(s) {
  //             PROTO       : / /HOST             .COUNTRY       /PATH            
  var regexp = /^[A-Za-z]{2,}:\/\/[A-Za-z0-9_]{2,}\.[A-Za-z]{2,}\/?.*$/;
  return regexp.test(s);
}

exports.start = function(port, host) {
  io.initialize()
  indexTemplate = fs.readFileSync(__dirname+"/templates/index.html", "utf8")
  statsTemplate = fs.readFileSync(__dirname+"/templates/stats.html", "utf8")
  return router.listen(port, host)    
}

exports.end = function() {
  return router.end()
}

router.get("/~", index)
router.get("/~stats", stats)
router.get("/(~.{4})", expand)
router.get("/~.{5,}", shorten)

function index(req, res) {
  res.simpleHtml(200, mustache.to_html(indexTemplate))
}

function stats(req, res) {
  try {
    io.getStats(function(stats) {
      res.simpleHtml(200, mustache.to_html(statsTemplate, {items: stats}))      
    })
  } catch (e) {
    console.log("[io] ERROR: doStats - " + e.description)
    res.simpleText(500, "ERROR: " + e.description)
  }
}

function expand(req, res, hash) {
  try {
    io.doExpand(res, hash)
  } catch (e) {
    console.log("[io] ERROR: doExpand - " + e.description)
    res.simpleText(500, "ERROR: " + e.description)
  }
}

function shorten(req, res) {
  var href = req.url.substring(2)
  if (!isUrl(href)) {
    console.log("[io] Href parameter is not a valid URL")
    res.simpleText(400, "ERROR: Href parameter is not a valid URL")
  } else {
    try {
      io.doShorten(res, href)
    } catch (e) {
      console.log("[io] ERROR: doShorten - " + e.description)
      res.simpleText(500, "ERROR: " + e.description)
    }
  }
}
