/**
 * @module ./template-object-header.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;
var MimeTypes = require("core/mime-types");
var ReferenceSource = require("../../../reference/reference-source").ReferenceSource;

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
                // As the recipient
                var referenceSourceComposer = new ReferenceSource();
                referenceSourceComposer.delegate = this;
                this.addComposerForElement(referenceSourceComposer, this.element);

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
            this._commitComment(this.templateObjects.commentField.value);
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

            // Dragging the templateObject reference
            if (target === referenceProxyElement) {
                transfer.setData(MimeTypes.SERIALIZATION_OBJECT_LABEL, this.templateObject.label);
                transfer.setData("text/plain", "@" + this.templateObject.label);
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
    },

    handleDblclick: {
        value: function () {
            this.dispatchEventNamed("action", true ,true);
        }
    },

    // ReferenceSource delegate

    canProvideReference: {
        value: function (composer, session) {
//            return session.accepts(MimeTypes.SERIALIZATION_OBJECT_LABEL);
            return true;
        }
    },


    acceptingReference: {
        value: function () {
            this.classList.add("is-acceptingReference");
        }
    },


    resigningReference: {
        value: function () {
            this.classList.remove("is-acceptingReference");
        }
    },


    provideReference: {
        value: function () {
            this.classList.remove("is-acceptingReference");
            return this.templateObject.label;
        }
    }

});
