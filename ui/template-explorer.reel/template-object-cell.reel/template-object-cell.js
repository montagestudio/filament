/**
 @module "ui/template-object-cell.reel"
 @requires montage
 @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
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
                //TODO this should not be as hardcoded as this...but we can only open components right now
                // and this is super limited done in time for a demo
                this.isInProjectPackage = /^ui\//.test(value.moduleId);

                this._describeTemplateObject();
            }

        }
    },

    _describeTemplateObject: {
        value: function () {

            var self = this,
                templateObject = this.templateObject,
                packageRequire = templateObject.editingDocument.packageRequire,
                componentModuleId = "montage/ui/component",
                componentExports,
                componentModule,
                componentConstructor,
                componentConstructorPromise,
                templateObjectExports,
                templateObjectConstructor,
                templateObjectConstructorPromise;


            // If we already have the exports then use them synchronously
            // This avoids a visual glitch where the element field appears
            // briefly.
            try {
                templateObjectExports = packageRequire(templateObject.moduleId);
            } catch(e) {
                // Montage projects reliant on mr prior to https://github.com/montagejs/mr/pull/66
                // will incorrectly receive an exports when the same module is required;
                // don't assume the module is in the exports if we have an exports
                delete packageRequire.getModuleDescriptor(templateObject.moduleId).exports;
                if (e.message.search(/^Can't require module/) === -1) {
                    throw e;
                }
            }

            if (templateObjectExports) {
                templateObjectConstructor = templateObjectExports[templateObject.exportName];
            }

            try {
                componentExports = packageRequire(componentModuleId);
            } catch(e) {
                delete packageRequire.getModuleDescriptor("Component").exports;
                if (e.message.search(/^Can't require module/) === -1) {
                    throw e;
                }
            }

            if (componentExports) {
                componentModule = componentExports.Component;
            }

            if (templateObjectConstructor && componentConstructor) {
                this.isTemplateObjectComponent = templateObjectConstructor.prototype instanceof componentConstructor;
            } else {

                // Otherwise, we don't have what we need, get them asynchronously
                if (templateObjectConstructor) {
                    templateObjectConstructorPromise = templateObjectConstructor;
                } else {
                    templateObjectConstructorPromise = packageRequire.async(templateObject.moduleId).get(templateObject.exportName);
                }

                if (componentConstructor) {
                    componentConstructorPromise = componentConstructor;
                } else {
                    componentConstructorPromise = packageRequire.async(componentModuleId).get("Component");
                }

                Promise.all([
                    templateObjectConstructorPromise,
                    componentConstructorPromise
                ]).spread(function (templateObjectConstructor, componentConstructor) {
                    self.isTemplateObjectComponent = templateObjectConstructor.prototype instanceof componentConstructor;
                }).fail(Function.noop)
                .done();
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

    canSelect: {
        value: function (evt) {
            // ignore toggle click, hide checkbox
            return !(
                this.templateObjects.toggleExpanded.element.parentOf(evt.target) ||
                (
                    evt.target.component &&
                    (evt.target.component.identifier === "hiddenCheckbox")
                )
            );
        }
    },

    handleClick: {
        value: function (evt) {
            var reelProxy  = this.templateObject,
                editingDocument = reelProxy._editingDocument;
            if (!this.canSelect(evt)) {
                return;
            }
            // FIXME: Add support for multiple selection
            editingDocument.clearSelectedObjects();
            editingDocument.selectObject(reelProxy);
        }
    }

});
