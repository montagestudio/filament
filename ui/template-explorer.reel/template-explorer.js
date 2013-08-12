/**
    @module "./template-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    MimeTypes = require("core/mime-types");

/**
    Description TODO
    @class module:"./template-explorer.reel".TemplateExplorer
    @extends module:montage/ui/component.Component
*/
exports.TemplateExplorer = Montage.create(Component, /** @lends module:"./template-explorer.reel".TemplateExplorer# */ {

    _templateObjectFilterTerm: {
        value: null
    },

    templateObjectFilterTerm: {
        get: function () {
            return this._templateObjectFilterTerm;
        },
        set: function (value) {
            if (value === this._templateObjectFilterTerm) {
                return;
            }

            this.dispatchBeforeOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
            this._templateObjectFilterPath = null;
            this._templateObjectFilterTerm = value;
            this.dispatchOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
        }
    },

    _templateObjectFilterPath : {
        value: null
    },

    templateObjectFilterPath: {
        get: function () {
            var term = this.templateObjectFilterTerm;
            if (!this._templateObjectFilterPath && term) {
                // TODO remove manual capitalization once we can specify case insensitivity
                var capitalizedTerm = term.toCapitalized();
                this._templateObjectFilterPath = "!label.contains('owner') && (label.contains('" + term + "') || label.contains('" + capitalizedTerm + "'))";
            } else {
                this._templateObjectFilterPath = "!label.contains('owner')";
            }

            return this._templateObjectFilterPath;
        }
    },

    constructor: {
        value: function TemplateExplorer() {
            this.super();

            this.defineBinding("templateObjectsController.filterPath", {"<-": "templateObjectFilterPath"});
        }
    },

    _willAcceptDrop: {
        value: false
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this._element.addEventListener("dragover", this, false);
            this._element.addEventListener("dragleave", this, false);
            this._element.addEventListener("drop", this, false);

            this._element.addEventListener("click", this);

            application.addEventListener("editBindingForObject", this, false);
        }
    },

    templateObjectsController: {
        value: null
    },

    editingDocument: {
        value: null
    },

    showListeners: {
        value: true
    },

    showBindings: {
        value: true
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            var availableTypes = event.dataTransfer.types;

            //Accept dropping prototypes from library
            if (availableTypes && availableTypes.has(MimeTypes.PROTOTYPE_OBJECT)) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                this._willAcceptDrop = true;
            } else {
                event.dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
            }
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (evt) {
            var availableTypes = event.dataTransfer.types;
            if (availableTypes && availableTypes.has(MimeTypes.PROTOTYPE_OBJECT)) {
                var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                    transferObject = JSON.parse(data);

                this.editingDocument.addLibraryItemFragments(transferObject.serializationFragment).done();
            }
            this._willAcceptDrop = false;
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

    handleRemoveListenerButtonAction: {
        value: function (evt) {
            evt.stop();
            var targetObject = evt.detail.get("targetObject");
            var listener = evt.detail.get("listener");
            this.editingDocument.removeOwnedObjectEventListener(targetObject, listener);
        }
    },

    handleClick: {
        value: function (evt) {
            var target = evt.target;

            if (target === this.element ||
                target === this.templateObjects.objectList.element) {
                this.editingDocument.clearSelectedObjects();
            }
        }
    },

    handleRemoveElementAction: {
        value: function (evt) {
            this.editingDocument.setOwnedObjectElement(evt.detail.get('templateObject'), null);
        }
    }

});
