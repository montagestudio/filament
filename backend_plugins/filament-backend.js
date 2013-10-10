/*global global,opener:true */
exports = module.exports = Object.create(require("adaptor/server/backend"));

var path = require("path"),
    minitCreate = require("minit/lib/create").create,
    Q = require("q"),
    npm = require("npm"),
    watchr = require("watchr"),
    PATH = require('path'),
    minimatch = require('minimatch');

exports.createApplication = function(name, packageHome) {
    return minitCreate("digit", {name: name, "packageHome": packageHome});
};

exports.createComponent = function(name, packageHome, destination) {
    destination = destination || ".";
    name = name.replace(/\.reel$/, "");
    return minitCreate("component", {name: name, packageHome: packageHome, destination: destination})
    .then(function (minitResults) {
        return minitResults.resultPath;
    });
};

exports.createModule = function(name, packageHome, destination) {
    destination = destination || ".";
    return minitCreate("module", {name: name, packageHome: packageHome, destination: destination})
    .then(function (minitResults) {
        return path.join(packageHome, destination, minitResults.name);
    });
};

exports.installDependencies = function (config) {
    return Q.ninvoke(npm, "load", (config || null))
        .then(function (loadedNpm) {
            return Q.ninvoke(loadedNpm.commands, "install");
        });
};

exports.watch = function (path, ignoreSubPaths, handlers) {
    var ignorePaths = ignoreSubPaths.map(function (ignorePath) {
        return PATH.resolve(path, ignorePath) + PATH.sep;
    });

    //TODO make sure we return whatever watcher handle we need to stop watching, probably
    return Q.invoke(watchr, "watch", {
        path: path,
        ignorePaths: ignorePaths,
        ignoreCommonPatterns: true,
        listeners: {
            change: function(changeType, filePath, fileCurrentStat, filePreviousStat) {

                //The client expects directories to hav a trailing slash
                var fileStat = fileCurrentStat || filePreviousStat;
                if (fileStat.isDirectory() && !/\/$/.test(filePath)) {
                    filePath += "/";
                }

                handlers.invoke("handleChange", changeType, "fs://localhost" + filePath, fileCurrentStat, filePreviousStat).fail(function (err) {
                    console.log(err);
                    throw err;
                }).done();
            },
            error: function(err) {
                handlers.invoke("handleError", err).then(function (err) {
                    console.log(err);
                    throw err;
                }).done();
            }
        }
    });
};
