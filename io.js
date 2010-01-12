var sys = require("sys");
var url = require("url");

var db = require("./lib/db");
var date = require("./lib/date");
var eyes = require("./vendor/eyes");


// Thanks Jason Davies, Jan Lehnardt
function transform(length) {
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var secret = "";
  
  for (var i=0; i<length; i++) {
    secret += tab.charAt(Math.floor(Math.random() * tab.length));
  }
  
  return secret;
}

var io = {
  welcomer: function(res) {
    res.sendHTML(200, 
      "Hejsan, this is <a href=\"http://twitter.com/uwe_\">@uwe_'s</a> personal URL shortener.<br/>\n" + 
      "Thanks to <a href=\"http://twitter.com/uwe_\">@janl</a> for inspiration!");
  },

  shorter: function(req, res) {   
    uri = url.parse(req.url, true);   
    if (typeof(uri.query) === 'undefined' || 
        typeof(uri.query.url) === 'undefined' ||
        uri.query.url == "") {
      sys.error("URL parameter undefined");
      res.sendPlain(200, "ERROR: URL parameter undefined");
      return;
    }

    var shortUrl = IOHOST + "/" + transform(IOLENGTH);
    var item = {
      "id": shortUrl,
      "target": uri.query.url, 
      "date":  date.rfc3339(),
      "counter": 0};        
    db.store(item);
    // sys.debug("Store: " + JSON.stringify(item));
    sys.debug("Store: ");
    eyes.inspect(item)

    res.sendPlain(200, shortUrl);
  },

  expander: function(res) {
    var target = db.lookup(IOHOST + uri.pathname);
    sys.debug("Lookup: " + IOHOST + uri.pathname + " => " + target);
    if (target !== null) {
      res.sendHTML(302, "If you don't get redirected, please go to " + 
        target + "\n", ["Location", target]);
    } else
      res.sendPlain(404, "Not Found\n");
  }
}

// CommonJS module support
process.mixin(exports, io);
