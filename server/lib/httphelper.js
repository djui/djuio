exports.httphelper = {
  send: function(res, status, body, extra_headers) {
    res.sendHeader(status, (extra_headers || []).concat([
      ["Content-Length", body.length]]))
    res.write(body)
    res.end()
  },
  
  sendPlain: function(res, status, body, extra_headers) {
    this.send(res, status, body, (extra_headers || []).concat([
      ["Content-Type", "text/plain"]]))
  },
  
  sendHTML: function(res, status, body, extra_headers) {
    this.send(res, status, body, (extra_headers || []).concat([
      ["Content-Type", "text/html"]]))
  },
  
  sendJSON: function(res, status, obj, extra_headers) {
    this.send(res, status, JSON.stringify(obj), (extra_headers || []).concat([
      ["Content-Type", "text/json"]]))
  }
}
