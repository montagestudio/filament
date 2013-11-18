var Montage = require("montage").Montage;
var CoreExtension = require("filament-extension/core/extension").Extension;
var CodeEditorDocument = require("core/code-editor-document").CodeEditorDocument;
var Promise = require("montage/core/promise").Promise;


var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    editorFileMatchFunction:{
        enumerable:false,
        value:function (fileUrl) {
            return CodeEditorDocument.editorFileType(fileUrl) !== "text";
        }
    },

    application:{
        value:null
    },

    projectController:{
        value:null
    },

    activate:{
        value:function (application, projectController, viewController) {
            projectController.registerUrlMatcherForDocumentType(this.editorFileMatchFunction, CodeEditorDocument);
            var self = this;

            self.application = application;
            self.projectController = projectController;

            application.addEventListener("didOpenDocument", self, false);
            application.addEventListener("willCloseDocument", self, false);

            return Promise.resolve(self);
        }
    },

    deactivate:{
        value:function (application, projectController, viewController) {
            projectController.unregisterUrlMatcherForDocumentType(this.editorFileMatchFunction, CodeEditorDocument);
            var self = this;

            application.removeEventListener("didOpenDocument", self, false);
            application.removeEventListener("willCloseDocument", self, false);

            self.application = null;
            self.projectController = null;
            return Promise.resolve(self);
        }
    },

    handleMenuAction:{
        value:function (event) {
        }
    },

    handleDidOpenDocument:{
        value:function (evt) {
        }
    },

    handleWillCloseDocument:{
        value: function (evt) {
        }
    }

});