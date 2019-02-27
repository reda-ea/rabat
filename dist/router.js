// Generated by CoffeeScript 1.10.0
(function() {
  var Router, _, _fname, _redirect, _rname, debug, finalhandler, url;

  _ = require('lodash');

  finalhandler = require('finalhandler');

  url = require('url');

  debug = (require('debug'))('rabat:router');

  _fname = function(fn) {
    return fn._name || fn.name;
  };

  _rname = function(r) {
    if (r._rabat_object === 'router') {
      return ':' + (_.keysIn(r.map)).join();
    } else {
      return (_.keysIn(r)).join();
    }
  };

  _redirect = function(res, dest, path) {
    if (dest == null) {
      dest = '/';
    }
    if (dest._rabat_prefix) {
      dest = dest._rabat_prefix;
    }
    if (dest._rabat_object === 'router') {
      dest = '/' + dest.prefix;
      if (path != null) {
        dest += '/' + path;
      }
    }
    if (res.rabat && dest[0] !== '/') {
      if (!/(?:^[a-z][a-z0-9+.-]*:|\/\/)/i.test(dest)) {
        dest = '/' + res.rabat.context.slice(0, -1).join('/') + '/' + dest;
        dest = dest.replace(/\/+/g, '/');
      }
    }
    debug('redirecting to %s', dest);
    res.writeHead(302, {
      Location: dest,
      'X-Powered-By': 'Rabat'
    });
    return res.end();
  };

  Router = (function() {
    Router.prototype._rabat_object = 'router';

    function Router(routes, prefix) {
      var key, self, value;
      this.prefix = prefix != null ? prefix : '';
      debug('new router');
      if (routes._rabat_object === 'router') {
        debug('...from existing router');
        routes.prefix = this.prefix;
        routes = routes.map;
      }
      this.map = _.mapValues(routes, (function(_this) {
        return function(handler, key) {
          var router;
          if (!handler) {
            return null;
          }
          if (!/^[A-Za-z0-9_% -\.]+/.test(key)) {
            return null;
          }
          if (typeof handler === 'function' && handler._rabat_object !== 'router') {
            debug('mounting handler %s to %s', _fname(handler), _this.prefix + key);
            return handler;
          } else if (typeof handler === 'object' || handler._rabat_object === 'router') {
            debug('mounting router %s to %s...', _rname(handler), _this.prefix + key);
            router = new Router(handler, _this.prefix + key + '/');
            debug('DONE mounting router to %s', _this.prefix + key);
            return router;
          } else {
            return null;
          }
        };
      })(this));
      this.map = _.pick(this.map, _.identity);
      this.map = _.mapKeys(this.map, (function(_this) {
        return function(handler, key) {
          return key.toUpperCase();
        };
      })(this));
      self = (function(_this) {
        return function(req, res, next) {
          var base, base1, c0, contextpath, handler, newnext;
          if (next == null) {
            next = finalhandler(req, res);
          }
          if (next._rabat_object !== 'nexthandler') {
            newnext = function(err) {
              debug('...NOT found, chaining to next middleware');
              delete req.rabat;
              delete res.rabat;
              return next(err);
            };
            newnext._rabat_object = 'nexthandler';
          }
          if (req.rabat == null) {
            req.rabat = {};
          }
          res.rabat = req.rabat;
          if ((base = req.rabat).path == null) {
            base.path = _.filter((url.parse(req.url)).pathname.split('/'));
          }
          if ((base1 = req.rabat).context == null) {
            base1.context = [];
          }
          res.rabat.redirect = function(dest, path) {
            return _redirect(res, dest, path);
          };
          contextpath = req.rabat.path.slice(req.rabat.context.length);
          if (!contextpath.length) {
            contextpath = ['index'];
          }
          req.rabat.context.push(contextpath[0]);
          if (typeof _this.map['**'] === 'function') {
            debug('setting %s as default handler', _fname(_this.map['**']));
            newnext = function(err) {
              debug('...NOT found, chaining to default handler');
              if (err) {
                next(err);
              }
              return _this.map['**'](req, res, next);
            };
            newnext._rabat_object = 'nexthandler';
          }
          debug('resolving %s in router %s', contextpath.join('/'), (_.keysIn(_this.map)).join());
          c0 = contextpath[0].toUpperCase();
          handler = _this.map[req.method + ' ' + c0] || _this.map[c0] || _this.map['*'];
          if (!handler) {
            return (newnext || next)();
          }
          if (handler._rabat_object !== 'router') {
            debug('...NOT a router, running handler');
          }
          return handler(req, res, newnext || next);
        };
      })(this);
      for (key in this) {
        value = this[key];
        self[key] = value;
      }
      return self;
    }

    return Router;

  })();

  module.exports = Router;

}).call(this);
