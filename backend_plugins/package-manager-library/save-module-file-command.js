var PackageManagerError = require("./core").PackageManagerError,
    PackageManagerTools = require("./package-manager-tools"),
    Tools = PackageManagerTools.PackageManagerTools,
    DependencyNames = PackageManagerTools.DependencyNames,
    Q = require("q"),
    FS = require("q-io/fs"),
    path = require("path"),

    SaveModuleFileCommand = function SaveModuleFileCommand() {},

    ERROR_DEPENDENCY_NAME_MISSING = 6000,
    ERROR_PATH_MISSING = 6001,
    ERROR_JSON_FILE_MISSING = 6002,
    ERROR_JSON_SHOWS_ERRORS = 6003;

/**
 * Prepares the SaveModuleFile Command, then invokes it.
 * Save modules according their types into a package.json file.
 * @function
 * @param {Object} listDependency array that contains dependency to saved within the package.json file.
 * @param {String} where is the path where the package.json file is located.
 * @return {Promise.<Object>} A promise for the modified package.json file.
 */
SaveModuleFileCommand.prototype.run = function (listDependency, where) {
    if (Array.isArray(listDependency) && listDependency.length > 0) {
        if (typeof where === "string" && where.length > 0) {
            return this._invokeCommand(listDependency, where);
        }

        return Q.reject(
            new PackageManagerError("The package.json file path is missing.", ERROR_PATH_MISSING)
        );
    }

    return Q.reject(
        new PackageManagerError("Dependency's information are missing", ERROR_DEPENDENCY_NAME_MISSING)
    );
};

SaveModuleFileCommand.prototype._invokeCommand = function (listDependency, where) {
    if (!/package\.json$/.test(where)) {
        where = path.join(where, 'package.json');
    }

    return FS.exists(where).then(function (exists) {
        if (exists) {
            return FS.read(where).then(function (raw) {
                var packageFile = null;

                try {
                    packageFile = JSON.parse(raw);
                } catch (exception) {
                    throw new PackageManagerError("The package.json file shows some errors", ERROR_JSON_SHOWS_ERRORS);
                }

                if (packageFile) {
                    for (var i = 0, length = listDependency.length; i < length; i++){
                        var dependency = listDependency[i],
                            version = dependency.version,
                            type = DependencyNames[dependency.type];

                        dependency.version = Tools.isGitUrl(version) || Tools.isVersionValid(version) ? version : '';
                        type = type ? type : DependencyNames[DependencyNames.dependencies];

                        if (!packageFile[type]) {
                            packageFile[type] = {};
                        }

                        packageFile[type][dependency.name] = dependency.version;
                    }

                    return FS.write(where, JSON.stringify(packageFile, null, 4));
                }
            });
        } else {
            throw new PackageManagerError("The package.json file doesn't not exist", ERROR_JSON_FILE_MISSING);
        }
    });
};

exports.saveModuleFileCommand = new SaveModuleFileCommand();
