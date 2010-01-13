var sys = require("sys");

var io = require('../io');
var couch = require("../vendor/node-couch").CouchDB;


couch.debug = false;
var db = couch.db(IODBNAME);
db.create({
  success: function(response) {
    sys.debug("Database created: " + JSON.stringify(response));
  },
  error: function(result) {
    sys.error("CouchDB: " + JSON.stringify(result));
  }
});

exports.store = function(doc) {
  db.saveDoc(doc, {
    success: function(response) {
      sys.debug("Document saved: " + JSON.stringify(response));
    },
    error: function(result) {
      sys.error("CouchDB: " + JSON.stringify(result));
    }
  });
}

exports.lookup = function(docId, req, res) {
  db.openDoc(docId, {
    success: function(response) {
      sys.debug("Document opened: " + JSON.stringify(response));
      io.expanderResult(docId, response, req, res);
    },
    error: function(result) {
      sys.error("CouchDB: " + JSON.stringify(result));
      io.expanderResult(docId, null, req, res);
    }
  });
}
