var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise;

var ExtensionController = exports.ExtensionController = Target.specialize({

    init: {
        value: function () {
            return this;
        }
    },

    loadExtensions: {
        value: function () {
            return Promise([]);
        }
    },

    loadExtension: {
        enumerable: false,
        value: function () {
            return Promise();
        }
    },

    activateExtension: {
        value: function () {
            return Promise();
        }
    },

    deactivateExtension: {
        value: function () {
            return Promise();
        }
    }

});


exports.extensionControllerMock = function (options) {
    var extensionController = new ExtensionController();

    if (options) {
        Object.keys(options).forEach(function (key) {
            extensionController[key] = options[key];
        });
    }

    return extensionController;
};
