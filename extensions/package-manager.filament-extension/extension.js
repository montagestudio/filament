var Montage = require("montage/core/core").Montage,
    Extension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    PackageEditor = require("ui/package-editor.reel").PackageEditor;

var Extension = exports.Extension = Montage.create(Extension, {

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/\/package\.json\/?$/).test(fileUrl);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {

            viewController.registerEditorTypeForFileTypeMatcher(PackageEditor, this.editorFileMatchFunction);

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
