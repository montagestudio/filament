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
    }

});
