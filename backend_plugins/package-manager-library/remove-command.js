var FS = require("q-io/fs"),
    path = require("path"),
    Q = require("q"),
    PackageManagerError = require("./core").PackageManagerError,
    Tools = require("./package-manager-tools").PackageManagerTools,
    RemoveCommand = function RemoveCommand () {},

    ERROR_DEPENDENCY_NAME_NOT_VALID = 4000,
    ERROR_PROJECT_PATH_NOT_VALID = 4001,
    ERROR_FS_PERMISSION = 4002,
    ERROR_DEPENDENCY_NOT_FOUND = 4003;

/**
 * Remove a dependency on the filesystem.
 * @function
 * @param {String} dependencyName Dependency name.
 * @param {boolean} dependencyLocation represents the file system path where to operate.
 * @return {Promise.<Object>} Promise for the removed dependency.
 */
RemoveCommand.prototype.run = function (dependencyName, dependencyLocation) {
    if (typeof dependencyName === 'string' && dependencyName.length > 0) {

        if (typeof dependencyLocation === 'string' && dependencyLocation.length > 0) {
            dependencyName = dependencyName.trim();

            if (!(/\/node_modules$/).test(dependencyLocation)) {
                dependencyLocation = path.join(dependencyLocation, 'node_modules/');
            }

            return FS.removeTree(path.join(dependencyLocation, dependencyName)).then(function () {
                return { name: dependencyName };

            }, function (error) {
                if (error.errno === 3) {

                    var wrongPermission = "Error filesystem permissions while removing the dependency named " + dependencyName;
                    throw new PackageManagerError(wrongPermission, ERROR_FS_PERMISSION);

                } else if (error.errno === 34) {

                    var folderNotFound = "Dependency named " + dependencyName + "has not been found on the filesystem";
                    throw new PackageManagerError(folderNotFound, ERROR_DEPENDENCY_NOT_FOUND);
                }

                throw error;
            });
        }
        return Q.reject(new PackageManagerError("Dependency path invalid", ERROR_PROJECT_PATH_NOT_VALID));
    }
    return Q.reject(new PackageManagerError("Dependency name invalid", ERROR_DEPENDENCY_NAME_NOT_VALID));
};

exports.removeCommand = new RemoveCommand();
