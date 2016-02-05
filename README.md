
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

*TODO a more complex example with middlewares,
services, error handling, logging, sessions etc*
