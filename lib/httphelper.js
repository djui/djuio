var httphelper = {
  sendPlain: function(status, body, extra_headers) {
    this.sendHeader(status, (extra_headers || []).concat({
      "Content-Type": "text/plain",
      "Content-Length": body.length}));
    this.sendBody(body);
    this.finish();
  },

  sendHTML: function(status, body, extra_headers) {
    this.sendHeader(status, (extra_headers || []).concat({
      "Content-Type": "text/html",
      "Content-Length": body.length}));
    this.sendBody(body);
    this.finish();
  },

  sendJSON: function(status, obj, extra_headers) {
    var body = JSON.stringify(obj);
    this.sendHeader(status, (extra_headers || []).concat({
      "Content-Type": "text/json",
      "Content-Length": body.length}));
    this.sendBody(body);
    this.finish();
  }
}

// CommonJS module support
process.mixin(exports, httphelper);