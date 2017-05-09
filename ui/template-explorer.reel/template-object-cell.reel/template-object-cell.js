/**
 @module "ui/template-object-cell.reel"
 @requires montage
 @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    MimeTypes = require("core/mime-types"),
    MenuModule = require("core/menu");

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

    _contextualMenu: {
        value: null
    },

    contextualMenu: {
        get: function () {
            if (this._contextualMenu) {
                return this._contextualMenu;
            }
            var deleteItem,
                menu = new MenuModule.Menu();
            deleteItem = MenuModule.makeMenuItem("Delete", "delete", "", false, "");
            menu.insertItem(deleteItem);
            this._contextualMenu = menu;

            return this._contextualMenu;
        }
    },

    handleContextualMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = menuItem.identifier;

            switch (identifier) {
            case "delete":
                evt.stop();
                menuItem.enabled = true;
                break;
            }

        }
    },

    handleContextualMenuAction: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = menuItem.identifier;

            switch (identifier) {
            case "delete":
                this.deleteTemplateObject();
                break;
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

            // save toggle state
            this.toggle.addEventListener("action", this, false);

            // contextualMenu
            this.addEventListener("contextualMenuValidate", this, false);
            this.addEventListener("contextualMenuAction", this, false);
        }
    },

    _willAcceptDrop: {
        value: false
    },

    _reelProxy: {
        value: null
    },
    reelProxy: {
        get: function() {
            return this._reelProxy;
        },
        set: function(value) {
            if (this._reelProxy === value) {
                return;
            }
            this._reelProxy = value;

            if (value) {
                var self = this;

                this.canDrawGate.setField("needsObjectDescription", false);

                this._describeTemplateObject()
                    .spread(function (templateObject, description) {
                        // Only accept values if the reelProxy hasn't changed
                        // since we went off to describe it
                        if (templateObject === self._reelProxy) {
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
            var reelProxy = this.reelProxy,
                description = {};

            // Determine if this object is provided by the project's own package
            // TODO not restrict this to components within the ui directory
            description.isInProjectPackage = /^ui\//.test(reelProxy.moduleId);
            description.isTemplateObjectComponent = /\.reel$/.test(reelProxy.moduleId);
            return Promise.resolve([reelProxy, description]);
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
                listenerModel.targetObject = this.editingDocument.editingProxyMap[eventTargetData.targetLabel];
                listenerModel.type = eventTargetData.eventType;
                listenerModel.listener = this.reelProxy;

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
                    moduleId: this.reelProxy.moduleId
                });
            }
        }
    },

    handleMouseover: {
        value: function () {
            var proxy = this.reelProxy,
                editingDocument = this.editingDocument,
                nodeProxy;

            if (proxy) {
                nodeProxy = editingDocument.nodeProxyForComponent(proxy);

                this.dispatchEventNamed("highlightComponent", true, true, {
                    component: proxy,
                    element: nodeProxy,
                    highlight: true
                });
            }
        }
    },

    handleMouseout: {
        value: function () {
            var proxy = this.reelProxy;

            if (proxy) {
                this.dispatchEventNamed("highlightComponent", true, true, {
                    component: proxy,
                    highlight: false
                });
            }
        }
    },

    handleObjectLabelAction: {
        value: function (event) {
            var proxy = this.reelProxy,
                editingDocument = this.editingDocument;

            event.stopPropagation();

            if (!editingDocument.setOwnedObjectLabel(proxy, event.target.value)) {
                event.preventDefault();
            }
        }
    },

    handleHiddenToggleButtonAction: {
        value: function (evt) {
            var proxy = this.reelProxy,
                editingDocument = this.editingDocument,
                hidden = !this.templateObjects.hiddenToggleButton.pressed;

            editingDocument.setOwnedObjectEditorMetadata(proxy, "isHidden", hidden);
        }
    },

    handleToggle: {
        value: function (evt) {
            var reelProxy = this.reelProxy,
                editingDocument = this.editingDocument,
                expanded = this.expanded.checked;

            editingDocument.templateObjectsTreeToggleStates.set(reelProxy, expanded);
        }
    },

    canSelect: {
        value: function (evt) {
            // ignore toggle click, hide checkbox
            return !(
                this.toggle.element === evt.target ||
                (
                    evt.target.component &&
                    (evt.target.component.identifier === "hiddenToggleButton")
                )
            );
        }
    },

    deleteTemplateObject: {
        value: function () {
            var reelProxy = this.reelProxy,
                editingDocument = this.editingDocument;

            editingDocument.removeObject(reelProxy);
        }
    },

    handleClick: {
        value: function (evt) {
            var proxy = this.reelProxy || this.nodeProxy,
                editingDocument = this.editingDocument;
            if (!this.canSelect(evt)) {
                return;
            }
            // FIXME: Add support for multiple selection
            editingDocument.clearSelectedObjects();
            editingDocument.selectObject(proxy);
        }
    }

});
