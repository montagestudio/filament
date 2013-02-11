var Montage = require("montage/core/core").Montage,
    Extension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    BlueprintEditor = require("ui/blueprint-editor.reel").BlueprintEditor;

var Extension = exports.Extension = Montage.create(Extension, {

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/blueprint\.json\/?$/).test(fileUrl);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {

            viewController.registerEditorTypeForFileTypeMatcher(BlueprintEditor, this.editorFileMatchFunction);

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
