/*global process,__dirname */

var listCommand = require('./package-manager-library/list-command').listCommand,
    viewCommand = require('./package-manager-library/view-command').viewCommand,
    searchCommand = require('./package-manager-library/search-command').searchCommand,
    installCommand = require('./package-manager-library/install-command').installCommand,
    removeCommand = require('./package-manager-library/remove-command').removeCommand,
    outDatedCommand = require('./package-manager-library/outdated-command').outDatedCommand,
    PackageManagerDB = require('./package-manager-library/package-manager-database').PackageManagerDB,
    npm = require("npm"),
    Path = require("path"),
    Q = require("q");

/*
 * Hack that adds a path into the environment variable $PATH,
 * in order to allow the shell to find the npm command.
 */

process.env.PATH += ":" +  Path.join(__dirname, "..", "node_modules", ".bin");

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

    npm.prefix = projectUrl; // if the project url has changed.
    return true;
}

function loadDB (supportUrl) {
    return PackageManagerDB.load(supportUrl);
}

exports.loadPackageManager = function (projectUrl, supportUrl) {
    if(loadNpm(projectUrl)) {
        return loadDB(supportUrl).then(function () {
            return true;
        });
    }
    return Q(false);
};

exports.listDependencies = function (where) {
    return Q.invoke(listCommand, "run", where, true);
};

exports.viewDependency = function (dependency) {
    return Q.invoke(viewCommand, "run", dependency);
};

exports.searchModules = function (request) {
    return Q.invoke(searchCommand, "run", request);
};

exports.installDependency = function (request) {
    return Q.invoke(installCommand, "run", request, false);
};

exports.removeDependency = function (name, where) {
    return Q.invoke(removeCommand, "run", name, where);
};

exports.getOutdatedDependencies = function () {
    return Q.invoke(outDatedCommand, "run");
};
