var Q = require("q"),
    npm = require("npm");

exports.outDatedCommand = Object.create(Object.prototype, {

    /**
     * Prepares the outdated command, then invokes it.
     * @function
     * @return {Promise.<Object>} A promise with all outdated dependencies.
     */
    run: {
        value: function () {
            if (!npm.config.loaded) {
                throw new Error("NPM should be loaded first");
            }
            return this._invokeOutDatedCommand();
        }
    },

    /**
     * Invokes the outdated command.
     * @function
     * @return {Promise.<Object>} A promise with all outdated dependencies.
     * @private
     */
    _invokeOutDatedCommand: {
        value: function () {
            var self = this;
            return Q.ninvoke(npm.commands, "outdated", true).then(function (list) {
                return self._formatListDependenciesOutDated(list);
            });
        }
    },

    /**
     * Formats the information gathered from the NPM command.
     * @function
     * @param {Array} contains all outdated dependencies.
     * @return {list} contains all outdated dependencies well formated.
     * @private
     */
    _formatListDependenciesOutDated: {
        value: function (list) {
            var container = {},
                dir = npm.prefix;

            for (var i = 0, length = list.length; i < length; i++) {
                var data = list[i],
                    name = data[1],
                    current = data[2],
                    available = data[3],
                    where = data[0];

                if (where === dir && current !== available) {
                    container[name] = {
                        current: current,
                        available: available
                    };
                }
            }

            return container;
        }
    }

});
