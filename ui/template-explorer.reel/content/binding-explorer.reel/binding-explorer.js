/**
 * @module ./binding-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");


/**
 * @class BindingsExplorer
 * @extends Component
 */
exports.BindingExplorer = Component.specialize(/** @lends BindingsExplorer# */ {
    constructor: {
        value: function BindingExplorer() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }
            this.defineBinding("classList.has('AddElement--dropTarget')", {"<-": "isDropTarget"});

            this._element.addEventListener("dragover", this, false);
            this._element.addEventListener("dragenter", this, false);
            this._element.addEventListener("dragleave", this, false);
            this._element.addEventListener("drop", this, false);

        }
    },

    isDropTarget: {
        value: false
    },

    acceptsDrop: {
        value: function (event) {
            return  event.dataTransfer.types 
                && event.dataTransfer.types.indexOf(MimeTypes.MONTAGE_BINDING) !== -1 ;
        }
    },

    handleDragover: {
        value: function (event) {
            if (this.acceptsDrop(event)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        value: function (event) {
            if (this.acceptsDrop(event)) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        value: function (event) {
            this.isDropTarget = false;
            event.dataTransfer.dropEffect = "none";
        }
    },

    handleDrop: {
        value: function (event) {
            console.log("drop", event.target);
            event.stop();
            // TODO: security issues?
            var data = event.dataTransfer.getData(MimeTypes.MONTAGE_BINDING),
                transferObject = JSON.parse(data),
                editingDocument = this.ownerComponent.ownerComponent.editingDocument,
                self = this;
            editingDocument.defineOwnedObjectBinding(this, transferObject.targetPath, transferObject.oneway, transferObject.sourcePath, transferObject.converter)
                .finally(function () {
                    self.isDropTarget = false;
                })
                .done();
        }
    }
});
