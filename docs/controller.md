

<!-- Start src/controller.js -->

## Controller

The `Controller` object can transform a normal function to an HTTP handler.

The action function gets the HTTP input data as function arguments,
and can return a [`Response`](./response.md) object, or anything that
can construct one (string, Buffer, custom function, etc), or can even
throw in case of error.

Additionally, the controller can provide additional features to every
action it builds:
* *extensions* can provide additional functionality to the actions,
  such as access to the path, query, session, or even database connections, etc.
  These features can be accessed as arguments to the function.
* *formatters* can control and modify the response returned by the action
  function before it is sent. This can allow applying templates/layouts,
  customizing error pages, etc.

----

### constructor(controller, controller.extensions, controller.formatters)

Builds a new controller from the provided features / controller.

Extensions and formatters can be provided to the constructor, or added later.

#### Params:

| Name | Type | Description |
| ---- | ---- | ----------- |
| controller | object | a `Controller` to clone, or an object with   `extensions` and `formatted` properties to copy |
| controller.extensions | Array.<function(req, res)> |   list of extensions to provide.<br><br>  - **req** {http.IncomingMessage} is the HTTP request object<br>  - **res** {http.ServerResponse} is the HTTP response object<br><br>  **returns** a map of available features, will be merged with the output<br>  from other extensions and provided the the action function |
| controller.formatters | Array.<function(resp)> |   list of formatters to apply.<br><br>  - resp {Response} the response constrcted from the action's return<br><br>  **returns** a new response, or a value that can construct one |

#### Returns:

* a new `Controller` object

----

### build(action, name)

Builds an action from a function, providing all available extensions,
and applying available formatters to its output.

The output is a valid
[http/connect middleware](https://github.com/senchalabs/connect/blob/master/README.md#use-middleware)
and can be directly used in an HTTP server or any other router.

#### Params:

| Name | Type | Description |
| ---- | ---- | ----------- |
| action | function(extensions) |   the action function to build. Expected to return/throw<br>  a `Response`, or a value that can be used to build one.<br><br>  - **extensions** {object} is the merged output of every available extension.<br>    By convention, features are prefixed with a `"$"` sign (e.g. `$session`),<br>    while query parameters and path variable are not prefixed.<br><br>  **returns** a `Response` output in case of success<br><br>  **throws** a `Response` output in case of failure |
| name | string *`(optional)`* | used for debugging (`"Unnamed"` by default) |

----

<!-- End src/controller.js -->

