
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
