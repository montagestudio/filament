var Core = require("./core"),
    AbstractNpmCommand = Core.AbstractNpmCommand,
    PackageManagerError = Core.PackageManagerError,
    Q = require("q"),
    Tools = require("./package-manager-tools").PackageManagerTools,
    ERROR_NOT_FOUND = 3000,
    ERROR_REQUEST_INVALID = 3001,
    ERROR_WRONG_FORMAT = 3002,
    npm = require("npm");

exports.viewCommand = Object.create(AbstractNpmCommand, {

    /**
     * Prepares the view command, then invokes it.
     * @function
     * @param {String} request, represents a string with the following format: "name[@version]".
     * @return {Promise.<Object>} A promise for the requested package.
     */
    run: {
        value: function (request) {

            if (typeof request === 'string' && request.length > 0) {
                request = request.trim();
            } else {
                throw new PackageManagerError("Request invalid.", ERROR_REQUEST_INVALID);
            }

            if (Tools.isRequestValid(request)) {
                if (!this._npmLoaded) {
                    var self = this;
                    return this._loadNpm().then(function () {
                        return self._invokeViewCommand(request);
                    });
                }
                return this._invokeViewCommand(request);
            }
            throw new PackageManagerError("Should respect the following format: name[@version].", ERROR_WRONG_FORMAT);
        }
    },

    /**
     * Invokes the view command.
     * @function
     * @param {String} request, represents a string with the following format: "name[@version]".
     * @return {Promise.<Object>} A promise for the requested package.
     * @private
     */
    _invokeViewCommand: {
        value: function (request) {
            var self = this;
            return Q.ninvoke(npm.commands, "view", [request], true).then(function (success) {
                if (success && typeof success === 'object') {
                    var module = success,
                        keys = Object.keys(module);

                    if (keys.length === 1) {
                        return self._formatModule(module[keys[0]]);
                    }
                } // Can be null if the version doesn't exists.
            }, function (error) {
                if (error && typeof error === 'object') {
                    if (error.hasOwnProperty('code') && error.code === 'E404') { // no results
                        throw new PackageManagerError("Dependency not found.", ERROR_NOT_FOUND);
                    }
                } else {
                    throw error;
                }
            });
        }
    },

    /**
     * Formats the information gathered from the NPM command.
     * @function
     * @param {Object} module, element to format.
     * @return {Object} An formatted Package object.
     * @private
     */
    _formatModule: {
        value: function (module) {
            return {
                name: (module.name || ''),
                version: (module.version || ''),
                versions: (Array.isArray(module.versions)) ? module.versions : [],
                author: (typeof module.author === 'string') ? Tools.formatPersonFromString(module.author) :
                    (module.author && typeof module.author === 'object') ? module.author : '',
                description: (module.description || ''),
                maintainers: Tools.formatPersonsContainer(module.maintainers),
                contributors: Tools.formatPersonsContainer(module.contributors),
                time: (module.time) ? module.time : null,
                homepage: (module.homepage || '')
            };
        }
    }

});
