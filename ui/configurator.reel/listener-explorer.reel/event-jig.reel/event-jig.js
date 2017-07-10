/**
    @module "./event-jig.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    NotModifiedError = require("palette/core/error").NotModifiedError,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

/**
    Description TODO
    @class module:"./event-jig.reel".EventJig
    @extends module:montage/ui/component.Component
*/
exports.EventJig = Component.specialize(/** @lends module:"./event-jig.reel".EventJig# */ {

    editingDocument: {
        value: null
    },

    targetObject: {
        value: null
    },

    eventType: {
        value: null
    },

    _focusTimeout: {
        value: null
    },

    acceptsActiveTarget: {
        value: true
    },

    enterDocument: {
        value: function () {
            defaultEventManager.activeTarget = this;

            var self = this;
            this._focusTimeout = setTimeout(function () {
                self.templateObjects.typeField.element.focus();
            }, 100);
        }
    },

    exitDocument: {
        value: function () {
            clearTimeout(this._focusTimeout);
        }
    },

    shouldDismissOverlay: {
        value: function (overlay, target) {
            // don't dismiss the overlay if the user can drag the target
            while (target) {
                if (target.draggable) {
                    return false;
                }
                target = target.parentElement;
            }
            return true;
        }
    },

    handleDefineEventButtonAction: {
        value: function (evt) {
            evt.stop();
            var self = this;
            this._commit().catch(function(error) {
                if (error instanceof NotModifiedError) {
                    self._discard();
                } else {
                    throw error;
                }
            }).done();
        }
    },

    handleCancelButtonAction: {
        value: function (evt) {
            evt.stop();
            this._discard();
        }
    },

    handleKeyPress: {
        value: function(evt) {
            if ("cancelEditing" === evt.identifier) {
                this._discard();
            }
        }
    },

    _discard: {
        value: function () {
            this.eventType = null;
            this.dispatchEventNamed("discard", true, false);
        }
    },

    _commit: {
        value: function () {
            var self = this,
                type = this.eventType;

            return this.editingDocument.addOwnerBlueprintEvent(type)
                .then(function () {
                    self.dispatchEventNamed("commit", true, false, {
                        type: type
                    });
                    self.eventType = null;
                    return type;
                });
        }
    }
});
