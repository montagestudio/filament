var AbstractNpmCommand = require("./abstract-npm-command").AbstractNpmCommand,
    Q = require("q"),
    Tools = require("./package-manager-tools").PackageManagerTools,
    npm = require("npm");

exports.searchCommand = Object.create(AbstractNpmCommand, {

    /**
     * Prepares the search command, then invokes it.
     * @function
     * @param {String} name, the dependency name to search.
     * @param {number} limit, limit the number of results.
     * @return {Promise.<Object>} Promise for the searched package.
     */
    run: {
        value: function (name, limit) {
            if (typeof name === 'string' && name.length > 0) {
                name = name.trim();
            } else {
                throw new TypeError("The request value should be a string or not empty.");
            }

            if (Tools.isNameValid(name)) {
                this.limit = limit;

                if (!this._npmLoaded) { // Needs to load npm at least once.
                    var self = this;
                    return this._loadNpm().then(function () {
                        return self._invokeSearchCommand(name);
                    });
                } else {
                    return this._invokeSearchCommand(name);
                }
            } else {
                throw new Error("The request should be a string and respect the following format: name.");
            }
        }
    },

    /**
     * Invokes the search command.
     * @function
     * @param {String} name, the dependency name to search.
     * @return {Promise.<Object>} Promise for the searched package.
     * @private
     */
    _invokeSearchCommand: {
        value: function (name) {
            var self = this;
            return Q.ninvoke(npm.commands, "search", name, true).then(function (results) {
                var formatted = [];
                if (typeof results === 'object') {
                    var keys = Object.keys(results);

                    for (var i = 0, length = keys.length; i < length; i++) {
                        if (self.limit > 0 && --self._iterator < 0) {
                            self.limit = 0;
                            break;
                        }
                        formatted.push(self._formatElementFromResearch(results[keys[i]]));
                    }
                }
                return formatted;
            });
        }
    },

    /**
     * Format a element from the results.
     * @function
     * @param {Object} element, element to format.
     * @return {Object} Object well formatted.
     * @private
     */
    _formatElementFromResearch: {
        value: function (element) {
            return {
                name: (element.name || ''),
                version: (element.version || ''),
                description: (element.description || '')
            };
        }
    },

    /**
     * Used when the property limit has been set, represents the results number.
     * @type {number}
     * @default -1
     * @private
     */
    _iterator: {
        value: -1,
        writable: true
    },

    _limit: {
        value : false,
        writable: true
    },

    /**
     * Indicates if a limit has been set.
     * @type {boolean}
     * @default false
     * @return {boolean}
     */
    limit: {
        set: function (value) {
            this._iterator = (typeof value === 'number' && value > 0) ? value : -1;
            this._limit = (this._iterator > 0);
        },
        get: function () {
            return this._limit;
        }
    }

});
