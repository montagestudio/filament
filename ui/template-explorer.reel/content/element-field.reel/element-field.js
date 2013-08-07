/**
 * @module ./element-field.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class ElementField
 * @extends Component
 */
exports.ElementField = Component.specialize(/** @lends ElementField# */ {

    constructor: {
        value: function ElementField() {
            this.super();
        }
    },

    templateObject: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("drop", this, false);
        }
    },

    handleDragover: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types;

            if (!availableTypes) {
                event.dataTransfer.dropEffect = "none";
            } else if (availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) || availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_XPATH)) {

                // allows us to drop
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "link";
            }
        }
    },

    handleDrop: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types,
                listenerModel;

            if (availableTypes &&
                (availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) ||
                availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_XPATH))) {

                event.stopPropagation();
                var montageId = event.dataTransfer.getData(MimeTypes.MONTAGE_TEMPLATE_ELEMENT);
                var templateObject = this.templateObject,
                    editingDocument = templateObject.editingDocument;

                if (!montageId) {
                    var xpath = event.dataTransfer.getData(MimeTypes.MONTAGE_TEMPLATE_XPATH);
                    // get element from template
                    var element = editingDocument.htmlDocument.evaluate(
                        xpath,
                        editingDocument.htmlDocument,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    // get node proxy
                    var nodeProxy = editingDocument.nodeProxyForNode(element);
                    // generate montageId
                    montageId = editingDocument.createMontageIdForProxy(templateObject.label, templateObject.moduleId, nodeProxy);
                }

                editingDocument.setOwnedObjectElement(templateObject, montageId);
                editingDocument.editor.refresh();
            }
        }
    }
});