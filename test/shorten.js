var assert = require("assert")
var http = require("http")

var client = http.createClient(8001, "127.0.0.1")

// Shorten a old URL
var request = client.request("GET", "/~http://www.google.de/")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 200, "Can't access shorten page (1)")
  response.setEncoding("utf8")
  response.on("data", function (body) {
    assert.ok(body.match(/http:\/\/djui\.de\/~81ta/), "Wrong formatted shortened hash (2)")
  })
})

// Shorten a new URL
request = client.request("GET", "/~http://www.amazon.de/")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 200, "Can't access shorten page (3)")
  response.setEncoding("utf8")
  response.on("data", function (body) {
    assert.ok(body.match(/http:\/\/djui\.de\/~[0-9a-zA-Z]{4}/), "Wrong formatted shortened hash  (4)")
  })
})

// Shorten a new URL with query ("?")
request = client.request("GET", "/~http://www.google.de/?hello=world")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 200, "Can't access shorten page (5)")
  response.setEncoding("utf8")
  response.on("data", function (body) {
    assert.ok(body.match(/http:\/\/djui\.de\/~[0-9a-zA-Z]{4}/), "Wrong formatted shortened hash (6)")
  })
})

// Shorten a new URL with hash ("#")
request = client.request("GET", "/~http://www.google.de/#test123")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 200, "Can't access shorten page (7)")
  response.setEncoding("utf8")
  response.on("data", function (body) {
    assert.ok(body.match(/http:\/\/djui\.de\/~[0-9a-zA-Z]{4}/), "Wrong formatted shortened hash (8)")
  })
})

// Shorten an invalid URL
request = client.request("GET", "/~XXXXXXXXXXXXXXXXXXXX")
request.end()
request.on("response", function (response) {
  assert.strictEqual(response.statusCode, 400, "Wrong status for invalid URL (9)")
})
