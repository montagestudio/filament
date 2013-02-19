var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    Viewer = require("ui/viewer.reel").Viewer;

var Extension = exports.Extension = Montage.create(CoreExtension, {

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/\.jpg|png|gif\/?$/).test(fileUrl);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {

            viewController.registerEditorTypeForFileTypeMatcher(Viewer, this.editorFileMatchFunction);

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
