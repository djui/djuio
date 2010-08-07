var repl = require("repl")
var fs = require("fs")
var path = require("path")
var server = require("./server/server")

var host = "127.0.0.1"
var port = 8001


process.addListener("uncaughtException", function (err) {
  console.log("[node] Caught exception: "+err)
})

process.addListener("SIGINT", function () {
  console.log("[node] Shutting down...")
  fs.unlinkSync("node.pid")
  process.exit(0)
})

switch (process.argv[2]) {
  case "start":
    path.exists("node.pid", function(exists) {
      if (exists) {
        console.log("[node] Server already running.")
        process.exit(2)
      } else {
        fs.writeFileSync("node.pid", process.pid.toString())

        server.start(port, host)
        console.log("[node] Server started at http://"+host+":"+port+"/")

        if (process.argv[3] == "-i" || process.argv[3] == "--interactive")
          repl.start()
      }
    })
    break
  case "stop":
    path.exists("node.pid", function(exists) {
      if (!exists) {
        console.log("[node] Server not running.")
        process.exit(2)
      } else {
        var pid = fs.readFileSync("node.pid")
        process.kill(parseInt(pid))
        fs.unlinkSync("node.pid")
        console.log("[node] Server stopped.")
        process.exit(0)
      }
    })
    break
  case "restart":
    path.exists("node.pid", function(exists) {
      if (exists) {
        var pid = fs.readFileSync("node.pid")
        process.kill(parseInt(pid))
        fs.unlinkSync("node.pid")
      }
      setTimeout(function() {
        fs.writeFileSync("node.pid", process.pid.toString())
        
        server.start(port, host)
        console.log("[node] Server started at http://"+host+":"+port+"/")

        if (process.argv[3] == "-i" || process.argv[3] == "--interactive")
          repl.start()
      }, 1000)
    })
    break
  case "status":
    path.exists("node.pid", function(exists) {
      if (exists) {
        console.log("[node] Server is running.")
        process.exit(0)
      } else {
        console.log("[node] Server is not running.")
        process.exit(0)
      }
    })    
    break
  default:
    console.log("Usage: {start|stop|status|restart}")
    process.exit(1)
    break
}
