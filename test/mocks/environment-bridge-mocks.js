var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    menuMock = require("./menu-mocks").menuMock,
    menuItemMock = require("./menu-mocks").menuItemMock;

var Bridge = Montage.specialize({

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
    },

    projectInfo: {
        value: function (url) {
            return Promise.resolve({packageUrl: "projectUrl", dependencies: []});
        }
    },

    MenuItem: {
        value: function() {
            return menuItemMock();
        }
    }

});

var promiseFunction = function (promise) {
    return function () {
        return promise;
    };
};

/*jshint maxcomplexity:false */
exports.environmentBridgeMock = function (options) {
    var bridge = Bridge.create(),
        watchPromise = Promise.resolve(),
        listTreePromise = Promise.resolve(),
        listAssetAtUrl = Promise.resolve(),
        detectMimeTypeAtUrl = Promise.resolve(),
        listPromise = Promise.resolve(),
        componentsInPackagePromise = Promise.resolve(),
        registerPreviewPromise = Promise.resolve(),
        launchPreviewPromise = Promise.resolve(),
        promptForSavePromise = Promise.resolve(),
        getExtensionsAtPromise = Promise([]),
        readPromise = Promise("{}"),
        mainMenu = menuMock();

    Object.keys(options).forEach(function (key) {
        bridge[key] = options[key];
    });

    // Properly set expected promises
    bridge.mainMenu = Promise.resolve(options.mainMenu || mainMenu);
    bridge.availableExtensions = Promise.resolve(options.extensionUrls || []);
    bridge.getExtensionsAt = options.getExtensionsAt || promiseFunction(getExtensionsAtPromise);

    bridge.read = options.read || promiseFunction(readPromise);
    bridge.listTreeAtUrl = options.listTreeAtUrl || promiseFunction(listTreePromise);
    bridge.listAssetAtUrl = options.listAssetAtUrl || promiseFunction(listAssetAtUrl);
    bridge.detectMimeTypeAtUrl = options.detectMimeTypeAtUrl || promiseFunction(detectMimeTypeAtUrl);
    bridge.list = options.list || promiseFunction(listPromise);
    bridge.watch = options.watch || promiseFunction(watchPromise);
    bridge.componentsInPackage = options.componentsInPackage || promiseFunction(componentsInPackagePromise);
    bridge.registerPreview = options.registerPreview || promiseFunction(registerPreviewPromise);
    bridge.launchPreview = options.launchPreview || promiseFunction(launchPreviewPromise);
    bridge.promptForSave = options.promptForSave || promiseFunction(promptForSavePromise);

    return bridge;
};
