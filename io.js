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
    for (var i=0; i<datastore.length; i++) {
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
        "date": date.rfc3339(),
        "counter": 1
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
    
    // We iterate in decreasing order, to get the highest
    // counter in the blob. -> "Append only" philosophy.
    for (var i=datastore.length-1; i>=0; i--) {
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

    // Increase visiting counter
    doc["counter"]++;
    // Store it in the datastore
    datastore.push(doc);
    // Also write to disk for fail-over
    posix.write(dbhandle, JSON.stringify(doc) + ",\n", null);
    
    sys.debug("Lookup succeeded for /" + hash + ": " + doc["href"]);
    res.sendHTML(302, "If you don't get redirected, please go to <a href=\"" + 
                 doc["href"] + "\">" + doc["href"] + "</a>\n", 
                 [["Location", doc["href"]]]);
};

exports.doStats = function(res) {
    res.sendHeader(200, [["Content-Type", "text/html"]]);
    res.sendBody("<html>\n" + 
                 "<head>\n" + 
                 "<title>Djui's URL Shortener :: Statistics</title>\n" +
                 "</head>\n" + 
                 "\n" + 
                 "<body>\n" +
                 "<table>\n" + 
                 "<tr>\n" + 
                 "<th>Date</th>" +
                 "<th>Counter</th>" +
                 "<th>Hash</th>" +
                 "<th>Href</th>" +
                 "</tr><tr>\n");
    
    var hashList = [];
    for (var i=datastore.length-1; i>=0; i--) {
        if (datastore[i]["hash"] in hashList)
            continue;
        
        hashList.push(datastore[i]["hash"]);
        
        // Don't use the "sendHTML()" function 
        // as the list might become long.
        res.sendBody("<td>" + datastore[i]["date"] + "</td>\n" + 
                     "<td>" + datastore[i]["counter"] + "</td>\n" + 
                     "<td>" + datastore[i]["hash"] + "</td>\n" + 
                     "<td>" + datastore[i]["href"] + "</td>\n" + 
                     "</tr><tr>\n");
    }
    
    res.sendBody("</tr>\n" + 
                 "</body>\n" +
                 "</html>\n");
    res.finish();
};
