var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    FlowEditorController = require("flow-editor/core/controller").Controller;

var Extension = exports.Extension = Montage.create(CoreExtension, {

    editorObjectMatchFunction: {
        enumerable: false,
        value : function (object) {
            return object && object.moduleId && (/matte\/ui\/flow\.reel/).test(object.moduleId);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {
            viewController.registerModalEditorTypeForObjectTypeMatcher(FlowEditorController, this.editorObjectMatchFunction);
            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {
            viewController.unregisterModalEditorTypeForObjectTypeMatcher(this.editorObjectMatchFunction);
            return Promise.resolve(this);
        }
    }

});
Extension.extensionRequire = require;
