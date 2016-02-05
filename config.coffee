
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

_ = require 'lodash'
config = require 'config'
flat = require 'flat'

defaultValues = {}
descriptions = {}

class Configurator
    constructor: (@scope='')->
        self = (scope)=>
            new Configurator @scope + scope + '.'
        for key, value of @
            self[key] = value
        return self
    # set default value, with optional env var
    set: (name, value, desc)=>
        throw 'name and value required' unless name and value?
        vname = @scope + do name.toLowerCase
        defaultValues[vname] = value
        descriptions[vname] = desc if desc
        _.forOwn (flat.unflatten defaultValues), (v, k)->
            config.util.setModuleDefaults k, v
    # get value (case insensitive)
    get: (name)=>
        vname = @scope + do name.toLowerCase
        config.get vname

module.exports = new Configurator

module.exports.desc = ->
    flat.unflatten _.mapValues defaultValues, (v, k)->
        v = JSON.stringify v if typeof v is 'object'
        ((descriptions[k]+' ') or '') + '(default: ' + v + ')'
