

<!-- Start src/response.js -->

## Response

The `Response` object describes an HTTP response.

Once created, all information about the response can still be inspected
and modified - including the body.

#### Properties:

| Name | Type | Description |
| ---- | ---- | ----------- |
| custom | function | a custom http handler. If specified, overrides all other fields |
| status | number | the status code for the response |
| type | string | the content type for the response (e.g. `"text/html"` or simply `"html"`) |
| body | Buffer &#124; string | the payload of the response |
| headers | object | a map of HTTP headers to add to the response |

----

### constructor(input)

Builds a response out of the provided data.

The contents of the response depend on the type of input:
* `Response`: simply copies the provided response
* `function`: uses the function as a custom handler/middleware
* `object`: uses the `JSON` representation of the object with a `json` content type
* any other type defaults to a text response (`string` body)

#### Params:

| Name | Type | Description |
| ---- | ---- | ----------- |
| input | Response &#124; function &#124; object &#124; string | the contents of the response |

#### Returns:

* a new `Response` object

----

### send(req, res, next)

Sends the response.

This method can be used like any
[http/connect middleware](https://github.com/senchalabs/connect/blob/master/README.md#use-middleware)

#### Params:

| Name | Type | Description |
| ---- | ---- | ----------- |
| req | http.IncomingMessage | request object |
| res | http.ServerResponse | response object |
| next | function *`(optional)`* | method for chaining middlewares |

----

### fromPromise(promise)

Builds a response from a promise.

The promise is expected to respolve to a value that can
construct a new `Response` (see constructor syntax above)

If the promise fails, the error value is used to construct
a `Response`, and if the contructed response does not have
a valid `status`, it will default to a `500`

See: [constructor(input)](#constructorinput)

#### Params:

| Name | Type | Description |
| ---- | ---- | ----------- |
| promise | Promise | resolves to a `Response` input |

----

<!-- End src/response.js -->

