/**
 * @module ./listener-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    ObjectLabelConverter = require("core/object-label-converter").ObjectLabelConverter,
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

    acceptsListenerDrop: {
        value: function(event) {
            var availableTypes = event.dataTransfer.types,
                plusButton = this.element.querySelector("[data-montage-id=addListenerButton]");

            return availableTypes && availableTypes.has(MimeTypes.MONTAGE_LISTENER) && plusButton && event.target === plusButton;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            // Allow event button to be dragged as a reference ot this as an eventTarget
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
            event.dataTransfer.dropEffect = this.acceptsListenerDrop(event) ? "copy" : "link";
            this._willAcceptDrop = true;
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types,
                listenerModel;

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
                editingDocument.addOwnedObjectEventListener(targetObject, transferObject.type, listener, transferObject.useCapture, transferObject.methodName)
                    .then(function(){
                        // If this is a move, remove the other listener from whence this came
                        var stillMoveListener = !application.copyOnDragEvents;
                        if (stillMoveListener && transferObject.movedListenerIndex !== undefined && transferObject.movedListenerIndex > -1) {
                            var fromTargetObject = objectLabelConverter.revert(transferObject.targeObjectLabel);
                            if (fromTargetObject && fromTargetObject.listeners && fromTargetObject.listeners.length > transferObject.movedListenerIndex) {
                                var listener = fromTargetObject.listeners[transferObject.movedListenerIndex];
                                editingDocument.removeOwnedObjectEventListener(fromTargetObject, listener);
                            }
                        }
                    });
            }

            this._willAcceptDrop = false;
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
