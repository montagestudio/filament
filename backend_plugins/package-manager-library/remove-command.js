var QFS = require("q-io/fs"),
    Tools = require("./package-manager-tools").PackageManagerTools,
    ERROR_DEPENDENCY_NAME_NOT_VALID = 4000,
    ERROR_PROJECT_PATH_NOT_VALID = 4001,
    ERROR_FS_PERMISSION = 4002,
    ERROR_DEPENDENCY_NOT_FOUND = 4003;

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

                if (!Tools.isNameValid(name)) {
                    throw new Error(ERROR_DEPENDENCY_NAME_NOT_VALID);
                }
            } else {
                throw new Error(ERROR_DEPENDENCY_NAME_NOT_VALID);
            }

            if (typeof where === 'string' && where.length > 0) {
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
                        throw new Error(ERROR_FS_PERMISSION);
                    } else if (error.errno === 34) {
                        throw new Error(ERROR_DEPENDENCY_NOT_FOUND);
                    } else {
                        throw error;
                    }
                });
            } else {
                throw new Error(ERROR_PROJECT_PATH_NOT_VALID);
            }
        }
    }

});
