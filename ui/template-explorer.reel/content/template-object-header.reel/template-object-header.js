/**
 * @module ./template-object-header.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    RichTextEditor = require("matte/ui/rich-text-editor/rich-text-editor.reel").RichTextEditor,
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

            /*
            Two attempts to try to " bind the undoManager property in the declaration where you setup the editor."
            */
            if (trycreate) {
                var commentsText = RichTextEditor.create();
                commentsText.element = document.getElementById("templateObjectComment");
                commentsText.undoManager = {
                    enumerable: true,
                    get: function() {
                        return this.ownerComponent.templateObject._editingDocument.undoManager;
                    },
                    set: function(value) {
                        this._undoManager = this.ownerComponent.templateObject._editingDocument.undoManager;
                    }
                };
            } else {
                var commentsText = RichTextEditor.specialize({
                    undoManager: {
                        enumerable: true,
                        get: function() {
                            return this.templateObject._editingDocument.undoManager;
                        },
                        set: function(value) {
                            this._undoManager = this.templateObject._editingDocument.undoManager;
                        }
                    }
                });
                commentsText.element = document.getElementById("templateObjectComment");
            }

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
    }

});
