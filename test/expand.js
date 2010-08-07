var assert = require("assert")
var http = require("http")

var client = http.createClient(8001, "127.0.0.1")

// Expand a correct hash
var request = client.request("GET", "/~81ta")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 302, "Can't access expand page (1)")
  response.setEncoding("utf8")
  response.on("data", function (body) {
    assert.ok(body.match(/http:\/\/www\.google\.de\//), "Wrong expanding (2)")
  })
})

// Try to expand a not stored hash
request = client.request("GET", "/~XXXX")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 404, "Wrong status for not stored hash (3)")
})
