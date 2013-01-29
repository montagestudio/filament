var Montage = require("montage/core/core").Montage,
    Plugin = require("filament-plugin/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise,
    Viewer = require("ui/viewer.reel").Viewer;

var Plugin = exports.Plugin = Montage.create(Plugin, {

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
Plugin.pluginRequire = require;