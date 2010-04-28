var sys = require("sys")
var http = require("http")
var url = require("url")
var repl = require("repl")
var fs = require("fs")
var path = require("path")
var io = require("./server/server")

var host = "127.0.0.1"
var port = 8001


process.addListener("uncaughtException", function (err) {
  sys.puts("[node] Caught exception: "+err)
})

process.addListener("SIGINT", function () {
  sys.puts("[node] Shutting down...")
  fs.unlinkSync("node.pid")
  process.exit(0)
})

switch (process.argv[2]) {
  case "start":
    path.exists("node.pid", function(exists) {
      if (exists) {
        sys.puts("[node] Server already running.")
        process.exit(2)
      } else {
        fs.writeFileSync("node.pid", process.pid.toString())

        http.createServer(io.getServer()).listen(port, host)
        sys.puts("[node] Server started at http://"+host+":"+port+"/")

        if (process.argv[3] == "-i" || process.argv[3] == "--interactive")
          repl.start()
      }
    })
    break
  case "stop":
    path.exists("node.pid", function(exists) {
      if (!exists) {
        sys.puts("[node] Server not running.")
        process.exit(2)
      } else {
        var pid = fs.readFileSync("node.pid")
        process.kill(parseInt(pid))
        fs.unlinkSync("node.pid")
        sys.puts("[node] Server stopped.")
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
        
        http.createServer(io.getServer()).listen(port, host)
        sys.puts("[node] Server started at http://"+host+":"+port+"/")

        if (process.argv[3] == "-i" || process.argv[3] == "--interactive")
          repl.start()
      }, 1000)
    })
    break
  case "status":
    path.exists("node.pid", function(exists) {
      if (exists) {
        sys.puts("[node] Server is running.")
        process.exit(0)
      } else {
        sys.puts("[node] Server is not running.")
        process.exit(0)
      }
    })    
    break
  default:
    sys.puts("Usage: {start|stop|status|restart}")
    process.exit(1)
    break
}
