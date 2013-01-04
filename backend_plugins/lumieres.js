var path = require("path"),
    fs = require("fs"),
    minitCreate = require("minit/lib/create").create,
    Q = require("q"),
    npm = require("npm");

exports.getPlugins = function() {
    var result = [],
        parentPath = path.join(global.clientPath, "plugins");

    if (fs.existsSync(parentPath)) {
        var list = fs.readdirSync(parentPath);

        for (var i in list) {
            var fileName = list[i];
            // For now accept any file that ends with .js
            if (path.extname(fileName).toLowerCase() == ".js") {
                result.push("fs:/" + path.join(parentPath, fileName));
            }
        }
    }

    return result;
};

exports.createApplication = function(name, packageHome) {
    return minitCreate("app", {name: name, "packageHome": packageHome});
};

exports.createComponent = function(name, packageHome) {
    return minitCreate("component", {name: name, "packageHome": packageHome});
};

exports.installDependencies = function (config) {
    return Q.ninvoke(npm, "load", (config || null))
        .then(function (loadedNpm) {
            return Q.ninvoke(loadedNpm.commands, "install");
        });
};