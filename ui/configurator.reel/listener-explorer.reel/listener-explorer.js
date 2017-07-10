/**
 * @module ./listener-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    ObjectLabelConverter = require("core/object-label-converter").ObjectLabelConverter,
    application = require("montage/core/application").application,
    MimeTypes = require("core/mime-types");

/**
 * @class ListenerExplorer
 * @extends Component
 */
exports.ListenerExplorer = Component.specialize(/** @lends ListenerExplorer# */ {

    constructor: {
        value: function ListenerExplorer() {
            this.super();
        }
    },

    _willAcceptDrop: {
        value: false
    },

    acceptsDrop: {
        value: function(event) {
            return this.acceptsListenerDrop(event) || this.acceptsListenerLabelDrop(event);
        }
    },

    acceptsListenerLabelDrop: {
        value: function(event) {
            var availableTypes = event.dataTransfer.types,
                target = event.target,
                element = this.element;

            return availableTypes && availableTypes.has(MimeTypes.SERIALIZATION_OBJECT_LABEL) && (target === element || element.contains(target));
        }
    },

    _getMontageUUID: {
        value: function (types) {
            if (!types) {
                return false;
            }
            var uuid = false;
            types.forEach(function (type, i) {
                if (type.startsWith("x-montage-uuid")) {
                    uuid = type.split("/")[1].toUpperCase();
                }
            });
            return uuid;
        }
    },

    acceptsListenerDrop: {
        value: function(event) {
            var availableTypes = event.dataTransfer.types,
                target = event.target,
                element = this.element,
                uuid = this._getMontageUUID(availableTypes);
            if (!availableTypes || !availableTypes.has(MimeTypes.MONTAGE_LISTENER)) {
                return false;
            }

            if (uuid && (uuid  === this.templateObject.uuid)) {
                return false;
            }
            return target === element || element.contains(target);
        }
    },

    acceptsListenerCopy: {
        value: function(evt) {
            var addButton = this.element.querySelector("[data-montage-id=addListenerButton]");
            return  addButton && evt.target === addButton;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            application.addEventListener("editListenerForObject", this, false);

            // Allow event button to be dragged as a reference to this as an eventTarget
            var eventButton = this.templateObjects.addListenerButton.element;
            eventButton.addEventListener("dragstart", this, false);

            // Allow dropping object references onto this component
            var element = this.element;
            element.addEventListener("dragover", this, false);
            element.addEventListener("dragleave", this, false);
            element.addEventListener("drop", this, false);
        }
    },

    handleDragover: {
        value: function (event) {
            if (!this.acceptsDrop(event)) {
                event.dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
                return;
            }

            event.stop();
            this._willAcceptDrop = true;

            if (this.acceptsListenerDrop(event)) {
                if (this.acceptsListenerCopy(event)) {
                    event.dataTransfer.dropEffect = "copy";
                } else {
                    event.dataTransfer.dropEffect = "copy";
                }
            } else {
                event.dataTransfer.dropEffect = "copy";
            }
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (event) {
            var listenerModel,
                self = this;

            if (!this.acceptsDrop(event)) {
                return;
            }

            if (this.acceptsListenerLabelDrop(event)) {
                var listenerLabel = event.dataTransfer.getData(MimeTypes.SERIALIZATION_OBJECT_LABEL);
                listenerModel = Object.create(null);
                listenerModel.targetObject = this.templateObject;
                listenerModel.listener = this.templateObject.editingDocument.editingProxyMap[listenerLabel];

                this.dispatchEventNamed("addListenerForObject", true, false, {
                    listenerModel: listenerModel
                });
            } else if (this.acceptsListenerDrop(event)) {
                var data = event.dataTransfer.getData(MimeTypes.MONTAGE_LISTENER),
                    targetObject = this.templateObject,
                    // TODO: security issues?
                    transferObject = JSON.parse(data),
                    editingDocument = this.ownerComponent.ownerComponent.editingDocument,
                    objectLabelConverter,
                    listener;
                if (!transferObject.listenerLabel) {
                    return;
                }
                objectLabelConverter = new ObjectLabelConverter();
                objectLabelConverter.editingDocument = editingDocument;
                listener = objectLabelConverter.revert(transferObject.listenerLabel);

                var move = !self.acceptsListenerCopy(event);
                if (move) {
                    editingDocument.undoManager.openBatch("Move Listener");
                }

                editingDocument.addOwnedObjectEventListener(targetObject, transferObject.type, listener, transferObject.useCapture, transferObject.methodName)
                    .then(function() {
                        // If this is not a copy, remove the other listener from whence this came
                        if (move && transferObject.movedListenerIndex !== undefined && transferObject.movedListenerIndex > -1) {
                            var fromTargetObject = objectLabelConverter.revert(transferObject.targeObjectLabel);
                            if (fromTargetObject && fromTargetObject.listeners && fromTargetObject.listeners.length > transferObject.movedListenerIndex) {
                                var listener = fromTargetObject.listeners[transferObject.movedListenerIndex];
                                editingDocument.removeOwnedObjectEventListener(fromTargetObject, listener);
                            }
                        }
                        if (move) {
                            editingDocument.undoManager.closeBatch();
                        }
                    });
            }

            this._willAcceptDrop = false;
        }
    },

    handleDragstart: {
        value: function (event) {
            var target = event.target,
                listenerButtonElement = this.templateObjects.addListenerButton.element,
                transfer = event.dataTransfer;

            if (target === listenerButtonElement) {
                transfer.effectAllowed = "copyMove";

                var eventType = "action"; //TODO allow this to be inferred from somewhere
                var transferObject = {
                    targetLabel: this.templateObject.label,
                    eventType: eventType
                };

                transfer.setData(MimeTypes.MONTAGE_EVENT_TARGET, JSON.stringify(transferObject));
                transfer.setData("text/plain", eventType);
            }
        }
    },

    handleAddEventButtonAction: {
        value: function (evt) {
            var eventJig = this.eventCreator,
                overlay = this.eventOverlay;
            eventJig.existingEventNames = this.objectBlueprint.eventDescriptors.map(function (descriptor) {
                return descriptor.name;
            });
            overlay.show();
        }
    },

    handleEventCreatorCommit: {
        value: function (evt) {
            this.eventOverlay.hide();
        }
    },

    handleEventCreatorDiscard: {
        value: function (evt) {
            this.eventOverlay.hide();
        }
    },

    handleAddListenerButtonAction: {
        value: function (evt) {
            var listenerModel = Object.create(null);
            listenerModel.targetObject = evt.detail.get("targetObject");
            listenerModel.useCapture = false;

            this.dispatchEventNamed("addListenerForObject", true, false, {
                listenerModel: listenerModel
            });
        }
    },

    handleEditListenerForObject: {
        value: function (evt) {
            var listenerModel = evt.detail.listenerModel;
            var existingListener = evt.detail.existingListener;

            this.dispatchEventNamed("addListenerForObject", true, false, {
                listenerModel: listenerModel,
                existingListener: existingListener
            });
        }
    },

    handleRemoveListenerButtonAction: {
        value: function (evt) {
            evt.stop();
            var targetObject = evt.detail.get("targetObject");
            var listener = evt.detail.get("listener");
            this.editingDocument.removeOwnedObjectEventListener(targetObject, listener);
        }
    }
});
