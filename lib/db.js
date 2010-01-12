var datastore = [];

exports.store = function(obj) {
  datastore.push(obj);
}

exports.lookup = function (str) {
  for (var i=0; i<datastore.length; i++) {
    if (datastore[i].id == str) {
      return datastore[i].target;
    }
  }

  return null;
}

exports.dump = function() {
  return JSON.stringify(datastore);
}
