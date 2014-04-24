var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    Panel = require("ui/panel.reel").Panel,
    MimeTypes = require("core/mime-types");

exports.Configurator = Montage.create(Panel, {

    constructor: {
        value: function Configurator() {
            this.super();
            //TODO handle multiple selection better
            this.addPathChangeListener("editingDocument.selectedObjects.0", this);
        }
    },

    editingDocument: {
        value: null
    },

    viewController: {
        value: null
    },

    //TODO this is a little weird that the inspector for selectedObjects.I finds its controller from inspectorControllers.I
    inspectorControllers: {
        value: null
    },

    recentlySelectedObjects: {
        value: null
    },

    assetsManager: {
        value: null
    },

    handlePathChange: {
        value: function (value, path) {
            if ("editingDocument.selectedObjects.0" === path) {
                var selectedObject = this.getPath("editingDocument.selectedObjects.0"),
                    inspectorController = this.viewController ? this.viewController.modalEditorTypeForObject(selectedObject) : null;

                if (inspectorController) {
                    this.inspectorControllers = [inspectorController];
                } else {
                    this.inspectorControllers = null;
                }

                this.templateObject = selectedObject;
            }
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

            // hover component in the stage
            this.element.addEventListener("mouseover", this, false);
            this.element.addEventListener("mouseout", this, false);

            // selection
            this.element.addEventListener("click", this, false);

//            // save toggle state
//            this.toggle.addEventListener("action", this, false);
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

                this.canDrawGate.setField("needsObjectDescription", false);

                this._describeTemplateObject()
                    .spread(function (templateObject, description) {
                        // Only accept values if the templateObject hasn't changed
                        // since we went off to describe it
                        if (templateObject === self._templateObject) {
                            var keys = Object.keys(description);
                            keys.forEach(function (key) {
                                self[key] = description[key];
                            });
                            self.canDrawGate.setField("needsObjectDescription", true);
                        }
                    })
                    .done();
            }

        }
    },

    _describeTemplateObject: {
        value: function () {
            var templateObject = this.templateObject,
                packageRequire = templateObject.editingDocument.packageRequire,
                description = {};

            // Determine if this object is provided by the project's own package
            // TODO not restrict this to components within the ui directory
            description.isInProjectPackage = /^ui\//.test(templateObject.moduleId);

            return Promise.all([
                    packageRequire.async(templateObject.moduleId).get(templateObject.exportName),
                    packageRequire.async("montage/ui/component").get("Component")
                ])
                .spread(function (objectConstructor, componentConstructor) {
                    description.isTemplateObjectComponent = objectConstructor.prototype instanceof componentConstructor;
                })
                .fail(function () {
                    description.isTemplateObjectComponent = null;
                })
                .thenResolve([templateObject, description]);
        }
    },

    isInProjectPackage: {
        value: null
    },

    isTemplateObjectComponent: {
        value: null
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

    handleDefineBindingButtonAction: {
        value: function (evt) {
            //TODO not wipe out content if open/already has a bindingModel
            var bindingModel = Object.create(null);
            bindingModel.targetObject = evt.detail.get("targetObject");
            bindingModel.oneway = true;

            this.dispatchEventNamed("addBinding", true, false, {
                bindingModel: bindingModel
            });
        }
    },

    handleCancelBindingButtonAction: {
        value: function (evt) {
            evt.stop();
            var targetObject = evt.detail.get("targetObject");
            var binding = evt.detail.get("binding");
            this.editingDocument.cancelOwnedObjectBinding(targetObject, binding);
        }
    },

    handleEditBindingForObject: {
        value: function (evt) {
            var bindingModel = evt.detail.bindingModel;
            var existingBinding = evt.detail.existingBinding;

            this.dispatchEventNamed("addBinding", true, false, {
                bindingModel: bindingModel,
                existingBinding: existingBinding
            });
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
    },



});
