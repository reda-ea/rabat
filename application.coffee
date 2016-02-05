
_ = require 'lodash'
bluebird = require 'bluebird'
connect = require 'connect'
http = require 'http'
debug = (require 'debug') 'rabat:application'

$controller = require './controller'
$router = require './router'
$defaults = require './defaults'

OPTTYPES = ['$middlewares','$extensions','$formatters', '$policies']

#loops over object properties in order
#returns array of return values
forOrdered = (obj, cb)->
    keys = _.sortBy _.keysIn obj
    cb obj[k], k for k in keys

defaultOptions = {}

#return routes with normal (req, res)-> methods
parsespecs = (specs, options=defaultOptions, prefix='')->
    debug 'processing paths for %s', prefix or '[root]'
    # mark the object to allow easy redirects
    specs._rabat_prefix = prefix
    paths = _.pick specs, (v, k)->
        typeof v in ['object', 'function'] and k[0] not in ['$', '_']
    OPTTYPES.forEach (o)->
        options[o] ?= specs[o] or {}
        options[o] = _.assign options[o], specs[o]
        options[o] = _.pick options[o], (v)-> v?
    ctrl = new $controller
    forOrdered options.$extensions, (h, n)->
        h._name = n
        ctrl.extend n, h
    forOrdered options.$formatters, (h, n)->
        h._name = n
        ctrl.extend h
    _.mapValues paths, (handler, name)->
        if typeof handler is 'object'
            parsespecs handler, (_.cloneDeep options), prefix + '/' + name
        else
            debug 'processing handler %s', name
            app = new connect
            app._name = name
            forOrdered options.$middlewares, (h, n)->
                debug 'using middleware %s', n
                h._name = n
                app.use (req, res, next)->
                    debug 'running middleware %s', n
                    h req, res, next
            handler._name = name
            policies = forOrdered options.$policies, (h, n)->
                _.extend h, _name: n
            if policies.length
                policies.push handler
                handler = policies
            app.use ctrl handler

class Application
    _rabat_object: 'application'
    constructor: (@specs={})->
        debug 'new application'
        self = new $router parsespecs @specs
        for key, value of @
            self[key] = value
        return self
    extend: (packages...)->
        packages = packages.map (p)->
            if typeof p is 'object' then p else registeredPackages[p]
        newspecs = _.pick @specs, (v, k)->
            typeof v in ['object', 'function'] and k[0] isnt '$'
        OPTTYPES.forEach (o)=>
            newspecs[o] = {}
            _.assign newspecs[o], @specs[o]
            _.assign newspecs[o], p[o] for p in packages when p[o]
            newspecs[o] = _.pick newspecs[o], (v)-> v?
        new Application newspecs
    listen: (port)->
        new bluebird (resolve, reject)=>
            server = http.createServer @
            server.listen port, resolve
            server.on 'error', reject

# all available packages
registeredPackages = {}

Application.register = (name, pkg)->
    registeredPackages[name] = pkg

# register default packages
_.forOwn $defaults, (pkg, name)->
    return if typeof pkg isnt 'object'
    Application.register name, pkg
    _.merge defaultOptions, pkg

module.exports = Application
