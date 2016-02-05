
_ = require 'lodash'
bluebird = require 'bluebird'
debug = (require 'debug') 'rabat:model'

defaultData = []

defaultSpecs =
    init: ->
        @tid = defaultData.length
        defaultData.push []
    get: (id)->
        _.cloneDeep defaultData[@tid][id] or null
    query: (params)->
        _.cloneDeep _.filter (defaultData[@tid].filter _.identity), _.matches params
    save: (rec)->
        if rec.id
            defaultData[@tid][rec.id] = rec
        else
            rec.id = defaultData[@tid].length
            defaultData[@tid].push rec
        rec
    remove: (rec)->
        return null unless rec.id
        oldrec = defaultData[@tid][rec.id]
        defaultData[@tid][rec.id] = null
        oldrec

_delegate = (self, method, args=[])->
    methodf = self.specs[method]
    unless typeof methodf is 'function'
        methodf = defaultSpecs[method]
        debug '...using default method'
    new bluebird (resolve)->
        resolve methodf.apply self, args

_populate = (self, rec, fields, specs)->
    bluebird.props _.mapValues fields, (subfields, field)->
        new bluebird (resolve)->
            debug 'populating field %s of record %s', field, rec.id
            resolve specs[field].call self, rec, subfields
    .then (populated)->
        _.extend rec, populated

class Model
    constructor: (@specs = {})->
        debug 'initializing model %s', @specs._name or @specs.name
        _delegate @, 'init'
    find: (id={}, populate={})->
        method = if _.isObject id then 'query' else 'get'
        debug '%s from model %s', method, @specs._name or @specs.name
        _delegate @, method, [id]
        .then (res)=>
            if method is 'get'
                _populate @, res, populate, @specs.populate or defaultSpecs.populate
            else if method is 'query'
                bluebird.map res, (rec)=>
                    _populate @, rec, populate, @specs.populate or defaultSpecs.populate
    save: (rec={})->
        debug 'saving to model %s', @specs._name or @specs.name
        _delegate @, 'save', [rec]
    remove: (rec={})->
        debug 'removing from model %s', @specs._name or @specs.name
        _delegate @, 'remove', [rec]

module.exports = Model

module.exports._getMemoryStore = -> defaultData
