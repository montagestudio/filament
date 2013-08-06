/**
 * @module ./listener-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
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

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            // Allow event button to be dragged as a reference ot this as an eventTarget
            var eventButton = this.templateObjects.addListenerButton.element;
            eventButton.addEventListener("dragstart", this, false);

            // Allow dropping object references on the event button
            eventButton.addEventListener("dragover", this, false);
            eventButton.addEventListener("drop", this, false);
        }
    },

    handleDragover: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types,
                target = event.target,
                listenButton = this.templateObjects.addListenerButton.element;

            if (!availableTypes) {
                event.dataTransfer.dropEffect = "none";
            } else if (availableTypes.has(MimeTypes.SERIALIZATION_OBJECT_LABEL) && (target === listenButton || listenButton.contains(target))) {

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
                listenerModel;

            if (availableTypes.has(MimeTypes.SERIALIZATION_OBJECT_LABEL) && (target === listenButton || listenButton.contains(target))) {

                event.stopPropagation();
                var listenerLabel= event.dataTransfer.getData(MimeTypes.SERIALIZATION_OBJECT_LABEL);
                listenerModel = Object.create(null);
                listenerModel.targetObject = this.templateObject;
                listenerModel.listener = this.templateObject.editingDocument.editingProxyMap[listenerLabel];

                this.dispatchEventNamed("addListenerForObject", true, false, {
                    listenerModel: listenerModel
                });
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
