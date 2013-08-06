/**
 @module "ui/template-object-cell.reel"
 @requires montage
 @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 Description TODO
 @class module:"ui/template-object-cell.reel".TemplateObjectCell
 @extends module:montage/ui/component.Component
 */
exports.TemplateObjectCell = Montage.create(Component, /** @lends module:"ui/template-object-cell.reel".TemplateObjectCell# */ {

    _templateObjectElementField: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            // Allow dropping events anywhere on the card
            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("drop", this, false);
        }
    },

    _templateObject: {
        value: null
    },
    templateObject: {
        get: function() {
            return this._templateObject;
        },
        set: function(value) {
            if (this._templateObject === value) {
                return;
            }
            this._templateObject = value;
            if (value) {
                var self = this;
                value.editingDocument.packageRequire.async(value.moduleId)
                    .get(value.exportName)
                    .then(function (object) {
                        self.hasElementProperty = !!Object.getPropertyDescriptor(object, "element");
                    }).fail(Function.noop);
            }

        }
    },

    hasElementProperty: {
        value: true
    },

    handleDragover: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types,
                target = event.target,
                elementField = this._templateObjectElementField;

            //Accept:
            // - all events
            // - elements, if targetting the element field
            if (!availableTypes) {
                event.dataTransfer.dropEffect = "none";
            } else if (availableTypes.has(MimeTypes.MONTAGE_EVENT_TARGET) ||
                ((target === elementField || elementField.contains(target)) &&
                    (availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) ||
                    availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_XPATH)))) {

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
                target = event.target,
                elementField = this._templateObjectElementField,
                listenerModel;

            // Always accept Events
            if (availableTypes.has(MimeTypes.MONTAGE_EVENT_TARGET)) {

                event.stopPropagation();
                var eventTargetData = JSON.parse(event.dataTransfer.getData(MimeTypes.MONTAGE_EVENT_TARGET));

                listenerModel = Object.create(null);
                listenerModel.targetObject = this.templateObject.editingDocument.editingProxyMap[eventTargetData.targetLabel];
                listenerModel.type = eventTargetData.eventType;
                listenerModel.listener = this.templateObject;

                this.dispatchEventNamed("addListenerForObject", true, false, {
                    listenerModel: listenerModel
                });

            // Accept elements dropped on element field
            } else if (availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) ||
                availableTypes.has(MimeTypes.MONTAGE_TEMPLATE_XPATH) &&
                (target === elementField || elementField.contains(target))) {

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
