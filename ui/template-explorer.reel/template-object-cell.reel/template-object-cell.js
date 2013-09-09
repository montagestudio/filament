/**
 @module "ui/template-object-cell.reel"
 @requires montage
 @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 Description TODO
 @class module:"ui/template-object-cell.reel".TemplateObjectCell
 @extends module:montage/ui/component.Component
 */
exports.TemplateObjectCell = Component.specialize({

    constructor: {
        value: function TemplateObjectCell () {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            // Allow dropping events anywhere on the card
            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("dragleave", this, false);
            this.element.addEventListener("drop", this, false);
        }
    },

    _willAcceptDrop: {
        value: false
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

                //TODO this should not be as hardcoded as this...but we can only open components right now
                // and this is super limited done in time for a demo
                this.isInProjectPackage = /^ui\//.test(value.moduleId);

                value.editingDocument.packageRequire.async(value.moduleId)
                    .get(value.exportName)
                    .then(function (object) {
                        self.isTemplateObjectComponent = object.prototype instanceof Component;
                    }).fail(Function.noop);
            }

        }
    },

    isInProjectPackage: {
        value: false
    },

    isTemplateObjectComponent: {
        value: false
    },

    handleDragover: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types;

            if (!availableTypes) {
                event.dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
            } else if (availableTypes.has(MimeTypes.MONTAGE_EVENT_TARGET)) {

                // allows us to drop
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "link";
                this._willAcceptDrop = true;
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
            var availableTypes = event.dataTransfer.types,
                target = event.target,
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

            }

            this._willAcceptDrop = false;
        }
    },

    handleHeaderAction: {
        value: function () {
            if (this.isInProjectPackage) {
                this.dispatchEventNamed("openModuleId", true ,true, {
                    moduleId: this.templateObject.moduleId
                });
            }
        }
    },

    handleObjectLabelAction: {
        value: function (event) {
            var proxy = this.templateObject,
                editingDocument = proxy._editingDocument;

            if (!editingDocument.setOwnedObjectLabel(proxy, event.target.value)) {
                event.preventDefault();
            }
        }
    }

});
