var listCommand = require('./package-manager-library/list-command').listCommand,
    viewCommand = require('./package-manager-library/view-command').viewCommand,
    searchCommand = require('./package-manager-library/search-command').searchCommand,
    installCommand = require('./package-manager-library/install-command').installCommand,
    removeCommand = require('./package-manager-library/remove-command').removeCommand,
    Q = require("q");

exports.listDependencies = function (where) {
    return Q.invoke(listCommand, "run", where, true);
};

exports.viewDependency = function (dependency) {
    return Q.invoke(viewCommand, "run", dependency);
};

exports.searchModules = function (request) {
    return Q.invoke(searchCommand, "run", request);
};

exports.installDependency = function (request, where) {
    return Q.invoke(installCommand, "run", request, where, false);
};

exports.removeDependency = function (name, where) {
    return Q.invoke(removeCommand, "run", name, where);
};
