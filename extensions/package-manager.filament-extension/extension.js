var CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    PackageDocument = require("core/package-document").PackageDocument;

exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/\/package\.json\/?$/).test(fileUrl);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {
            PackageDocument.sharedProjectController = projectController;
            projectController.registerUrlMatcherForDocumentType(this.editorFileMatchFunction, PackageDocument);
            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {
            PackageDocument.sharedProjectController = null;
            projectController.unregisterUrlMatcherForDocumentType(this.editorFileMatchFunction, PackageDocument);
            return Promise.resolve(this);
        }
    }

});
