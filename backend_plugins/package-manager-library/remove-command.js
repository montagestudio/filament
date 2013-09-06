var FS = require("q-io/fs"),
    path = require("path"),
    PackageManagerError = require("./core").PackageManagerError,
    Tools = require("./package-manager-tools").PackageManagerTools,
    RemoveCommand =  function RemoveCommand () {},

    ERROR_DEPENDENCY_NAME_NOT_VALID = 4000,
    ERROR_PROJECT_PATH_NOT_VALID = 4001,
    ERROR_FS_PERMISSION = 4002,
    ERROR_DEPENDENCY_NOT_FOUND = 4003;

RemoveCommand.prototype.run = function (name, where) {
    if (typeof name === 'string' && name.length > 0) {
        name = name.trim();

        if (!Tools.isNameValid(name)) {
            throw new PackageManagerError("Dependency named " + name + " is invalid", ERROR_DEPENDENCY_NAME_NOT_VALID);
        }
    } else {
        throw new PackageManagerError("Dependency name invalid", ERROR_DEPENDENCY_NAME_NOT_VALID);
    }

    if (typeof where === 'string' && where.length > 0) {
        where = path.join(where, '/');

        if (!(/\/node_modules\/$/).test(where)) {
            where = path.join(where, 'node_modules/');
        }

        return FS.removeTree(path.join(where, name)).then(function () {
            return { name: name };
        }, function (error) {
            if (error.errno === 3) {
                throw new PackageManagerError("Error filesystem permissions while removing the dependency named " + name, ERROR_FS_PERMISSION);
            } else if (error.errno === 34) {
                throw new PackageManagerError("Dependency named " + name + " is missing", ERROR_DEPENDENCY_NOT_FOUND);
            }
            throw error;
        });
    } else {
        throw new PackageManagerError("Dependency path invalid", ERROR_PROJECT_PATH_NOT_VALID);
    }
};

exports.removeCommand = new RemoveCommand();
