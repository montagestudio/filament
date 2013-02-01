var Montage = require("montage/core/core").Montage,
    Extension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    FlowEditorController = require("flow-editor/core/controller").Controller;

Extension = exports.Extension = Montage.create(Extension, {

    editorObjectMatchFunction: {
        enumerable: false,
        value : function (object) {
            return object && object.prototype && (/montage\/ui\/flow\.reel/).test(object.prototype);
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
