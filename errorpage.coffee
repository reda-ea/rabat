
_ = require 'lodash'
http = require 'http'
debug = (require 'debug') 'rabat:errorpage'

$view = require './view'
$config = require './config'

preformat = (html)->
    '<pre style="text-align:left">' + html + '</pre>' if html

sendpage = (view, status, data)->
    page = 'CUSTOM'
    view '/' + status, data
    .then _.identity, (e)->
        throw e unless e._rabat_error is 'TEMPLATE_NOT_FOUND'
        page = 'DEFAULT'
        view './error', data
    .then (resp)->
        debug 'got ' + status + ' response, sending ' + page + ' error page'
        _.extend resp,
            status: status
            auto: true

errordata = (status)->
    data =
        status: module.exports[status]?.status
        colors: module.exports[status]?.colors
        message: module.exports[status]?.message
    statbase = String(status)[0]+'00'
    data.status ?= [
        status
        http.STATUS_CODES[status] ? http.STATUS_CODES[statbase]
    ]
    data.colors ?= module.exports[statbase].colors
    data.message ?= module.exports[statbase].message
    data

module.exports =
    $formatters:
        '09-errorpage': (resp)->
            return unless resp.auto
            if String(resp.status)[0] in ['4', '5']
                data = errordata resp.status
                # TODO allow async message getters
                data.message = (data.message.call @, resp) or resp.body
                if resp.type is 'json'
                    data.data = (JSON.parse resp.body).data
                sendpage @view, resp.status, data
    '404':
        status: ['404', 'Page Not Found']
        message: (resp)->
            if resp.body is @path.context[@path.context.length-1]
                'The resource at <b>' + (@path.context.join '/') +
                '</b> could not be found.<br>Please try again later.'
    '400':
        colors: ['#ADD8E6', '#3D78A7', '#7599AF', '#DCEFFF', '#9AC2DA']
        message: (resp)->
            if resp.type is 'json'
                (JSON.parse resp.body).message
    '500':
        colors: ['#E6ADAD', '#A73D3D', '#AF7575', '#FFDCDC', '#DA9A9A']
        message: (resp)->
            if resp.cause
                (preformat resp.cause.stack) or resp.body
            else if resp.type is 'json'
                cause = (JSON.parse resp.body)
                (preformat cause.stack) or cause.message or resp.body
