/**
 * @module ./template-object-header.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
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

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.element.addEventListener("keyup", this, false);
            }
        }
    },

    handleKeyup: {
        value: function(evt) {
            var escape = 27;
            if (evt.keyCode === escape){
                this._discardComment();
            }
        }
    },

    acceptsActiveTarget: {
        value: true
    },

    surrendersActiveTarget: {
        value: function (newTarget) {
            // Apply changes when comment area looses focus
            if (this.reelProxy) {
                this._commitComment(this.templateObjects.commentField.value);
            }
            return true;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._referenceProxyElement.addEventListener("dragstart", this, false);

            this.templateObjects.icon.element.addEventListener("dblclick", this, false);
        }
    },

    handleDragstart: {
        value: function (evt) {
            var target = evt.target,
                referenceProxyElement = this._referenceProxyElement,
                transfer = evt.dataTransfer;

            // Dragging the proxy reference
            if (target === referenceProxyElement) {
                transfer.setData(MimeTypes.SERIALIZATION_OBJECT_LABEL, this.reelProxy.label);
                transfer.setData("text/plain", "@" + this.reelProxy.label);
                evt.dataTransfer.effectAllowed = "copyMove";
            }
        }
    },

    handleEditCommentButtonAction: {
        value: function () {
            this.isEditingComment = !this.isEditingComment;
        }
    },

    _commitComment: {
        value: function (commentValue) {
            var proxy = this.reelProxy;

            this.editingDocument.setOwnedObjectEditorMetadata(proxy, "comment", commentValue);
            this.isEditingComment = false;
        }
    },

    _discardComment: {
        value: function () {
            var commentField = this.templateObjects.commentField;
            commentField.value = this.reelProxy.getEditorMetadata('comment');
            this.isEditingComment = false;
        }
    },

    handleDblclick: {
        value: function () {
            this.dispatchEventNamed("action", true ,true);
        }
    }

});
