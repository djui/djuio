var sys = require("sys")
var http = require("http")
var url = require("url")
var repl = require('repl')
var io = require("./server/server")
var host = '127.0.0.1'
var port = 8001

process.addListener('uncaughtException', function (err) {
  sys.puts('[node] Caught exception: '+err)
})

process.addListener('SIGINT', function () {
  sys.puts('[node] Shutting down...')
  process.exit(0)
})

http.createServer(io.server()).listen(port, host)
sys.puts('[node] Server listening on http://'+host+':'+port+'/')

if (process.argv[2] == "-i" || process.argv[2] == "--interactive")
  repl.start()
