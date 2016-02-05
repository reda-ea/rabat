
_ = require 'lodash'
bluebird = require 'bluebird'
bodyParser = require 'body-parser'
multer = require 'multer'
url = require 'url'
config = require 'config'

$response = require './response'
$view = require './view'
$session = require './session'

# default controller extensions

exports.path =
    $extensions:
        path: (req)->
            _.extend req.rabat.path[req.rabat.context.length..],
                full: req.rabat.path
                context: req.rabat.context
        # RETURNS a redirect response
        redirect: ->
            (dest, path)->
                (req, res)-> res.rabat.redirect dest, path

exports.params =
    $middlewares:
        '01-json': do bodyParser.json
        '02-urlencoded': bodyParser.urlencoded extended: true
        '03-multipart': do multer
    $extensions:
        params: (req)->
            req.rabat.params = url.parse(req.url, true).query or {}
            _.assign req.rabat.params, req.params
            _.assign req.rabat.params, req.body
            _.assign req.rabat.params, req.query

exports.config =
    $extensions:
        config: -> config

# default response types

# body can be an ejs format template (only if string)
# the template is processed by _.template using values
textResponse = (body, values)->
    if values? and _.isString body
        content = (_.template body) values
    else
        content = _(body ? '').toString()
    _.extend (new $response null, content),
        auto: false

_resolveargs = (fn)-> (args...)-> bluebird.all(args).spread fn

exports.responses =
    $extensions:
        text: -> _resolveargs textResponse
        html: -> _resolveargs (body, values)->
            _.assign (textResponse body, values),
                type: 'html'
        json: -> _resolveargs (data)->
            _.extend (new $response null, JSON.stringify(data) or 'null'),
                auto: false
                type: 'json'
        notFound: (req)-> _resolveargs (resource)->
            resource ?= req.rabat.context[req.rabat.context.length-1]
            if resource._rabat_object isnt 'response'
                resource = new $response null, resource
            _.assign resource,
                status: 404
        serverError: -> _resolveargs (error)->
            error ?= new Error
            if error._rabat_object isnt 'response'
                if error.stack or error.message
                    fullerror = error
                    error = new $response null, (error.stack or error.message)
                    error.cause = fullerror
                else
                    error = new $response null, error
            _.assign error,
                status: 500
        next: ->
            _rabat_object: 'response'
            custom: (req, res, next)-> do next

exports.view = $view
exports.session = $session
