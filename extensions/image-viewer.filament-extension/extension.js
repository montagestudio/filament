var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    ImageDocument = require("core/image-document").ImageDocument;

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/\.jpg|png|gif\/?$/).test(fileUrl);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {
            projectController.registerUrlMatcherForDocumentType(this.editorFileMatchFunction, ImageDocument);
            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {
            projectController.unregisterUrlMatcherForDocumentType(this.editorFileMatchFunction, ImageDocument);
            return Promise.resolve(this);
        }
    }

});