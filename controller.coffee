
bluebird = require 'bluebird'
_ = require 'lodash'
connect = require 'connect'
reflekt = require 'reflekt'
debug = (require 'debug') 'rabat:controller'

$response = require './response'

_fname = (fn)-> fn._name or fn.name

class Controller
    _rabat_object: 'controller'
    constructor: ->
        debug 'new controller'
        @extensions = {}
        @formatters = []
        self = @wrap
        for key, value of @
            self[key] = value unless key is 'wrap'
        return self
    extend: (property, getter)=>
        if getter?
            debug 'adding extension %s', property
            if @extensions[property]?
                throw new Error 'Extension "' + property + '" already loaded'
            @extensions[property] = getter
        else
            debug 'adding formatter %s', _fname property
            @formatters.push property
        @
    wrap: (handler)=>
        if _.isArray handler
            cname = do (handler.map _fname).join
            debug 'wrapping action chain %s', cname
            chdlr = handler.reduce (app, step)=>
                app.use @wrap step
            , _.extend (new connect), _name: cname
            return (req, res, next)->
                debug 'running chain %s', cname
                chdlr req, res, next
        debug 'wrapping action %s', _fname handler
        (req, res, next)=>
            debug 'action called %s', _fname handler
            req.rabat ?= {}
            req.rabat.params ?= {}
            debug 'loading extensions %s', do (_.keysIn @extensions).join
            bluebird.props _.mapValues @extensions, (g, k)->
                # debug 'loading extension %s', k
                g.call @, req, res
            .then (context)=>
                context = _.pick context, (v, k)-> k[0] isnt '_'
                # debug 'got context %s', do (_.keysIn context).join
                params = _.cloneDeep req.rabat.params ? {}
                reply = do bluebird.method ()->
                    debug 'running handler %s', _fname handler
                    reflekt.call handler, params, context
                handleReply = (r)->
                    r.then (val)-> new $response null, val
                    .catch (err)->
                        bluebird.resolve err
                        .then (err)-> new $response err
                callFormatter = (f, r)->
                    bluebird.resolve f.call context, r
                    .then (val)-> val ? r
                bluebird.reduce @formatters, (r, f)->
                    debug 'applying formatter %s', _fname f
                    handleReply callFormatter f, r
                , handleReply reply
                .then (resp)->
                    debug 'final response %s', resp.custom and 'custom' or resp.status
                    resp.send req, res, next

module.exports = Controller
