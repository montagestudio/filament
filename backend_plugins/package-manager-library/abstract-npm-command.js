var Q = require("q"),
    npm = require("npm");

exports.AbstractNpmCommand = Object.create(Object.prototype, {

    /**
     * Loads Npm.
     * @function
     * @private
     */
    _loadNpm: {
        value: function () {
            var self = this;
            return Q.ninvoke(npm, "load", null).then(function () {
                self._npmLoaded = true;
            });
        }
    },

    /**
     * Specifies if npm has been loaded.
     * @type {boolean}
     * @default false
     * @private
     */
    _npmLoaded: {
        value: false,
        writable: true
    }

});
