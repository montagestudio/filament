var CoreExtension = require("filament-extension/core/extension").Extension,
    SceneEditorController = require("core/controller").SceneEditorController,
    Promise = require("montage/core/promise").Promise;

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    editorObjectMatchFunction: {
        enumerable: false,
        value : function (object) {
            return object && object.moduleId && (/mjs-volume\/runtime\/scene/).test(object.moduleId);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {
            viewController.registerModalEditorTypeForObjectTypeMatcher(SceneEditorController, this.editorObjectMatchFunction);

            var self = this;

            return Promise.all([
                this.installLibraryItems(projectController, "glTF-webgl-viewer"),
                this.installModuleIcons(projectController, "glTF-webgl-viewer"),
                this.installLibraryItems(projectController, "mjs-volume"),
                this.installModuleIcons(projectController, "mjs-volume")
            ]).then(function() { return self; });
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {
            viewController.unregisterModalEditorTypeForObjectTypeMatcher(this.editorObjectMatchFunction);

            var self = this;

            return Promise.all([
                this.uninstallLibraryItems(projectController, "glTF-webgl-viewer"),
                this.uninstallModuleIcons(projectController, "glTF-webgl-viewer"),
                this.uninstallLibraryItems(projectController, "mjs-volume"),
                this.uninstallModuleIcons(projectController, "mjs-volume")
            ]).then(function() { return self; });
        }
    }

});

Extension.packageLocation = require.location;
