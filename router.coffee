
_ = require 'lodash'
finalhandler = require 'finalhandler'
url = require 'url'
debug = (require 'debug') 'rabat:router'

_fname = (fn)-> fn._name or fn.name
_rname = (r)->
    if r._rabat_object is 'router'
        ':' + do (_.keysIn r.map).join
    else
        do (_.keysIn r).join

_redirect = (res, dest='/', path)->
    if dest._rabat_prefix
        dest = dest._rabat_prefix
    if dest._rabat_object is 'router'
        dest = '/' + dest.prefix
        dest += '/' + path if path?
    if res.rabat and dest[0] isnt '/'
        unless /(?:^[a-z][a-z0-9+.-]*:|\/\/)/i.test dest
            dest = '/' + res.rabat.context[...-1].join('/') + '/' + dest
            dest = dest.replace /\/+/g, '/'
    debug 'redirecting to %s', dest
    res.writeHead 302,
        Location: dest
        'X-Powered-By': 'Rabat'
    do res.end

class Router
    _rabat_object: 'router'
    # prefix only used for logging
    constructor: (routes, @prefix='')->
        debug 'new router'
        if routes._rabat_object is 'router'
            debug '...from existing router'
            # TODO add/update a redirect index in THIS router instead
            routes.prefix = @prefix
            routes = routes.map
        @map = _.mapValues routes, (handler, key)=>
            return null unless handler
            return null unless /^[A-Za-z0-9_% -\.]+/.test key
            if typeof handler is 'function' and handler._rabat_object isnt 'router'
                debug 'mounting handler %s to %s', (_fname handler), @prefix + key
                handler
            else if typeof handler is 'object' or handler._rabat_object is 'router'
                debug 'mounting router %s to %s...', (_rname handler), @prefix + key
                router = new Router handler, @prefix + key + '/'
                debug 'DONE mounting router to %s', @prefix + key
                router
            else
                null
        @map = _.pick @map, _.identity
        @map = _.mapKeys @map, (handler, key)=> do key.toUpperCase
        self = (req, res, next)=>
            next ?= finalhandler(req, res)
            unless next._rabat_object is 'nexthandler'
                newnext = (err)->
                    debug '...NOT found, chaining to next middleware'
                    delete req.rabat
                    delete res.rabat
                    next err
                newnext._rabat_object = 'nexthandler'
            req.rabat ?= {}
            res.rabat = req.rabat
            req.rabat.path ?= _.filter (url.parse req.url).pathname.split '/'
            req.rabat.context ?= []
            res.rabat.redirect = (dest, path)-> _redirect res, dest, path
            contextpath = req.rabat.path.slice(req.rabat.context.length)
            contextpath = ['index'] unless contextpath.length
            req.rabat.context.push contextpath[0]
            if typeof @map['**'] is 'function'
                debug 'setting %s as default handler', _fname @map['**']
                newnext = (err)=>
                    debug '...NOT found, chaining to default handler'
                    next err if err
                    @map['**'] req, res, next
                newnext._rabat_object = 'nexthandler'
            debug 'resolving %s in router %s', (contextpath.join '/'), do (_.keysIn @map).join
            c0 = do contextpath[0].toUpperCase
            handler = @map[req.method + ' ' + c0] or @map[c0] or @map['*']
            return do (newnext or next) unless handler
            if handler._rabat_object isnt 'router'
                debug '...NOT a router, running handler'
            handler req, res, (newnext or next)
        for key, value of @
            self[key] = value
        return self

module.exports = Router
