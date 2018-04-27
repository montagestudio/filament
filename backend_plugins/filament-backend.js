/* global global,unescape,module */
var minitCreate = require("minit/lib/create").create,
    Q = require("q"),
    Promise = require("montage/core/promise").Promise,
    npm = require("npm"),
    PATH = require('path');

module.exports = FilamentBackend;
function FilamentBackend (fs) {
    // Returned backend
    var backend = {};

    var NPM_CACHE_DIR_PROMISE = Promise.reject(new Error("npm cache directory not available. Call setup()"));

    backend.setup = function (firstLoad, server) {
        NPM_CACHE_DIR_PROMISE = server.application.invoke("specialFolderURL", "application-support")
        .then(function (info) {
            var path = unescape(info.url).replace("fs://localhost", "");
            return PATH.join(path, "npm-cache");
        });
        if (firstLoad) {
            // If this is the first load, then check if the npm-cache directory
            // exists, and if not copy our seeded cache there. This allows people
            // to create new apps more quickly and also when they have no
            // connection to the internet, because `montage` and deps are
            // already downloaded.
            return NPM_CACHE_DIR_PROMISE.then(function (npmCache) {
                return fs.exists(npmCache)
                .then(function (npmCacheExists) {
                    if (!npmCacheExists) {
                        console.log("Seeding npm-cache");
                        var seededCache = PATH.join(global.clientPath, "npm-cache");
                        return fs.copyTree(seededCache, npmCache);
                    }
                });
            });
        }
        return Promise.resolve();
    };

    backend.createApplication = function(name, packageHome) {
        return NPM_CACHE_DIR_PROMISE.then(function (NPM_CACHE_DIRECTORY) {
            return minitCreate("digit", {name: name, "packageHome": packageHome, npmCache: NPM_CACHE_DIRECTORY});
        });
    };

    backend.createComponent = function(name, packageHome, destination) {
        destination = destination || ".";
        name = name.replace(/\.reel$/, "");
        return minitCreate("component", {name: name, packageHome: packageHome, destination: destination})
        .then(function (minitResults) {
            return minitResults.resultPath;
        });
    };

    backend.createModule = function(name, packageHome, destination) {
        destination = destination || ".";
        return minitCreate("module", {name: name, packageHome: packageHome, destination: destination})
        .then(function (minitResults) {
            return PATH.join(packageHome, destination, minitResults.name);
        });
    };

    backend.installDependencies = function (config) {
        return Q.ninvoke(npm, "load", (config || null))
            .then(function (loadedNpm) {
                return Q.ninvoke(loadedNpm.commands, "install");
            });
    };

    return backend;
}
