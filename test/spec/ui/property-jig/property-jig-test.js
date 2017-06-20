var TestController = require("montage-testing/test-controller").TestController,
    Promise = require("montage/core/promise").Promise;

exports.PropertyJigTest = TestController.specialize({

    propertyJig: {
        value: null
    },

    editingDocument: {
        value: {
            setOwnedObjectProperty: function (proxy, property, value) {

            },
            defineOwnedObjectBinding: function (proxy, targetPath, oneway, sourcePath, converter) {
                return Promise.resolve();
            },
            updateOwnedObjectBinding: function (proxy, existingBinding, targetpath, oneway, sourcePath, converter) {
                return Promise.resolve();
            },
        }
    }
});
