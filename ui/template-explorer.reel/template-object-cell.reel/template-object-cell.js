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

            // Allow event button to be dragged as a reference ot this as an eventTarget
            var eventButton = this.templateObjects.addListenerButton.element;
            eventButton.addEventListener("dragstart", this, false);

            //Allow dropping object references on the event button
            eventButton.addEventListener("dragover", this, false);
            eventButton.addEventListener("drop", this, false);

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
                listenButton = this.templateObjects.addListenerButton.element,
                elementField = this._templateObjectElementField;

            //Accept:
            // - all events
            // - objects, if targeting the listenButton
            // - elements, if targetting the element field
            if (!availableTypes) {
                event.dataTransfer.dropEffect = "none";
            } else if (availableTypes.has(MimeTypes.MONTAGE_EVENT_TARGET) ||
                (availableTypes.has(MimeTypes.SERIALIZATION_OBJECT_LABEL) && (target === listenButton || listenButton.contains(target))) ||
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
                listenButton = this.templateObjects.addListenerButton.element,
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

            // Accept objects dropped on listener button
            } else if (availableTypes.has(MimeTypes.SERIALIZATION_OBJECT_LABEL)) {

                event.stopPropagation();
                var listenerLabel= event.dataTransfer.getData(MimeTypes.SERIALIZATION_OBJECT_LABEL);
                listenerModel = Object.create(null);
                listenerModel.targetObject = this.templateObject;
                listenerModel.listener = this.templateObject.editingDocument.editingProxyMap[listenerLabel];

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
    },

    handleDragstart: {
        value: function (evt) {
            var target = evt.target,
                listenerButtonElement = this.templateObjects.addListenerButton.element,
                transfer = event.dataTransfer;

            if (target === listenerButtonElement) {
                transfer.effectAllowed = 'all';

                var eventType = "action"; //TODO allow this to be inferred from somewhere
                var transferObject = {
                    targetLabel: this.templateObject.label,
                    eventType: eventType
                };

                transfer.setData(MimeTypes.MONTAGE_EVENT_TARGET, JSON.stringify(transferObject));
                transfer.setData("text/plain", eventType);
            }
        }
    }

});
