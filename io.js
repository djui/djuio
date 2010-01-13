var sys = require("sys");
var url = require("url");
var posix = require("posix");
var path = require("path");

var date = require("./lib/date");

var datastore = [];
var dbhandle = null;


// Thanks Jason Davies, Jan Lehnardt
function transform(length) {
    var tab = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var secret = "~";
    
    for (var i=0; i<length; i++) {
        secret += tab.charAt(Math.floor(Math.random() * tab.length));
    }
    
    return secret;
}

exports.initialize = function() {
    // Read the old data
    path.exists(IODBPATH, function(exists) {
            if (!exists)
                return;
            
            var data = posix.cat(IODBPATH).wait();
            datastore = JSON.parse("[" + data + "]");
        });
    
    // Open the datastore file to be written (append)
    dbhandle = posix.open(IODBPATH, process.O_WRONLY | process.O_CREAT | process.O_APPEND, 0644).wait();
};

exports.doShorten = function(href, res) {
    // Check if url is already stored
    for (var i=0; i<datastore.length;i++) {
        if (datastore[i]["href"] == href) {
            sys.debug("Already stored " + JSON.stringify(datastore[i]));
            res.sendPlain(200, IOHOST + "/" + datastore[i]["hash"]);
            return;
        }
    }

    // Shorten the provided href
    var hash = transform(IOHASHLENGTH);

    // Check if hash is really shorter than href
    if ((IOHOST + "/" + hash).length > href.length) {
        sys.debug("URL is shorter " + href);
        res.sendPlain(200, href);
        return;
    }

    var doc = {
        "hash": hash,
        "href": href, 
        "date":  date.rfc3339(),
        "counter": 0
    };
    
    // Store it in the datastore
    datastore.push(doc);
    // Also write to disk for fail-over
    posix.write(dbhandle, JSON.stringify(doc) + ",\n", null);
    
    sys.debug("Stored " + JSON.stringify(doc));
    res.sendPlain(200, IOHOST + "/" + doc["hash"]);
};

exports.doExpand = function(hash, res) {
    var doc = null;
    
    for (var i=0; i<datastore.length;i++) {
        if (datastore[i]["hash"] == hash) {
            doc = datastore[i];
            break;
        }
    }
    
    if (doc === null) {
        sys.debug("Lookup failed for /" + hash);
        res.sendPlain(404, "ERROR: Not Found\n");
        return;
    }
    
    sys.debug("Lookup succeeded for /" + hash + ": " + doc["href"]);
    res.sendHTML(302, "If you don't get redirected, please go to " + 
                 doc["href"] + ",\n", ["Location", doc["href"]]);
};
