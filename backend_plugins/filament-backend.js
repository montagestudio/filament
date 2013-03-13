var path = require("path"),
    fs = require("fs"),
    minitCreate = require("minit/lib/create").create,
    Q = require("q"),
    npm = require("npm"),
    watchr = require("watchr"),
    QFS = require("q-io/fs"),
    PATH = require('path'),
    minimatch = require('minimatch');

exports.getExtensions = function() {
    var extensionFolder = path.join(global.clientPath, "extensions");
    console.log("getExtensions from " + extensionFolder);
    return QFS.listTree(extensionFolder, function (filePath) {
            return path.extname(filePath).toLowerCase() == ".filament-extension" ? true : (filePath ==  extensionFolder ? false : null); // if false return null so directories aren't traversed
         }).then(function (filePaths) {
        return Q.all(filePaths.map(function (filePath) {
            return QFS.stat(filePath).then(function (stat) {
               return {url: "http://client/extensions" + filePath.substring(extensionFolder.length), stat: stat};
            });
        }));
    });
};

exports.createApplication = function(name, packageHome) {
    return minitCreate("app", {name: name, "packageHome": packageHome});
};

exports.createComponent = function(name, packageHome, destination) {
    destination = destination || ".";
    name = name.replace(/\.reel$/, "");
    return minitCreate("component", {name: name, packageHome: packageHome, destination: destination})
    .then(function () {
        return path.join(packageHome, destination, name);
    });
};

exports.createModule = function(name, packageHome, destination) {
    destination = destination || ".";
    return minitCreate("module", {name: name, packageHome: packageHome, destination: destination})
    .then(function () {
        return path.join(packageHome, destination, name);
    });
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

var guard = function (exclude) {
    exclude = exclude || [];
    var minimatchOpts = {matchBase: true};
    return function (path) {
        // make sure none of the excludes match
        return exclude.every(function (glob) {
            return !minimatch(path, glob, minimatchOpts);
        }) ? true : null; // if false return null so directories aren't traversed
    };
};

/**
 * Lists all the files in the given path except node_modules and dotfiles.
 * @param  {string} path An absolute path to a directory.
 * @return {Promise.<Array.<string>>} A promise for an array of paths.
 */
exports.listTree = function (path) {
    return QFS.listTree(path, guard([
            "node_modules",
            ".*"
        ])).then(function (paths) {
            return Q.all(paths.map(function (path) {
                return QFS.stat(path).then(function (stat) {
                    return {url: "fs://localhost" + path, stat: stat};
                });
            }));
        });
};

exports.list = function (path) {
    return QFS.list(path).then(function (filenames) {
        return Q.all(filenames.map(function (filename) {
            var fullPath = PATH.join(path, filename);
            return QFS.stat(fullPath).then(function (stat) {
                return {url: "fs://localhost" + fullPath, stat: stat};
            });
        }));
    });
};

/**
 * Lists all the files in a package except node_modules, dotfiles and files
 * matching the globs listed in the package.json "exclude" property.
 * @param  {string} path An absolute path to the package directory to list.
 * @return {Promise.<Array.<string>>} A promise for an array of paths.
 */
exports.listPackage = function (path) {
    var exclude = ["node_modules", ".*"];

    return QFS.read(PATH.join(path, "package.json")).then(function (contents) {
        var pkg = JSON.parse(contents);
        return guard(exclude.concat(pkg.exclude || []));
    }, function (err) {
        return guard(exclude);
    }).then(function (guard) {
        return QFS.listTree(path, guard).then(function (paths) {
            return Q.all(paths.map(function (path) {
                return QFS.stat(path).then(function (stat) {
                    return {url: "fs://localhost" + path, stat: stat};
                });
            }));
        });
    });
};
