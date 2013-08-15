var AbstractNpmCommand = require("./abstract-npm-command").AbstractNpmCommand,
    Q = require("q"),
    Tools = require("./package-manager-tools").PackageManagerTools,
    npm = require("npm"),

    ERROR_NOT_FOUND = 2001,
    ERROR_VERSION_NOT_FOUND = 2002;

exports.installCommand = Object.create(AbstractNpmCommand, {

    /**
     * Prepares the install command, then invokes it.
     * @function
     * @param {String} request, the package to install, should respect the following format: "name[@version]".
     * @param {String} where, where to install the package.
     * @param {boolean} deeply, option which allows to get a response with further information.
     * @return {Promise.<Object>} A promise for the installed package.
     */
    run: {
        value: function (request, where, deeply) {
            if (typeof request === 'string' && request.length > 0) {
                request = request.trim();
            } else {
                throw new TypeError("The request value should be a string or not empty.");
            }

            if (Tools.isRequestValid(request)) {
                if (!this._npmLoaded) {
                    var self = this;
                    return this._loadNpm().then(function () {
                        return self._invokeInstallCommand(request, where, deeply);
                    });
                } else {
                    return this._invokeInstallCommand(request, where, deeply);
                }
            } else {
                throw new Error("The request should be a string and respect the following format: name[@version] | or git url");
            }
        }
    },

    /**
     * Invokes the install command.
     * @function
     * @param {String} request, the package to install, should respect the following format: "name[@version]".
     * @param {String} where, where to install the package.
     * @param {boolean} deeply, option which allows to get a response with more information.
     * @return {Promise} A promise for the installed package.
     * @private
     */
    _invokeInstallCommand: {
        value: function (request, where, deeply) {
            var self = this;

            return Q.ninvoke(npm.commands, "install", where, request).then(function (data) { // Where -> private API.
                if (Array.isArray(data) && data.length >= 3) {
                    return self._formatResponse(data[1], deeply);
                }
            }, function (error) {
                if (typeof error === 'object') {
                    if (error.code === 'E404') {
                        throw new Error(ERROR_NOT_FOUND);
                    } else {
                        throw ((/version not found/).test(error.message)) ? new Error(ERROR_VERSION_NOT_FOUND) : error;
                    }
                } else {
                    throw error;
                }
            });
        }
    },

    /**
     * Format the NPM response when the package installation is done.
     * @function
     * @param {Object} response, contains all information about the installation.
     * @param {boolean} deeply, option which allows to get a deeply response.
     * @return {Object} a well formatted object containing information about the installation.
     * @private
     */
    _formatResponse: {
        value: function (response, deeply) {
            if (response && typeof response === 'object') {
                var keys = Object.keys(response),
                    root = response[keys[0]],
                    information = Tools.getModuleFromString(root.what);

                return {
                    name: (information.name || ''),
                    version: (information.version|| ''),
                    children: (!!deeply) ? this._formatChildren(root) : null
                };
            }
        }
    },

    /**
     * Format the dependencies child.
     * @function
     * @param {Object} parent, represents the parent of a given level.
     * @private
     */
    _formatChildren: {
        value: function (parent) {
            var container = [];
            if (parent && typeof parent === 'object' && parent.hasOwnProperty('children')) {
                for (var i = 0, length = parent.children.length; i < length; i++) {
                    var child = parent.children[i],
                        tmp = Tools.getModuleFromString(child.what);

                    tmp.children = this._formatChildren(child);
                    container.push(tmp);
                }
            }
            return container;
        }
    }

});
