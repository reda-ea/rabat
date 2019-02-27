// Generated by CoffeeScript 1.10.0
(function() {
  var $response, $session, $view, _, _resolveargs, bluebird, bodyParser, config, multer, textResponse, url,
    slice = [].slice;

  _ = require('lodash');

  bluebird = require('bluebird');

  bodyParser = require('body-parser');

  multer = require('multer');

  url = require('url');

  config = require('config');

  $response = require('./response');

  $view = require('./view');

  $session = require('./session');

  exports.path = {
    $extensions: {
      path: function(req) {
        return _.extend(req.rabat.path.slice(req.rabat.context.length), {
          full: req.rabat.path,
          context: req.rabat.context
        });
      },
      redirect: function() {
        return function(dest, path) {
          return function(req, res) {
            return res.rabat.redirect(dest, path);
          };
        };
      }
    }
  };

  exports.params = {
    $middlewares: {
      '01-json': bodyParser.json(),
      '02-urlencoded': bodyParser.urlencoded({
        extended: true
      }),
      '03-multipart': multer()
    },
    $extensions: {
      params: function(req) {
        req.rabat.params = url.parse(req.url, true).query || {};
        _.assign(req.rabat.params, req.params);
        _.assign(req.rabat.params, req.body);
        return _.assign(req.rabat.params, req.query);
      }
    }
  };

  exports.config = {
    $extensions: {
      config: function() {
        return config;
      }
    }
  };

  textResponse = function(body, values) {
    var content;
    if ((values != null) && _.isString(body)) {
      content = (_.template(body))(values);
    } else {
      content = _(body != null ? body : '').toString();
    }
    return _.extend(new $response(null, content), {
      auto: false
    });
  };

  _resolveargs = function(fn) {
    return function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return bluebird.all(args).spread(fn);
    };
  };

  exports.responses = {
    $extensions: {
      text: function() {
        return _resolveargs(textResponse);
      },
      html: function() {
        return _resolveargs(function(body, values) {
          return _.assign(textResponse(body, values), {
            type: 'html'
          });
        });
      },
      json: function() {
        return _resolveargs(function(data) {
          return _.extend(new $response(null, JSON.stringify(data) || 'null'), {
            auto: false,
            type: 'json'
          });
        });
      },
      notFound: function(req) {
        return _resolveargs(function(resource) {
          if (resource == null) {
            resource = req.rabat.context[req.rabat.context.length - 1];
          }
          if (resource._rabat_object !== 'response') {
            resource = new $response(null, resource);
          }
          return _.assign(resource, {
            status: 404
          });
        });
      },
      serverError: function() {
        return _resolveargs(function(error) {
          var fullerror;
          if (error == null) {
            error = new Error;
          }
          if (error._rabat_object !== 'response') {
            if (error.stack || error.message) {
              fullerror = error;
              error = new $response(null, error.stack || error.message);
              error.cause = fullerror;
            } else {
              error = new $response(null, error);
            }
          }
          return _.assign(error, {
            status: 500
          });
        });
      },
      next: function() {
        return {
          _rabat_object: 'response',
          custom: function(req, res, next) {
            return next();
          }
        };
      }
    }
  };

  exports.view = $view;

  exports.session = $session;

}).call(this);