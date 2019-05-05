
const debug = require('debug')('rabat:controller');

const Response = require('./response');

const buildMiddleware = function (extensions, formatters, action, name='Unnamed') {
    debug(`building action ${name}`);
    return async function(req, res, next) {
        let context = await extensions.reduce(
            async (ctx, ext) => Object.assign(await ctx, await ext(req, res))
        , {});
        let response = await formatters.reduce(
            async (resp, fmt) => Response.fromPromise(fmt(await resp)),
            Response.fromPromise(action(context))
        );
        response.send(req, res, next);
    };
};
/**
 * The `Controller` object can transform a normal function to an HTTP handler.
 *
 * The action function gets the HTTP input data as function arguments,
 * and can return a [`Response`](./response.md) object, or anything that
 * can construct one (string, Buffer, custom function, etc), or can even
 * throw in case of error.
 *
 * Additionally, the controller can provide additional features to every
 * action it builds:
 * * *extensions* can provide additional functionality to the actions,
 *   such as access to the path, query, session, or even database connections, etc.
 *   These features can be accessed as arguments to the function.
 * * *formatters* can control and modify the response returned by the action
 *   function before it is sent. This can allow applying templates/layouts,
 *   customizing error pages, etc.
 *
 */
class Controller {
    /**
     * Builds a new controller from the provided features / controller.
     *
     * Extensions and formatters can be provided to the constructor, or added later.
     *
     * @param {object} controller a `Controller` to clone, or an object with
     *   `extensions` and `formatted` properties to copy
     * @param {Array.<function(req, res)>} controller.extensions
     *   list of extensions to provide.
     *
     *   - **req** {http.IncomingMessage} is the HTTP request object
     *   - **res** {http.ServerResponse} is the HTTP response object
     *
     *   **returns** a map of available features, will be merged with the output
     *   from other extensions and provided the the action function
     * @param {Array.<function(resp)>} controller.formatters
     *   list of formatters to apply.
     *
     *   - resp {Response} the response constrcted from the action's return
     *
     *   **returns** a new response, or a value that can construct one
     *
     * @returns a new `Controller` object
     */
    constructor({extensions = [], formatters = []} = {}) {
        this.extensions = [...extensions];
        this.formatters = [...formatters];
    }

    /**
     * Builds an action from a function, providing all available extensions,
     * and applying available formatters to its output.
     *
     * The output is a valid
     * [http/connect middleware](https://github.com/senchalabs/connect/blob/master/README.md#use-middleware)
     * and can be directly used in an HTTP server or any other router.
     *
     * @param {function(extensions)} action
     *   the action function to build. Expected to return/throw
     *   a `Response`, or a value that can be used to build one.
     *
     *   - **extensions** {object} is the merged output of every available extension.
     *     By convention, features are prefixed with a `"$"` sign (e.g. `$session`),
     *     while query parameters and path variables are not prefixed.
     *
     *   **returns** a `Response` output in case of success
     *
     *   **throws** a `Response` output in case of failure
     * @param {string=} name used for debugging (`"Unnamed"` by default)
     */
    build(action, name) {
        return buildMiddleware(this.extensions, this.formatters, action, name);
    }
}

module.exports = Controller;
