var QFS = require("q-io/fs"),
    Tools = require("./package-manager-tools").PackageManagerTools;

exports.removeCommand = Object.create(Object.prototype, {

    /**
     * Invokes the remove command, then invokes it.
     * @function
     * @param {String} name, the dependency name to delete.
     * @param {String} where, the project app path.
     * @return {Promise.<Object>} Promise for the removed dependency.
     */
    run: {
        value: function (name, where) {
            if (typeof name === 'string' && name.length > 0) {
                name = name.trim();
            } else {
                throw new TypeError("The dependency name should be a string or not empty.");
            }

            if (typeof where === 'string' && where.length > 0 && Tools.isNameValid(name)) {
                if (where.charAt(where.length - 1) !== '/') {
                    where +=  '/';
                }

                if (!(/\/node_modules\/$/).test(where)) {
                    where += 'node_modules/';
                }

                return QFS.removeTree(where+name).then(function () {
					return { name: name };
                }, function (error) {
                    if (error.errno === 3) {
                        throw new Error('File system permission error while removing the ' + name + ' dependency.');
                    } else if (error.errno === 34) {
                        throw new Error('No dependency named ' + name + ' has been found.');
                    } else {
                        throw error;
                    }
                });
            } else {
                throw new Error('The path or dependency name are missing or invalid.');
            }
        }
    }

});
