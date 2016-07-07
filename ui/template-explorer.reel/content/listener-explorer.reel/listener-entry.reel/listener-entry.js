/**
    @module "./listener-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
    Description TODO
    @class module:"./listener-entry.reel".ListenerEntry
    @extends module:montage/ui/component.Component
*/
exports.ListenerEntry = Component.specialize(/** @lends module:"./listener-entry.reel".ListenerEntry# */ {

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, false);
            }
        }
    },

    listenerInfo: {
        value: null
    },

    targetObject: {
        value: null
    },

    handlePress: {
        value: function(evt) {
            if (this.listenerInfo) {
                var listenerModel = Object.create(null),
                    listener = this.listenerInfo.listener;

                listenerModel.targetObject = this.targetObject;
                listenerModel.type = this.listenerInfo.type;
                listenerModel.useCapture = this.listenerInfo.useCapture;

                if (listener && listener.properties.has('handler') && listener.properties.has('action')) {
                    listenerModel.actionEventListener = listener;
                    listenerModel.listener = listener.properties.get('handler');
                    listenerModel.methodName = listener.properties.get('action');
                } else {
                    listenerModel.listener = listener;
                }

                this.dispatchEventNamed("editListenerForObject", true, false, {
                    listenerModel: listenerModel,
                    existingListener: this.listenerInfo
                });
            }
        }
    },

    handleDragstart: {
        value: function (event) {
            event.dataTransfer.effectAllowed = "copyMove";
            var listenerModel = Object.create(null),
                listener = this.listenerInfo.listener,
                uuid = this.targetObject.uuid,
                sourceUuid = "x-montage-uuid/" + uuid;

            listenerModel.type = this.listenerInfo.type;
            listenerModel.useCapture = this.listenerInfo.useCapture;

            if (listener && listener.properties.has('handler') && listener.properties.has('action')) {
                listenerModel.listenerLabel = listener.properties.get('handler').label;
                listenerModel.methodName = listener.properties.get('action');
            } else {
                listenerModel.listenerLabel = listener.label;
            }

            listenerModel.targeObjectLabel = this.targetObject.label;
            listenerModel.movedListenerIndex = this.targetObject.listeners.indexOf(this.listenerInfo);

            event.dataTransfer.setData(MimeTypes.MONTAGE_LISTENER, JSON.stringify(listenerModel));
            event.dataTransfer.setData(sourceUuid, uuid);
        }
    }

});
