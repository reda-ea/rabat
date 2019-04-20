
let finalhandler  = require( 'finalhandler');
let mime = require('mime');

let debug = require('debug')('rabat:response');

const fix_status = (status, error) => {
    if(/^[1-5][0-9][0-9]$/.test(status))
        return status;
    return error ? 500 : 200;
};

const is_empty = (resp) =>
    ['error', 'status', 'type', 'body', 'custom'].every(k => resp[k] == null);

class Controller {
    constructor(error, reply) {
        if(error != null) {
            debug(`got error: "${error.stack || error}"`);
            this.error = true;
            reply = error;
        }
        this.headers = {
            'X-Powered-By': 'Rabat',
        };
        if(!reply) {
            debug(`new default response`);
        } else if(reply instanceof Controller) {
            // log(`keeping same response`);
            Object.assign(this, reply);
            return;
        } else if(typeof reply == 'function') {
            debug('defaulting to custom response');
            this.custom = reply;
            return;
        } else if(typeof reply == 'object') {
            debug('defaulting to json reponse');
            this.type = 'json';
            this.body = JSON.stringify(reply);
            return;
        } else {
            debug('defaulting to text reponse');
            this.type = 'text';
            this.body = String(reply);
        }
    }

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
        let statusCode = fix_status(this.status, this.error);
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

module.exports = Controller;
