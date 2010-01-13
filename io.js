var sys = require("sys");
var url = require("url");

var db = require("./lib/db");
var date = require("./lib/date");


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
    var uri = url.parse(req.url, true);   
    if (typeof(uri.query) === 'undefined' || 
        typeof(uri.query.url) === 'undefined' ||
        uri.query.url == "") {
      sys.error("URL parameter undefined");
      res.sendPlain(200, "ERROR: URL parameter undefined");
      return;
    }

    var shortUrl = transform(IOHASHLENGTH);
    var doc = {
      _id: shortUrl,
      target: uri.query.url, 
      date:  date.rfc3339(),
      counter: 0
    };        
    db.store(doc);
    sys.debug("Store: " + JSON.stringify(doc));

    res.sendPlain(200, IOHOST + "/" + shortUrl);
  },

  expander: function(req, res) {
    var uri = url.parse(req.url, true);
    var hash = uri.pathname.substring(1);
    var doc = db.lookup(hash, req, res);
  },
  
  expanderResult: function(hash, doc, req, res) {
    if (doc === null) {
      sys.debug("Lookup failed: " + IOHOST + "/" + hash + " => ???");
      res.sendPlain(404, "Not Found\n");
      return;
    }

    sys.debug("Lookup: " + IOHOST + "/" + hash + " => " + doc.target);
    res.sendHTML(302, "If you don't get redirected, please go to " + 
      doc.target + "\n", ["Location", doc.target]);
    
    doc.counter = doc.counter + 1;
    db.store(doc);
  }
}

// CommonJS module support
process.mixin(exports, io);
