
_ = require 'lodash'
bluebird = require 'bluebird'
glob = require 'glob'
cons = require 'consolidate'
callsite = require 'callsite'
debug = (require 'debug') 'rabat:view'

$response = require './response'
$config = (require './config') 'rabat.views'

$config.set 'path', '.',
    'the base path to look for non local views (relative or absolute)'
$config.set 'engine', 'lodash',
    'the engine to use for templates with no file extension'

# NOTE requires router module
module.exports =
    $extensions:
        view: (req, res)->
            defaultpath = req.rabat.context
            (path='', data)->
                pathprefix = $config.get 'path'
                unless data?
                    data = path or {}
                    path = ''
                unless path
                    debug 'no path specified, guessing default'
                    path = '/' + defaultpath.join '/'
                if path[0..1] is './'
                    debug 'local path specified'
                    callerfile =  do (do callsite)[1].getFileName
                    path = ((require 'path').dirname callerfile) + path[1..]
                    pathprefix = ''
                unless path[0] is '/'
                    debug 'relative path specified'
                    path = (defaultpath[...-1].join '/') + '/' + path
                unless path[0] is '/'
                    path = '/' + path
                fullpath = pathprefix + path
                (bluebird.promisify glob) fullpath + '.*'
                .then (files)->
                    fileinfo = files.map (file)->
                        ext = file[fullpath.length+1..].split '.'
                        unless ext.length
                            ext = [$config.get 'engine']
                        engine = ext[ext.length-1]
                        return null if typeof cons[engine] isnt 'function'
                        output = 'html'
                        if ext.length > 1
                            output = ext[ext.length-2]
                        name: file
                        engine: engine
                        output: output
                    .filter(_.identity)[0]
                    unless fileinfo
                        debug 'no template file found: %s.*', fullpath
                        throw _.extend (new Error 'Template "' + fullpath + '.*" not found'),
                            _rabat_error: 'TEMPLATE_NOT_FOUND'
                    debug '%s generating %s from %s', fileinfo.engine, fileinfo.output, fileinfo.name
                    [fileinfo.output, cons[fileinfo.engine] fileinfo.name, _.clone data]
                .spread (output, content='')->
                    _.assign (new $response null, content),
                        type: output
    $formatters:
        '01-view': (resp)->
            if resp.type is 'json' and resp.auto and not resp.error
                debug 'auto JSON response, attempting to render...'
                @view JSON.parse resp.body
                .then (viewresp)->
                    debug 'implicit template found, sending view'
                    viewresp
                .catch (e)->
                    if e._rabat_error is 'TEMPLATE_NOT_FOUND'
                        debug 'implicit render failed, returning JSON'
                        resp
                    else
                        throw e
