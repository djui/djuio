var sys = require("sys")
var fs = require("fs")
var path = require("path")
var nStore = require("../vendor/nstore/lib/nstore")

var OLDDBPATH = process.argv[3] || "db/io.db"
var NEWDBPATH = OLDDBPATH + ".new"
var queue = 0

prepare()

function prepare() {
  path.exists(OLDDBPATH, function(exists) {
    if (!exists) {
      console.log("Cannot find old database file! (" + IODBPATH + ")")
      process.exit(1)
    }

    var olddata
    var content = fs.readFileSync(OLDDBPATH, "utf8").substring(1)
    try {
      olddata = JSON.parse("[" + content + "]")
    } catch (err) {
      console.log("Cannot parse old database file! Not a database file?")
      process.exit(1)
    }
    console.log("Old data loaded.")  

    try {
      fs.unlinkSync(NEWDBPATH)
    } catch (err) {
      if (err.errno !== process.ENOENT)
        throw err
    }
    var datastore = nStore(NEWDBPATH)
    console.log("New datastore created.")

    migrate(datastore, olddata)
  })
}

function migrate(datastore, olddata) {
  var founds = []
  for (var i = olddata.length-1; i >= 0; i--) {
    if (founds.indexOf(olddata[i]["hash"]) < 0) {
      founds.push(olddata[i]["hash"])
      queue++
      datastore.save(olddata[i]["hash"], olddata[i], function (err) {
        if (err) throw err
        queue--
      })
    }
  }
  checkQueue()
}

function checkQueue() {
  if (queue > 0)
    process.nextTick(checkQueue)
  else {
    console.log("New datastore filled.")
    setTimeout(replace, 1000)
  }
}

function replace() {
  fs.renameSync(OLDDBPATH, OLDDBPATH + ".bak")
  fs.renameSync(NEWDBPATH, OLDDBPATH)  
  console.log("Old datastore with new datastore replaced.")
}
