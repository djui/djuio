var assert = require("assert")
var http = require("http")

var client = http.createClient(8001, "127.0.0.1")

// Test index page
var request = client.request("GET", "/~")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 200, "Can't access index page (1)")
})

// Test stats page
var request = client.request("GET", "/~stats")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 200, "Can't access stats page (2)")
})

// Test not found page
request = client.request("GET", "/~XXX")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 404, "Wrong status for not found page (3)")
})
