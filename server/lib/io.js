var sys = require("sys")
var fs = require("fs")
var path = require("path")
var date = require("./rfc3339date")
var nStore = require("../vendor/nstore/lib/nstore")

IOHOST = "http://djui.de/"
IOHASHLENGTH = 4
IOHASHCHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
IODBPATH = process.argv[3] || "db/io.db"

var datastore = null

// Thanks Jason Davies, Jan Lehnardt
function transform(length) {
  var tab = IOHASHCHARS
  var secret = "~"
  
  for (var i=0; i<length; i++) {
    secret += tab.charAt(Math.floor(Math.random() * tab.length))
  }
  
  return secret
}

function doStore(res, href) {
  // Shorten the provided href
  var hash = transform(IOHASHLENGTH)
  
  // Check if hash is really shorter than href
  if ((IOHOST + hash).length > href.length) {
    console.log("[io] URL is shorter " + href)
    res.simpleText(200, href)
    return
  }
  
  var doc = {
    "hash": hash,
    "href": href, 
    "date": date.rfc3339(),
    "counter": 1
  }
  
  // Store it in the datastore
  datastore.save(hash, doc, function (err) {
    if (err) throw err
    console.log("[io] Stored " + JSON.stringify(doc))
    res.simpleText(200, IOHOST + hash)
  })  
}

exports.initialize = function() {
  // Read the old data
  datastore = nStore(IODBPATH)
}

exports.doShorten = function(res, href) {
  // Check if url is already stored
  datastore.all(function (doc, meta) {
      return doc.href == href
    }, function (err, docs, metas) {
      if (err) throw err
      if (docs.length > 0) {
        console.log("[io] Already stored " + JSON.stringify(docs[0]))
        res.simpleText(200, IOHOST + docs[0].hash)
        return
      } else
        doStore(res, href)
  })
}

exports.doExpand = function(res, hash) {
  datastore.get(hash, function (err, doc, meta) {
    if (err) {
      if (err.errno == 2) {
        console.log("[io] Lookup failed for /" + hash)
        res.notFound()
        return
      } else throw err
    }
    // Increase visiting counter
    doc.counter++
    // Store it in the datastore
    datastore.save(hash, doc, function (err) {
        if (err) throw err
        console.log("[io] Lookup succeeded for /" + hash + ": " + doc.href)
        res.redirect(doc.href)
    })
  })  
}

exports.getStats = function(delegate) {
  // Search for several things at once
  datastore.all(function (doc, meta) {
      return true
    }, function (err, docs, metas) {
      if (err) throw err
      delegate(docs)
  })  
}
