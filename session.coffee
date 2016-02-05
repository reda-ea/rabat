
_ = require 'lodash'
session = require 'express-session'

$config = (require './config') 'rabat.session'

defaults =
    secret : '' + Math.round(Math.random() * 100000000)
    resave: true
    saveUninitialized: true

$config.set 'store.name', 'memory', 'name of the session store module to use'
$config.set 'store.options', {}, '[Object] options for the sessions store'
$config.set 'options', defaults, '[Object] options for express-session'

options = _.cloneDeep $config.get 'options'

storeconf = $config.get 'store'
unless storeconf
    throw new Error "config: session store can't be empty"
if typeof storeconf is 'string'
    storeconf = name: storeconf, options: {}
if storeconf.name and storeconf.name isnt 'memory'
    storecstr = (require storeconf.name) session
    if _.isEmpty storeconf.options
        options.store = new storecstr
    else
        options.store = new storecstr storeconf.options

module.exports =
    $middlewares:
        '04-session': session options
    $extensions:
        session: (req)-> req.session
