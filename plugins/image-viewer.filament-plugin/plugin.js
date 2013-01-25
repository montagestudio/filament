var Montage = require("montage/core/core").Montage,
    Plugin = require("filament/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise,
    Viewer = require("ui/viewer.reel").Viewer;

exports.Plugin = Montage.create(Plugin, {

    name: {
        get: function () {
            //TODO read the name from the package or something
            return "ImageViewer";
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