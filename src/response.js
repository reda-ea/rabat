
let finalhandler  = require( 'finalhandler');
let mime = require('mime');

let debug = require('debug')('rabat:response');

const fix_status = (status) => {
    if(/^[1-5][0-9][0-9]$/.test(status))
        return status;
    return 200;
};

const is_empty = (resp) =>
    ['custom', 'status', 'type', 'body'].every(k => resp[k] == null);

/**
 * The `Response` object describes an HTTP response.
 *
 * Once created, all information about the response can still be inspected
 * and modified - including the body.
 *
 * @property {function} custom a custom http handler. If specified, overrides all other fields
 * @property {number} status the status code for the response
 * @property {string} type the content type for the response (e.g. `"text/html"` or simply `"html"`)
 * @property {Buffer|string} body the payload of the response
 * @property {object} headers a map of HTTP headers to add to the response
 */
class Response {
    /**
     * Builds a response out of the provided data
     *
     * The contents of the response depend on the type of input:
     * * `Response`: simply copies the provided response
     * * `function`: uses the function as a custom handler/middleware
     * * `object`: uses the `JSON` representation of the object with a `json` content type
     * * any other type defaults to a text response (`string` body)
     *
     * @param {Response|function|object|string} input the contents of the response
     *
     * @returns a new `Response` object
     */
    constructor(reply) {
        this.headers = {
            'X-Powered-By': 'Rabat',
        };
        if(!reply) {
            debug(`new default response`);
        } else if(reply instanceof Response) {
            // log(`keeping same response`);
            this.custom = reply.custom;
            this.status = reply.status;
            this.type = reply.type;
            this.body = reply.body;
            this.headers = Object.assign({}, reply.headers);
        } else if(typeof reply == 'function') {
            debug('new custom response');
            this.custom = reply;
        } else if(typeof reply == 'object') {
            debug('new json reponse');
            this.type = 'json';
            this.body = JSON.stringify(reply);
        } else {
            debug('new text reponse');
            this.type = 'text';
            this.body = String(reply);
        }
    }

    /**
     * Sends the response.
     *
     * This method can be used like any
     * [http/connect middleware](https://github.com/senchalabs/connect/blob/master/README.md#use-middleware)
     *
     * @param {http.IncomingMessage} req request object
     * @param {http.ServerResponse} res response object
     * @param {function=} next method for chaining middlewares
     */
    send(req, res, next) {
        let customResponse = this.custom;
        if(!customResponse)
            Object.entries(this.headers || {}).forEach(
                ([key, value]) => res.setHeader(key, value)
            );
        if(is_empty(this)) {
            customResponse = (req, res, next) => next();
            debug('sending empty response');
        }
        if(customResponse) {
            if(this.custom)
                debug('sending custom reponse');
            if(typeof next != 'function')
                next = finalhandler(req, res);
            return customResponse(req, res, next);
        }
        let statusCode = fix_status(this.status);
        let contentType = mime.lookup(this.type || 'html');
        debug(`sending ${statusCode}, ${contentType} response`);
        res.statusCode = statusCode;
        res.setHeader('Content-Type', contentType);
        if(this.body != null) {
            let contentLength = Buffer.byteLength(this.body);
            debug(`... with body length ${contentLength}`);
            res.setHeader('Content-Length', contentLength);
            res.write(this.body);
        }
        res.end();
    }
}

module.exports = Response;
