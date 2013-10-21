/**
 * @module ./binding-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    ObjectLabelConverter = require("core/object-label-converter").ObjectLabelConverter,
    MimeTypes = require("core/mime-types");


/**
 * @class BindingsExplorer
 * @extends Component
 */
exports.BindingExplorer = Component.specialize( /** @lends BindingsExplorer# */ {
    constructor: {
        value: function BindingExplorer() {
            this.super();
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (!firstTime) {
                return;
            }
            this.defineBinding("classList.has('AddElement--dropTarget')", {"<-": "isDropTarget"});

            var element = this.element.querySelector("[data-montage-id=addButton]");
            element.addEventListener("dragover", this, false);
            element.addEventListener("dragenter", this, false);
            element.addEventListener("dragleave", this, false);
            element.addEventListener("drop", this, false);

        }
    },

    isDropTarget: {
        value: false
    },

    acceptsDrop: {
        value: function(event) {
            return event.dataTransfer.types && event.dataTransfer.types.has(MimeTypes.MONTAGE_BINDING);
        }
    },

    handleDragover: {
        enumerable: false,
        value: function(event) {
            if (this.acceptsDrop(event)) {
                event.stop();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function(event) {
            if (this.acceptsDrop(event)) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        enumerable: false,
        value: function(event) {
            this.isDropTarget = false;
            event.dataTransfer.dropEffect = "none";
        }
    },

    handleDrop: {
        enumerable: false,
        value: function(event) {
            if (!this.acceptsDrop) {
                return;
            }
            var data = event.dataTransfer.getData(MimeTypes.MONTAGE_BINDING),
                targetObject = this.ownerComponent.templateObject,
                // TODO: security issues?
                transferObject = JSON.parse(data),
                editingDocument = this.ownerComponent.ownerComponent.editingDocument,
                self = this,
                converter;
            var objectLabelConverter = new ObjectLabelConverter();
            if (transferObject.converterLabel) {
                objectLabelConverter.editingDocument = editingDocument;
                converter = objectLabelConverter.revert(transferObject.converterLabel);
            }
            editingDocument.defineOwnedObjectBinding(targetObject, transferObject.targetPath, transferObject.oneway, transferObject.sourcePath, converter);
            self.isDropTarget = false;
        }
    }
});