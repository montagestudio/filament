var listCommand = require('./package-manager-library/list-command').listCommand,
    viewCommand = require('./package-manager-library/view-command').viewCommand,
    searchCommand = require('./package-manager-library/search-command').searchCommand,
    installCommand = require('./package-manager-library/install-command').installCommand,
    removeCommand = require('./package-manager-library/remove-command').removeCommand,
    outDatedCommand = require('./package-manager-library/outdated-command').outDatedCommand,
    npm = require("npm"),
    Q = require("q");

exports.loadNPM = function (where) {
    if (!npm.config.loaded) {
        return Q.ninvoke(npm, "load", {
            "loglevel": "silent",
            "prefix": where,
            "global": false
        }).then(function () {
            return npm.config.loaded;
        });
    }

    return Q(true);
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
