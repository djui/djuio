var sys = require("sys")
var fs = require("fs")
var path = require("path")
var httphelper = require("./httphelper").httphelper
var date = require("../vendor/date")


var datastore = []
var dbhandle = null

// Thanks Jason Davies, Jan Lehnardt
function transform(length) {
  var tab = IOHASHCHARS
  var secret = "~"
  
  for (var i=0; i<length; i++) {
    secret += tab.charAt(Math.floor(Math.random() * tab.length))
  }
  
  return secret
}

exports.initialize = function() {
  // Read the old data
  path.exists(IODBPATH, function(exists) {
    if (!exists)
      return
    
    var data = fs.readFileSync(IODBPATH).substring(1)
    datastore = JSON.parse("[" + data + "]")
  })

  // Open the datastore file to be written (append)
  dbhandle = fs.openSync(IODBPATH, "a+", 0644)
}

exports.doShorten = function(href, res) {
  // Check if url is already stored
  for (var i=0; i<datastore.length; i++) {
    if (datastore[i]["href"] == href) {
      sys.puts("[io] Already stored " + JSON.stringify(datastore[i]))
      httphelper.sendPlain(res, 200, IOHOST + "/" + datastore[i]["hash"])
      return
    }
  }
  
  // Shorten the provided href
  var hash = transform(IOHASHLENGTH)
  
  // Check if hash is really shorter than href
  if ((IOHOST + "/" + hash).length > href.length) {
    sys.puts("[io] URL is shorter " + href)
    httphelper.sendPlain(res, 200, href)
    return
  }
  
  var doc = {
    "hash": hash,
    "href": href, 
    "date": date.rfc3339(),
    "counter": 1
  }
  
  // Store it in the datastore
  datastore.push(doc)
  // Also write to disk for fail-over
  fs.writeSync(dbhandle, "," + JSON.stringify(doc) + "\n", null)
  
  sys.puts("[io] Stored " + JSON.stringify(doc))
  httphelper.sendPlain(res, 200, IOHOST + "/" + doc["hash"])
}

exports.doExpand = function(hash, res) {
  var doc = null
  
  // We iterate in decreasing order, to get the highest
  // counter in the blob. -> "Append only" philosophy.
  for (var i=datastore.length-1; i>=0; i--) {
    if (datastore[i]["hash"] == hash) {
        doc = datastore[i]
        break
    }
  }
  
  if (doc === null) {
    sys.puts("[io] Lookup failed for /" + hash)
    httphelper.sendPlain(res, 404, "ERROR: Not Found\n")
    return
  }

  // Increase visiting counter
  doc["counter"]++
  // Store it in the datastore
  datastore.push(doc)
  // Also write to disk for fail-over
  fs.writeSync(dbhandle, JSON.stringify(doc) + ",\n", null)
  
  sys.puts("[io] Lookup succeeded for /" + hash + ": " + doc["href"])
  httphelper.sendHTML(res, 302, "If you don't get redirected, please go to <a href=\"" + 
    doc["href"] + "\">" + doc["href"] + "</a>\n", 
    [["Location", doc["href"]]])
}

exports.doStats = function() {
  var hashList = []
  
  for (var i=datastore.length-1; i>=0; i--) {
    // Only select unique entries to be display
    var found = false
    for (var h=0; h<hashList.length; h++) {
      if (hashList[h]["hash"] == datastore[i]["hash"]) {
        found = true
        break
      }
    }
    if (found)
      continue

    hashList.push(datastore[i])
  }
  
  return hashList
}
