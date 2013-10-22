/*global process,__dirname */

var listCommand = require('./package-manager-library/list-command').listCommand,
    viewCommand = require('./package-manager-library/view-command').viewCommand,
    searchCommand = require('./package-manager-library/search-command').searchCommand,
    installCommand = require('./package-manager-library/install-command').installCommand,
    removeCommand = require('./package-manager-library/remove-command').removeCommand,
    outDatedCommand = require('./package-manager-library/outdated-command').outDatedCommand,
    saveModuleFileCommand = require('./package-manager-library/save-module-file-command').saveModuleFileCommand,
    PackageManagerDB = require('./package-manager-library/package-manager-database').PackageManagerDB,
    npm = require("npm"),
    Path = require("path"),
    Q = require("q");

/*
 * Hack that adds a path into the environment variable $PATH,
 * in order to allow the shell to find the npm command.
 */

process.env.PATH += ":" +  Path.join(__dirname, "..", "node_modules", ".bin");

/**
 * Loads the NPM package.
 * @function
 * @param {String} projectUrl is a project path where NPM will operate.
 * @return {Promise.<Boolean>} Promise for the loading of NPM.
 */
function loadNpm (projectUrl) {
    if (!npm.config.loaded) {
        return Q.ninvoke(npm, "load", {
            "loglevel": "silent",
            "prefix": projectUrl,
            "global": false
        }).then(function () {
            return npm.config.loaded;
        });
    }

    npm.prefix = projectUrl; // if the project url has changed. (open a new project)

    return Q(true);
}

/**
 * Loads the sqlite3 Database. (keeps just the url)
 * @function
 * @param {String} applicationSupportUrl is the path of the Application Support folder.
 * @return {Promise.<Boolean>} Promise for the loading of the sqlite3 Database.
 */
function loadDB (applicationSupportUrl) {
    return PackageManagerDB.load(applicationSupportUrl);
}

/**
 * Loads several essential elements for the proper functioning of the PackageManager extension,
 * such as NPM and the sqlite3 database.
 * @function
 * @param {String} projectUrl is a project path where NPM will operate.
 * @param {String} applicationSupportUrl represents the path of the Application Support folder. (Database location)
 * @return {Promise.<Boolean>} Promise for the loading of the PackageManager extension.
 */
exports.loadPackageManager = function (projectUrl, applicationSupportUrl) {
    return loadNpm(projectUrl).then(function (npmLoaded) {
        if (npmLoaded) {
            return loadDB(applicationSupportUrl);
        }

        return Q(false);
    });
};

/**
 * Invokes the List Command that allows to list all dependencies of a lumieres project,
 * and eventually to find some errors related to them.
 * @function
 * @param {String} projectUrl is the project path where to operate.
 * @return {Promise.<Object>} Promise for a dependencies tree.
 */
exports.listDependencies = function (projectUrl) {
    return listCommand.run(projectUrl, true); // true => returns a light tree (contains just the "root" dependencies)
};

/**
 * Invokes the View Command [NPM] that will gather some information about a package.
 * @function
 * @param {String} requestPackage is a string that respects the following format: "packageName[@packageVersion]".
 * @return {Promise.<Object>} Promise for the requested package.
 */
exports.viewDependency = function (requestPackage) {
    return viewCommand.run(requestPackage);
};

/**
 * Invokes the Search Command that will try to find some packages according to the request.
 * @function
 * @param {String} requestPackageName is a string used to find some eventual packages.
 * @return {Promise.<Array>} Promise for the search result.
 */
exports.searchModules = function (requestPackageName) {
    return searchCommand.run(requestPackageName);
};

/**
 * Invokes the Install Command [NPM] that will install a package.
 * @function
 * @param {String} requestPackage is a string that respects the following format: "packageName[@packageVersion]".
 * @param {String} packageLocation represents a path where the package will be installed.
 * @return {Promise.<Object>} Promise for the installed package.
 */
exports.installDependency = function (requestPackage, packageLocation) {
    if (!npm.config.loaded) {
        return Q.reject(new Error("NPM should be loaded first"));
    }

    if (typeof packageLocation === "undefined") {
        packageLocation = npm.prefix;
    }

    // false => Returns just some information about the "root" package installed.
    return installCommand.run(requestPackage, packageLocation, false);
};

/**
 * Invokes the Remove Command that will uninstall a package.
 * @function
 * @param {String} packageName is the package name.
 * @param {String} packageLocation represents the location of the package to delete.
 * @return {Promise.<Object>} Promise for the removed package.
 */
exports.removeDependency = function (packageName, packageLocation) {
    return removeCommand.run(packageName, packageLocation);
};

/**
 * Invokes the Outdated Command [NPM] that will find all outdated packages
 * according to the current project's package.json file.
 * @function
 * @return {Promise.<Array>} Promise for the outdated packages.
 */
exports.getOutdatedDependencies = function () {
    return outDatedCommand.run();
};

/**
 * Will save a list of packages according their types into a package.json file.
 * @function
 * @param {Array} packageList is an array of dependency to save into a package.json file.
 * (each dependency contains its name, version and type)
 * @param {String} packageFileLocation represents where is located a package.json file.
 * @return {Promise} Promise for the package.json file modified.
 */
exports.saveModuleIntoFile = function (packageList, packageFileLocation) {
    return saveModuleFileCommand.run(packageList, packageFileLocation);
};
