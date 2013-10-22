var Q = require("q"),
    npm = require("npm"),
    path = require("path"),
    readJson = require("npm/node_modules/read-package-json"),
    OutDatedCommand = function () {};

/**
 * Prepares the outdated command, then invokes it.
 * @function
 * @return {Promise.<Object>} A promise with all outdated dependencies.
 */
OutDatedCommand.prototype.run = function () {
    if (!npm.config.loaded) {
        return Q.reject(new Error("NPM should be loaded first"));
    }
    return this._invokeOutDatedCommand();
};

/**
 * Invokes the outdated command.
 * @function
 * @return {Promise.<Object>} A promise with all outdated dependencies.
 * @private
 */
OutDatedCommand.prototype._invokeOutDatedCommand = function () {
    var self = this;

    readJson.cache.del(path.join(npm.prefix, "package.json")); // clean the cache.

    return Q.ninvoke(npm.commands, "outdated", [], true).then(function (list) {
        return self._formatListDependenciesOutDated(list);
    });
};

/**
 * Formats the information gathered from the NPM command.
 * @function
 * @param {Array} list contains all outdated dependencies.
 * @return {Object} contains all outdated dependencies well formatted.
 * @private
 */
OutDatedCommand.prototype._formatListDependenciesOutDated = function (list) {
    var container = {},
        dir = npm.prefix;

    for (var i = 0, length = list.length; i < length; i++) {
        var data = list[i],
            name = data[1],
            current = data[2],
            available = data[3],
            where = data[0];

        if (where === dir && current && current !== available) {
            container[name] = {
                current: current,
                available: available
            };
        }
    }
    return container;
};

exports.outDatedCommand = new OutDatedCommand();
