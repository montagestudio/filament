var Montage = require("montage").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Promise = require("montage/core/promise").Promise;

var Bridge = Montage.create(EnvironmentBridge, {

    setDocumentDirtyState: {
        value: Function.noop
    },

    createComponent: {
        value: Function.noop
    },

    createModule: {
        value: Function.noop
    },

    convertBackendUrlToPath: {
        value: function (url) {
            return url;
        }
    }

});

var promiseFunction = function (promise) {
    return function () {
        return promise;
    };
};

exports.environmentBridgeMock = function (options) {
    var bridge = Bridge.create(),
        projectInfoPromise = Promise.resolve({packageUrl: "packageUrl", dependencies: []}),
        watchPromise = Promise.resolve(),
        listTreePromise = Promise.resolve(),
        componentsInPackagePromise = Promise.resolve(),
        registerPreviewPromise = Promise.resolve(),
        launchPreviewPromise = Promise.resolve(),
        promptForSavePromise = Promise.resolve();

    Object.keys(options).forEach(function (key) {
        bridge[key] = options[key];
    });

    // Properly set expected promises
    bridge.mainMenu = Promise.resolve(options.mainMenu || null);
    bridge.availableExtensions = Promise.resolve(options.extensionUrls || []);

    bridge.projectInfo = options.projectInfo || promiseFunction(projectInfoPromise);
    bridge.listTreeAtUrl = options.listTreeAtUrl || promiseFunction(listTreePromise);
    bridge.watch = options.watch || promiseFunction(watchPromise);
    bridge.componentsInPackage = options.componentsInPackage || promiseFunction(componentsInPackagePromise);
    bridge.registerPreview = options.registerPreview || promiseFunction(registerPreviewPromise);
    bridge.launchPreview = options.launchPreview || promiseFunction(launchPreviewPromise);
    bridge.promptForSave = options.promptForSave || promiseFunction(promptForSavePromise);

    return bridge;
};
