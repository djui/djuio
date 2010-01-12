var db = [];

/* Borrowed from Jason Davies */
exports.transform = function (length) {
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var secret = "";
  
  for (var i=0; i<length; i++) {
    secret += tab.charAt(Math.floor(Math.random() * tab.length));
  }
  
  return secret;
}

exports.store = function(obj) {
  db.push(obj);
}

exports.lookup = function (str) {
  for (var i=0; i<db.length; i++) {
    if (db[i].id == str) {
      return db[i].target;
    }
  }

  return null;
}

exports.dump = function() {
  return JSON.stringify(db);
}
