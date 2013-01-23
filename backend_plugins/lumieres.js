var path = require("path"),
    fs = require("fs"),
    minitCreate = require("minit/lib/create").create,
    Q = require("q"),
    npm = require("npm"),
    watchr = require("watchr");

exports.getPlugins = function() {
    var result = [],
        parentPath = path.join(global.clientPath, "plugins");

    if (fs.existsSync(parentPath)) {
        var list = fs.readdirSync(parentPath);

        for (var i in list) {
            var fileName = list[i];
            // For now accept any file that ends with .filament-plugin
            if (path.extname(fileName).toLowerCase() == ".filament-plugin") {
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

exports.watch = function (path, changeHandler) {
    //TODO make sure we return whatever watcher handle we need to stop watching, probably
    return Q.invoke(watchr, "watch", {
        path: path,
        ignoreCommonPatterns: true,
        listeners: {
            change: function(changeType, filePath, fileCurrentStat, filePreviousStat) {
                changeHandler.invoke("handleChange", changeType, filePath);
            }
        }
    });
};