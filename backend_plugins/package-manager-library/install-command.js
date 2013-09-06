var PackageManagerError = require("./core").PackageManagerError,
    Q = require("q"),
    Tools = require("./package-manager-tools").PackageManagerTools,
    npm = require("npm"),
    InstallCommand = function InstallCommand() {},

    ERROR_NOT_FOUND = 2000,
    ERROR_VERSION_NOT_FOUND = 2001,
    ERROR_WRONG_FORMAT = 2002,
    ERROR_UNKNOWN = 2003;

/**
 * Prepares the install command, then invokes it.
 * @function
 * @param {String} request the package to install, should respect the following format: "name[@version]".
 * @param {String} where where to install the package.
 * @param {boolean} deeply option which allows to get a response with further information.
 * @return {Promise.<Object>} A promise for the installed package.
 */
InstallCommand.prototype.run = function (request, where, deeply) {
    if (Tools.isRequestValid(request)) {
        if (!npm.config.loaded) {
            throw new Error("NPM should be loaded first");
        }
        return this._invokeInstallCommand(request, where, deeply);
    }
    throw new PackageManagerError("Should respect the following format: name[@version], gitUrl", ERROR_WRONG_FORMAT);
};

/**
 * Invokes the install command.
 * @function
 * @param {String} request the package to install, should respect the following format: "name[@version]".
 * @param {String} where where to install the package.
 * @param {boolean} deeply option which allows to get a response with more information.
 * @return {Promise} A promise for the installed package.
 * @private
 */
InstallCommand.prototype._invokeInstallCommand = function (request, where, deeply) {
    var self = this;

    return Q.ninvoke(npm.commands, "install", where, request).then(function (data) { // Where -> private API.
        return self._formatResponse(data[1], deeply);
    }, function (error) {
        if (typeof error === 'object') {
            if (error.code === 'E404') {
                error = new PackageManagerError("Dependency not found", ERROR_NOT_FOUND);
            } else if ((/version not found/).test(error.message)) {
                error = new PackageManagerError("Version not found", ERROR_VERSION_NOT_FOUND);
            }
        }
        throw error;
    });
};

/**
 * Format the NPM response when the package installation is done.
 * @function
 * @param {Object} response contains all information about the installation.
 * @param {boolean} deeply option which allows to get a deeply response.
 * @return {Object} a well formatted object containing information about the installation.
 * @private
 */
InstallCommand.prototype._formatResponse = function (response, deeply) {
    if (response && typeof response === 'object') {
        var keys = Object.keys(response),
            root = response[keys[0]];

        if (!root && typeof root !== 'object') {
            throw new PackageManagerError("Dependency not installed", ERROR_UNKNOWN);
        }

        var information = Tools.getModuleFromString(root.what);

        return {
            name: information.name || '',
            version: information.version|| '',
            children: !!deeply ? this._formatChildren(root) : null
        };
    }
};

/**
 * Format the dependencies child.
 * @function
 * @param {Object} parent represents the parent of a given level.
 * @private
 */
InstallCommand.prototype._formatChildren = function (parent) {
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
};

exports.installCommand = new InstallCommand();
