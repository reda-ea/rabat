
_ = require 'lodash'

module.exports =
    config: require './config'
    controller: require './controller'
    response: require './response'
    router: require './router'
    application: require './application'
    model: require './model'

module.exports.application.register 'errorpage', require './errorpage'

# patch to make Error objects JSONable
if typeof Error.prototype.toJSON isnt 'function'
    Object.defineProperty Error.prototype, 'toJSON',
        value: ->
            _ Object.getOwnPropertyNames @
                .reduce (s, k)->
                    s[k] = @[k]; s
                , {}, @
        configurable: true
