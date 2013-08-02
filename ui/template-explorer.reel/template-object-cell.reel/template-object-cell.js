/**
    @module "ui/template-object-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    MimeTypes = require("core/mime-types");

var CLASS_PREFIX = "TemplateObjectCell";

/**
    Description TODO
    @class module:"ui/template-object-cell.reel".TemplateObjectCell
    @extends module:montage/ui/component.Component
*/
exports.TemplateObjectCell = Montage.create(Component, /** @lends module:"ui/template-object-cell.reel".TemplateObjectCell# */ {

    constructor: {
        value: function TemplateObjectCell() {
            this.super();
            this.addPathChangeListener("x", this, "scheduleDraw");
            this.addPathChangeListener("y", this, "scheduleDraw");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            // Allow proxyIcon to be dragged as an object reference
            var icon = this.templateObjects.icon.element;
            icon.addEventListener("dragstart", this, false);

            // Allow event button to be dragged as a reference ot this as an eventTarget
            var eventButton = this.templateObjects.listenButton.element;
            eventButton.addEventListener("dragstart", this, false);

            //Allow dropping object references on the event button
            eventButton.addEventListener("dragover", this, false);
            eventButton.addEventListener("drop", this, false);

            // Allow dropping events anywhere on the card
            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("drop", this, false);

            // Allow dropping element references onto the card (in the right area)
            this._templateObjectTagEl.addEventListener("dragover", this, false);
            this._templateObjectTagEl.addEventListener("drop", this, false);
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

    x: {
        value: null
    },

    y: {
        value: null
    },

    scheduleDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleDragstart: {
        value: function (evt) {
            if (evt.target === this.templateObjects.icon.element) {
                event.dataTransfer.setData(MimeTypes.SERIALIZATION_OBJECT_LABEL, this.templateObject.label);
                event.dataTransfer.setData("text/plain", "@" + this.templateObject.label);

            } else if (evt.target === this.templateObjects.listenButton.element) {
                event.dataTransfer.effectAllowed = 'all';

                var eventType = "action"; //TODO allow this to be inferred from somewhere
                var transferObject = {
                    targetLabel: this.templateObject.label,
                    eventType: eventType
                };

                event.dataTransfer.setData(MimeTypes.MONTAGE_EVENT_TARGET, JSON.stringify(transferObject));
                event.dataTransfer.setData("text/plain", eventType);
            }
        }
    },

    handleTranslateStart: {
        value: function (evt) {
            this.templateObjects.translateComposer.translateX = this.x;
            this.templateObjects.translateComposer.translateY = this.y;
            this.classList.add(CLASS_PREFIX + "--dragging");
        }
    },

    handleTranslateEnd: {
        value: function() {
            this.classList.remove(CLASS_PREFIX + "--dragging");
        }
    },

    handleTranslate: {
        value: function (evt) {
            this.x = evt.translateX;
            this.y = evt.translateY;
        }
    },

    handleDragover: {
        value: function (event) {
            var types = event.dataTransfer.types,
                target = event.target,
                listenButton = this.templateObjects.listenButton.element;

            if (!types) {
                event.dataTransfer.dropEffect = "none";
            } else if (types.has(MimeTypes.MONTAGE_EVENT_TARGET) ||
                (types.has(MimeTypes.SERIALIZATION_OBJECT_LABEL) && (target === listenButton || listenButton.contains(target))) ||
                (target === this._templateObjectTagEl &&
                    types.has(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) ||
                    types.has(MimeTypes.MONTAGE_TEMPLATE_XPATH))) {

                // allows us to drop
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "link";
            }
        }
    },

    handleDrop: {
        value: function (event) {
            event.stopPropagation();

            //TODO also check target's when necessary just to be safe

            if (event.dataTransfer.types.has(MimeTypes.MONTAGE_EVENT_TARGET)) {
                var eventTargetData = JSON.parse(event.dataTransfer.getData(MimeTypes.MONTAGE_EVENT_TARGET));
                var listenerModel = Object.create(null);
                listenerModel.targetObject = this.templateObject.editingDocument.editingProxyMap[eventTargetData.targetLabel];
                listenerModel.type = eventTargetData.eventType;
                listenerModel.listener = this.templateObject;

                this.dispatchEventNamed("addListenerForObject", true, false, {
                    listenerModel: listenerModel
                });

            } else if (event.dataTransfer.types.has(MimeTypes.SERIALIZATION_OBJECT_LABEL)) {
                var listenerLabel= event.dataTransfer.getData(MimeTypes.SERIALIZATION_OBJECT_LABEL);
                var listenerModel = Object.create(null);
                listenerModel.targetObject = this.templateObject;
                listenerModel.listener = this.templateObject.editingDocument.editingProxyMap[listenerLabel];

                this.dispatchEventNamed("addListenerForObject", true, false, {
                    listenerModel: listenerModel
                });

            } else {
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

    draw: {
        value: function () {
            var x = this.x ? this.x : 0,
                y = this.y ? this.y : 0;

            this.element.style.webkitTransform = "translate3d(" + x + "px," + y + "px, 0)";
        }
    },

    handleBindButtonAction: {
        value: function(event) {
            var bindingModel = Object.create(null);
            bindingModel.targetObject = this.templateObject;
            bindingModel.targetPath = "";
            bindingModel.oneway = true;
            bindingModel.sourcePath = "";

            this.dispatchEventNamed("editBindingForObject", true, false, {
                bindingModel: bindingModel
            });
        }
    },

    handleListenButtonAction: {
        value: function(event) {
            var listenerModel = Object.create(null);
            listenerModel.targetObject = this.templateObject;

            this.dispatchEventNamed("addListenerForObject", true, false, {
                listenerModel: listenerModel
            });
        }
    }

});
