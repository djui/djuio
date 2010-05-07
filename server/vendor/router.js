/*

*/

/*
Copyright (c) 2010 Tim Caswell <tim@creationix.com>

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

var sys = require('sys');
var fs = require('fs');
var path = require('path');
var http = require('http');
var url_parse = require("url").parse;

// Used as a simple, convient 404 handler.
function notFound(req, res, message) {
  message = (message || "Not Found\n") + "";
  res.writeHead(404, {
    "Content-Type": "text/plain",
    "Content-Length": message.length
  });
  res.write(message);
  res.end();
}

// Modifies req and res to call logger with a log line on each res.end
// Think of it as "middleware"
function logify(req, res, logger) {
  var end = res.end;
  res.end = function () {
    // Common Log Format (mostly)
    logger((req.socket && req.socket.remoteAddress) + " - - [" + (new Date()).toUTCString() + "]" 
     + " \"" + req.method + " " + req.url
     + " HTTP/" + req.httpVersionMajor + "." + req.httpVersionMinor + "\" "
     + res.statusCode + " - \""
     + (req.headers['referer'] || "") + "\" \"" + req.headers["user-agent"].split(' ')[0] + "\"");
    return end.apply(this, arguments);
  }
  var writeHead = res.writeHead;
  res.writeHead = function (code) {
    res.statusCode = code;
    return writeHead.apply(this, arguments);
  }
}

exports.getRouter = function (logger) {

  logger = logger || sys.puts;
  
  var routes = [];
  
  // Adds a route the the current server
  function addRoute(method, pattern, handler, format) {
    if (typeof pattern === 'string') {
      pattern = new RegExp("^" + pattern + "$");
    }
    var route = {
      method: method,
      pattern: pattern,
      handler: handler
    };
    if (format !== undefined) {
      route.format = format;
    }
    routes.push(route);
  }

  // The four verbs are wrappers around addRoute
  function get(pattern, handler) {
    return addRoute("GET", pattern, handler);
  }
  function post(pattern, handler, format) {
    return addRoute("POST", pattern, handler, format);
  }
  function put(pattern, handler, format) {
    return addRoute("PUT", pattern, handler, format);
  }
  function del(pattern, handler) {
    return addRoute("DELETE", pattern, handler);
  }

  // This is a meta pattern that expands to a common RESTful mapping
  function resource(name, controller, format) {
    get(new RegExp('^/' + name + '$'), controller.index);
    get(new RegExp('^/' + name + '/([^/]+)$'), controller.show);
    post(new RegExp('^/' + name + '$'), controller.create, format);
    put(new RegExp('^/' + name + '/([^/]+)$'), controller.update, format);
    del(new RegExp('^/' + name + '/([^/]+)$'), controller.destroy);
  };
  
  function resourceController(name, data, on_change) {
    data = data || [];
    on_change = on_change || function () {};
    return {
      index: function (req, res) {
        res.simpleJson(200, {content: data, self: '/' + name});
      },
      show: function (req, res, id) {
        var item = data[id];
        if (item) {
          res.simpleJson(200, {content: item, self: '/' + name + '/' + id});
        } else {
          res.notFound();
        }
      },
      create: function (req, res, json) {
        var item, id, url;
        item = json.content || json;
        if (!item) {
          res.notFound();
        } else {
          data.push(item);
          id = data.length - 1;
          on_change(id);
          url = "/" + name + "/" + id;
          res.simpleJson(201, {content: item, self: url}, [["Location", url]]);
        }
      },
      update: function (req, res, id, json) {
        var item = json.content || json;
        if (!item) {
          res.notFound();
        } else {
          data[id] = item;
          on_change(id);
          res.simpleJson(200, {content: item, self: "/" + name + "/" + id});
        }
      },
      destroy: function (req, res, id) {
        delete(data[id]);
        on_change(id);
        res.simpleJson(200, "200 Destroyed");
      }
    };
  };
  
  // Create the http server object
  var server = http.createServer(function (req, res) {

    // Enable logging on all requests using common-logger style
    logify(req, res, logger);

    var uri, path;

    // Performs an HTTP 302 redirect
    res.redirect = function redirect(location) {
      res.writeHead(302, {"Location": location});
      res.end();
    }

    // Performs an internal redirect
    res.innerRedirect = function innerRedirect(location) {
      logger("Internal Redirect: " + req.url + " -> " + location);
      req.url = location;
      doRoute();
    }

    function simpleResponse(code, body, content_type, extra_headers) {
      res.writeHead(code, (extra_headers || []).concat(
                           [ ["Content-Type", content_type],
                             ["Content-Length", body.length]
                           ]));
      res.write(body);
      res.end();
    }

    res.simpleText = function (code, body, extra_headers) {
      simpleResponse(code, body, "text/plain", extra_headers);
    };

    res.simpleHtml = function (code, body, extra_headers) {
      simpleResponse(code, body, "text/html", extra_headers);
    };

    res.simpleJson = function (code, json, extra_headers) {
      simpleResponse(code, JSON.stringify(json), "application/json", extra_headers);
    };

    res.notFound = function (message) {
      notFound(req, res, message);
    };

    function doRoute() {
      uri = url_parse(req.url);
      sys.puts(sys.inspect(uri))
      path = uri.href;
      
      for (var i = 0, l = routes.length; i < l; i += 1) {
        var route = routes[i];
        if (req.method === route.method) {
          var match = path.match(route.pattern);
          if (match && match[0].length > 0) {
            match.shift();
            match = match.map(function (part) {
              return part ? unescape(part) : part;
            });
            match.unshift(res);
            match.unshift(req);
            if (route.format !== undefined) {
              var body = "";
              req.setBodyEncoding('utf8');
              req.addListener('data', function (chunk) {
                body += chunk;
              });
              req.addListener('end', function () {
                if (route.format === 'json') {
                  body = JSON.parse(unescape(body));
                }
                match.push(body);
                route.handler.apply(null, match);
              });
              return;
            }
            var result = route.handler.apply(null, match);
            switch (typeof result) {
              case "string":
                res.simpleHtml(200, result);
                break;
              case "object":
                res.simpleJson(200, result);
                break;
            }
            
            return;
          }
        }
      }

      notFound(req, res);
    }
    doRoute();

  });

  function listen(port, host) {
    port = port || 8080;
    host = host || "127.0.0.1";
    server.listen(port, host);
  }
  
  function end() {
    return server.end();
  }
  
  // Return a handle to the public facing functions from this closure as the
  // server object.
  return {
    get: get,
    post: post,
    put: put,
    del: del,
    resource: resource,
    resourceController: resourceController,
    listen: listen,
    end: end,
  };
}
