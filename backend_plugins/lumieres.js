var path = require("path"),
    fs = require("fs"),
    minitCreate = require("minit/lib/create").create,
    Q = require("q"),
    npm = require("npm"),
    watchr = require("watchr"),
    QFS = require("q-io/fs"),
    PATH = require('path');

exports.getExtensions = function() {
    var result = [],
        parentPath = path.join(global.clientPath, "extensions");

    if (fs.existsSync(parentPath)) {
        var list = fs.readdirSync(parentPath);

        for (var i in list) {
            var fileName = list[i];
            // For now accept any file that ends with .filament-extension
            if (path.extname(fileName).toLowerCase() == ".filament-extension") {
                result.push("fs:/" + path.join(parentPath, fileName));
            }
        }
    }

    return result;
};

exports.createApplication = function(name, packageHome) {
    return minitCreate("app", {name: name, "packageHome": packageHome});
};

exports.createComponent = function(name, packageHome, destination) {
    destination = destination || ".";
    return minitCreate("component", {name: name, packageHome: packageHome, destination: destination});
};

exports.installDependencies = function (config) {
    return Q.ninvoke(npm, "load", (config || null))
        .then(function (loadedNpm) {
            return Q.ninvoke(loadedNpm.commands, "install");
        });
};

exports.watch = function (path, ignoreSubPaths, changeHandler) {
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
                changeHandler.invoke("handleChange", changeType, filePath);
            }
        }
    });
};

var ignoredPatterns  =[/\.git$/, /\.gitignore$/, /\.DS_Store$/, /\.idea$/, /\/node_modules\//],
    shallowPatterns  =[/\/node_modules$/],
    treeGuard = function (path) {

        var ignored, shallow;

        ignored = !!(ignoredPatterns.filter(function(pattern) {
            return pattern.test(path);
        }).length);

        if (ignored) {
            return null;
        } else {

            shallow = !!(shallowPatterns.filter(function(pattern) {
                return pattern.test(path);
            }).length);

            return !shallow;
        }
    };

exports.listTree = function (url) {
    return QFS.listTree(url, treeGuard).then(function (paths) {
        return Q.all(paths.map(function (path) {
            return QFS.stat(path).then(function (stat) {
               return {url: "fs:/" + path, stat: stat};
            });
        }));
    });
};
