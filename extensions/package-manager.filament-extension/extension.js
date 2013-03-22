var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    PackageDocument = require("core/package-document").PackageDocument;

var Extension = exports.Extension = Montage.create(CoreExtension, {

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/\/package\.json\/?$/).test(fileUrl);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {
            projectController.registerUrlMatcherForDocumentType(this.editorFileMatchFunction, PackageDocument);
            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {

            viewController.unregisterEditorTypeForFileTypeMatcher(this.editorFileMatchFunction);

            return Promise.resolve(this);
        }
    }

});
Extension.extensionRequire = require;
