/**
 * @module ./template-object-header.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    MimeTypes = require("core/mime-types");

/**
 * @class TemplateObjectHeader
 * @extends Component
 */
exports.TemplateObjectHeader = Component.specialize(/** @lends TemplateObjectHeader# */ {

    _referenceProxyElement: {
        value: null
    },

    constructor: {
        value: function TemplateObjectHeader() {
            this.super();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._referenceProxyElement.addEventListener("dragstart", this, false);
        }
    },

    handleDragstart: {
        value: function (evt) {
            var target = evt.target,
                referenceProxyElement = this._referenceProxyElement,
                transfer = event.dataTransfer;

            // Dragging the templateObject reference
            if (target === referenceProxyElement) {
                transfer.setData(MimeTypes.SERIALIZATION_OBJECT_LABEL, this.templateObject.label);
                transfer.setData("text/plain", "@" + this.templateObject.label);
            }
        }
    },

    handleEditCommentButtonAction: {
        value: function () {
            if(!this.templateObject.comment){
                this.templateObject.comment = this.templateObject._comment;
            }
        }
    },

    handleSaveCommentButtonAction: {
        value: function () {
            this.setUndoableComment(this.templateObject, this.templateObject.comment);
        }
    },

    handleDiscardCommentButtonAction: {
        value: function () {
            var discardedTyping = this.templateObject.comment;
            var lastSavedPoint = this.templateObject._comment;
            this.setUndoableComment(this.templateObject, discardedTyping);
            this.setUndoableComment(this.templateObject, lastSavedPoint);
        }
    },

    setUndoableComment: {
        value: function (proxy, value) {

            var undoManager = this.templateObject.editingDocument.undoManager,
                undoneValue = proxy._comment;

            if (value === undoneValue) {
                // The values are identical no need to do anything.
                return;
            }

            this.templateObject.comment = value;
            proxy._comment = value;
            undoManager.register("Set Comment", Promise.resolve([this.setUndoableComment, this, proxy, undoneValue]));
        
        }
    }

});
