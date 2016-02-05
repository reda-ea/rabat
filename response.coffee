
_ = require 'lodash'
bluebird = require 'bluebird'
debug = (require 'debug') 'rabat:response'
mime = require 'mime'
finalhandler = require 'finalhandler'

class Response
    _rabat_object: 'response'
    constructor: (error, reply)->
        @custom = (req, res, next)-> do next
        @auto = false
        @error = error?
        @status = if error? then 500 else 200 # res.status
        @type = 'html' # res.type
        @headers = # res.set
            'X-Powered-By': 'Rabat'
        reply = error unless reply?
        unless reply?
            debug 'new default response'
            return
        @custom = false
        if reply?._rabat_object is 'response'
            # debug 'keeping same response'
            _.assign @, reply
            return
        @auto = true
        if error?
            debug 'got error %s', error?.stack ? error
        if typeof reply is 'object'
            debug 'defaulting to json response'
            @type = 'json'
            @body = JSON.stringify(reply)
        else if typeof reply is 'function'
            debug 'defaulting to custom response'
            @custom = reply
        else
            debug 'defaulting to text response'
            @type = 'text'
            @body = _(reply).toString()
    send: (req, res, next)=>
        if @custom
            debug 'sending custom repsonse'
            unless typeof next is 'function'
                next = finalhandler(req, res)
            return @custom req, res, next
        contenttype = mime.lookup @type
        debug 'sending %s, %s response', @status, contenttype
        res.statusCode = @status
        res.setHeader 'Content-Type', contenttype
        _.forEach @headers, (v, k)->
            res.setHeader k, v
        if @body?
            contentlength = Buffer.byteLength @body
            debug '...with body length %s', contentlength
            res.setHeader 'Content-Length', contentlength
            res.write @body
        do res.end

module.exports = Response
