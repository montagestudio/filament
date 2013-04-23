var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    MarkdownDocument = require("core/markdown-document").MarkdownDocument;

var Extension = exports.Extension = Montage.create(CoreExtension, {

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/\.md\/?$/).test(fileUrl);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {
            projectController.registerUrlMatcherForDocumentType(this.editorFileMatchFunction, MarkdownDocument);
            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {
            projectController.unregisterUrlMatcherForDocumentType(this.editorFileMatchFunction, MarkdownDocument);
            return Promise.resolve(this);
        }
    }

});
Extension.extensionRequire = require;
