var PATH = require("path"),
    URL = require('url'),
    FS = require('fs');

/*
    allowedFileTypes

    called when the uer open the Open or Save panel
    returns an array of file types (extension or UTI) that filament will accept to open
*/
exports.allowedFileTypes = function(object) {
    var response = {types: []};

    if (object.mode === "open") {
        response.types = ["public.folder", "reel"];
    }

    return response;
};

/*
    validateFileURL

    called to validate a file URL (url) before opening it
    returns result=true or result=false and an error
*/
exports.validateFileURL = function(object) {
    var filePath = PATH.normalize(decodeURI(URL.parse(object.url).path));

    var response = {
        result: false,
        error: "This folder is not a valid package or application."
    };

    try {
        if (FS.statSync(filePath).isDirectory()) {
            var packagePath = findPackage(filePath);

            if (packagePath) {
                response.result = true;
                response.error = null;
            }
            return response;
        } else {
            // For now, accept any type of files...
            response.result = true;
            response.error = null;
            return response;
        }
    } catch(ex) {
        console.log("ERROR:", ex);
        return response;
    }
};

/*
    rootURLForFileURL

    called to retrieve the root URL of a File URL or null if it's not a valid document
*/
exports.rootURLForFileURL = function(object) {
    var filePath = PATH.normalize(URL.parse(object.url).path),
        packagePath = findPackage(filePath);

    if (packagePath) {
        return "file://" + PATH.join(packagePath, "..");
    }

    return null;
};

exports.aboutPageInfo = function() {
    return {url: "http://client/about/index.html", width:906, height:540, showToolbar: false};
};

exports.welcomePageInfo = function() {
    return {url: "http://client/welcome/index.html", width:906, height:540};
};

exports.preferencesPageInfo = function() {
    return {url: "http://client/preferences/index.html", width:906, height:540};
};

exports.previewPageInfo = function() {
    return {url: "http://client/preview/index.html"};
};

exports.menusAddOns = function() {
    return [
        {
            location: {"replace": "newDocument"},
            items: [
                {
                    title: "Application…",
                    enabled: true,
                    keyEquivalent: "command+N",
                    identifier: "newApplication",
                    action: {openDocument: {type: "application"}}
                },
                {
                    title: "Component…",
                    enabled: false,
                    keyEquivalent: "command+shift+N",
                    identifier: "newComponent"
                },
                {
                    title: "Module…",
                    enabled: false,
                    keyEquivalent: "command+control+shift+N",
                    identifier: "newModule"
                }
            ]
        },

        {
            title: "Documentation and API Reference",
            identifier: "help",
            keyEquivalent: "command+option+?",
            location: {insertBefore: "6.1"},
            action: {openWindow: {url:"http://client/docs/index.html", width:650, height:800, canResize:true, showToolbar:true, canOpenMultiple: false}}
        }
    ];
};


// Private utilities functions

var findPackage = function(parentPath) {
    if (FS.existsSync(PATH.join(parentPath, "package.json"))) {
        return PATH.join(parentPath, "package.json");
    } else if ("/" === parentPath) {
        return null;
    } else if (/*PATH.extname(path).toLocaleString() === ".reel"*/true) {
        return findPackage(PATH.normalize(PATH.join(parentPath, "..")));
    }

    return null;
};
