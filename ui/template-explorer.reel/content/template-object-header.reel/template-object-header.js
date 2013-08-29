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

    isEditingComment: {
        value: false
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
            this.isEditingComment = !this.isEditingComment;
        }
    },

    handleSaveCommentButtonAction: {
        value: function () {
            this._commitComment(this.templateObjects.commentField.value);
        }
    },

    handleDiscardCommentButtonAction: {
        value: function () {
            this._discardComment();
        }
    },

    _commitComment: {
        value: function (commentValue) {
            var proxy = this.templateObject,
                editingDocument = proxy._editingDocument;

            editingDocument.setOwnedObjectEditorMetadata(proxy, "comment", commentValue);
            this.isEditingComment = false;
        }
    },

    _discardComment: {
        value: function () {
            var commentField = this.templateObjects.commentField;
            commentField.value = this.templateObject.getEditorMetadata('comment');
            this.isEditingComment = false;
        }
    }

});
