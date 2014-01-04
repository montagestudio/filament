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

    templateExplorer: {
        value: null
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

            // hover component in the stage
            this.element.addEventListener("mouseover", this, false);
            this.element.addEventListener("mouseout", this, false);

            // selection
            this.element.addEventListener("click", this, false);
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

                // If we already have the exports then use them synchronously
                // This avoids a visual glitch where the element field appears
                // briefly.
                try {
                    var exports = value.editingDocument.packageRequire(value.moduleId);
                    var object = exports[value.exportName];
                    this.isTemplateObjectComponent = object.prototype instanceof Component;
                } catch (e) {
                    // Otherwise if Mr hasn't loaded the module then do it async
                    if (e.message.search(/^Can't require module/) === -1) {
                        throw e;
                    }
                    value.editingDocument.packageRequire.async(value.moduleId)
                    .get(value.exportName)
                    .then(function (object) {
                        self.isTemplateObjectComponent = object.prototype instanceof Component;
                    }).fail(Function.noop)
                    .done();
                }

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
                event.dataTransfer.dropEffect = "copy";
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

    handleMouseover: {
        value: function () {
            var proxy = this.templateObject,
                editingDocument = proxy._editingDocument,
                nodeProxy = editingDocument.nodeProxyForComponent(proxy);

            this.dispatchEventNamed("highlightComponent", true, true, {
                component: proxy,
                element: nodeProxy,
                highlight: true
            });
        }
    },

    handleMouseout: {
        value: function () {
            var proxy = this.templateObject;
            this.dispatchEventNamed("highlightComponent", true, true, {
                component: proxy,
                highlight: false
            });
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
    },

    handleHiddenCheckboxAction: {
        value: function (evt) {
            var proxy = this.templateObject,
                editingDocument = proxy._editingDocument;

            editingDocument.setOwnedObjectEditorMetadata(proxy, "isHidden", evt.target.checked);
        }
    },

    handleClick: {
        value: function (evt) {
            var reelProxy  = this.templateObject,
                editingDocument = reelProxy._editingDocument;
            // FIXME: Add support for multiple selection
            editingDocument.clearSelectedObjects();
            editingDocument.selectObject(reelProxy);
        }
    }

});
