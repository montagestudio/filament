var Montage = require("montage/core/core").Montage,
    Plugin = require("filament/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise,
    PackageEditor = require("ui/package-editor.reel").PackageEditor;

exports.Plugin = Montage.create(Plugin, {

    name: {
        get: function () {
            //TODO read the name from the package or something
            return "PackageManager";
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