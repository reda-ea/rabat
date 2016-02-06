
    __________       ___.           __
    \______   \_____ \_ |__ _____ _/  |_
     |       _/\__  \ | __ \\__  \\   __\
     |    |   \ / __ \| \_\ \/ __ \|  |
     |____|_  /(____  /___  (____  /__|
            \/      \/    \/     \/
    -------------------------------------
     THE INTUITIVE NODE.JS WEB FRAMEWORK
    -------------------------------------

Proof of concept (for now) web framework aiming for
ease of use first, and a few other things...

### Hello World

```coffeescript
new rabat.application
    index: (name)-> "Hello #{name ? 'world'}"
.listen 3000
```

**That's it !** Only the necessary, nothing more.

### Fancier example

```coffeescript
new rabat.application
    $middlewares:
        # add any connect-compatible middleware
        static: (require 'serve-static') './'
    index: (name)->
        # @html accepts ejs-style templates
        @html 'hello <%= val.trim() %>', {val: name or 'world'}
    content:
        $policies:
            'min-count':
                @session.lct ?= 0
                if @session.lct < 5
                    # smart redirect: to sub app regardless of where mounted
                    @redirect subapp, '/count'
                else
                    @next
        index: ->
            # will look for content/auto.* from views base dir
            @view 'auto', {source: 'index'}
        auto: ->
            # returned objects will automatically map to views based on path
            # (here content/auto.*) if they exist, otherwise JSON response
            {source: 'auto'}
    # sub applications example (typically required() from other files)
    sub: subapp # see below
    # default route for this and all subpaths: default not found processing
    '**': -> do @notFound
    coffee: ->
        # I'm a teapot !
        _.extend new rabat.response,
            status: 418
            auto: true
# nice looking default error pages
.extend 'errorpage'
.listen process.env.PORT
.then ->
    # print all available configuration options with descriptions
    console.log JSON.stringify do rabat.config.desc, null, 2

# sub application (would typically be included from a separate module)
subapp =
    count: ->
        # using the session
        @session.lct = (@session.lct ? 0) + 1
        'page accessed ' + @session.lct + ' times'
    reset: ->
        @session.lct = 0
        'page acces count reset'
    display: ->
        # template file relative to current script (eg self contained modules)
        @view './count.jade'
    index: ->
        throw new Error('be more specific')
```

### Documentation

The framework is broken into separate modules,
and each module can be used completely separately.

<small>(Documentation still in progress,
will be updated with more details / actual code very soon)</small>

#### Application

The application combines all of the individual modules,
and adds a lot of features / logic, and is the preferred way
to use the framework.

Understanding the different modules, however,
can greately help make the best use of the application module.

[read more]() <small>(coming soon)</small>

#### Controller

The initial / core concept for this framework.

The idea is to map a wen action to a simple promise enabled function:
input parameters are function arguments, the return value defines the output.

Additionally, controllers can be extended, which will provide more functionality
through the "this" object in the function (the main way services are designed).

[read more]() <small>(coming soon)</small>

#### Router

A very basic / fast router for node.js web applications.

Instead of using a list of patterns (that most higher level frameworks will
build from an object - eg sails.js & express), routes will be directly
specified as objects, with leaves being normal node.js query handlers.

Additionally, any router can be used as sub-router in another one,
and it is possible to send redirects to that router, without knowing where
it is mounted.

[read more]() <small>(coming soon)</small>

#### Model (experimental)

Very generic data model, independant of the data source (database,
web service, static, etc).

The interface allows creating model classes by defining the basic
functionalities (querying, saving, deleting) and fields to populate.

The resulting class automatically handles querying, saving, etc across multiple
levels (eg retrieve a group with all its users, modify the user objects then
save the group -> will issue individual updates to all users in the database).

[read more]() <small>(coming soon)</small>

### Configuration

Many modules and extensions are configurable (eg default view folder), and all
available settings can be viewed when the application is running.

Application settings can be specified directly on the developed modules,
and will autmatically be included to the available options.

Configuration values can be specified in configuration files, environment
variables, or on the command line.

[read more]() <small>(coming soon)</small>

#### Utilities / Extensions

In addition to the core modules, common functionality is provided out of the
box as plugins / extesions to the framework handling:

* [Response types]() <small>(coming soon)</small>
* [Views and templates]() <small>(coming soon)</small>
* [Session management]() <small>(coming soon)</small>
* [Error pages]() <small>(coming soon)</small>
