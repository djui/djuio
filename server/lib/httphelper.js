exports.httphelper = {
  sendPlain: function(res, status, body, extra_headers) {
    res.sendHeader(status, (extra_headers || []).concat([
      ["Content-Type", "text/plain"],
      ["Content-Length", body.length]]));
    res.write(body);
    res.end();
  },
  
  sendHTML: function(res, status, body, extra_headers) {
    res.sendHeader(status, (extra_headers || []).concat([
      ["Content-Type", "text/html"],
      ["Content-Length", body.length]]));
    res.write(body);
    res.end();
  },
  
  sendJSON: function(res, status, obj, extra_headers) {
    var body = JSON.stringify(obj);
    res.sendHeader(status, (extra_headers || []).concat([
      ["Content-Type", "text/json"],
      ["Content-Length", body.length]]));
    res.write(body);
    res.end();
  }
}
