/**
    @module "ui/configurator.reel/property-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    PropertyModel = require("core/property-model").PropertyModel,
    RangeController = require("montage/core/range-controller").RangeController;

/**
    Description TODO
    @class module:"ui/configurator.reel/property-explorer.reel".PropertyExplorer
    @extends module:montage/ui/component.Component
*/
exports.PropertyExplorer = Component.specialize( /** @lends module:"ui/configurator.reel/property-explorer.reel".PropertyExplorer# */ {

    constructor: {
        value: function Inspector() {
            this.super();
            this.propertyGroupsController = new RangeController();
        }
    },

    editingDocument: {
        value: null
    },

    _object: {
        value: null
    },
    object: {
        get: function () {
            return this._object;
        },
        set: function (value) {
            if (value === this._object) {
                return;
            }

            if (this._blueprintDeferred && !this._blueprintDeferred.promise.isFulfilled()) {
                this._blueprintDeferred.reject(new Error("Inspected Object changed before blueprint was resolved"));
            }

            this._object = value;

            this.needsDraw = true;

            if (this._object && this._object.moduleId && (this._object.moduleId !== "") && this._object.exportName && (this._object.exportName !== "")) {

                if (typeof this._labelField !== "undefined") {
                    this._labelField.value = this._object.label;
                }

                this._blueprintDeferred = Promise.defer();

                var self = this;
                this._object.packageRequire.async(this._object.moduleId).get(this._object.exportName).get("blueprint")
                    .then(function (blueprint) {
                        self._blueprintDeferred.resolve(blueprint);
                        self.objectBlueprint = blueprint;
                    }, function (reason) {
                        console.warn("Unable to load blueprint: ", reason.message ? reason.message : reason);
                        self._blueprintDeferred.reject(null);
                    }).done();

            } else {
                this._blueprintDeferred = null;
                this.objectBlueprint = null;
                if (typeof this._labelField !== "undefined") {
                    this._labelField.value = "";
                }
            }
        }
    },

    /**
     * Used to prevent blueprint being resolved if this.object changes
     * while the blueprint is being loaded.
     *
     * Takes advantage of the fact that a promise cannot be resolved after
     * being rejected and vice versa.
     * @type {Promise}
     * @private
     */
    _blueprintDeferred: {
        value: null
    },

    _objectBlueprint: {
        value: null
    },

    /*
     * Property blueprint that is inspected
     */
    objectBlueprint: {
        get: function () {
            return this._objectBlueprint;
        },
        set: function (value) {
            var self = this,
                parentGroups = new Set(),
                groups,
                isObjectOwner;
            if (this._objectBlueprint === value) {
                return;
            }
            this._objectBlueprint = value;
            if (this._cancelPropertiesListener) {
                this._cancelPropertiesListener();
                this._cancelPropertiesListener = void 0;
            }
            if (value === null) {
                return;
            }
            isObjectOwner = this.object === this.editingDocument.templateObjectsTree.templateObject;
            if (value.parent) {
                parentGroups.addEach(value.parent.propertyDescriptorGroups);
            }
            // we could create a binding to the propertyBlueprintGroups,
            // but at the moment I'm not expecting the component blueprint
            // to change at runtime
            groups = value.propertyDescriptorGroups.map(function (groupName, index) {
                return {
                    name: groupName,
                    properties: value.propertyDescriptorGroupForName(groupName).map(function (property) {
                        return new PropertyModel(self.object, value, property.name);
                    }),
                    open: index === 0,
                    isCustomizable: isObjectOwner && !parentGroups.has(groupName)
                };
            });
            if (!isObjectOwner) {
                var describedPropertyKeys = this.objectBlueprint.propertyDescriptors.map(function (descriptor) {
                    return descriptor.name
                });
                var customProperties = [];
                groups.unshift({
                    name: "Custom",
                    isCustomizable: true,
                    properties: customProperties
                });
                this._cancelPropertiesListener = this.object.addRangeAtPathChangeListener(
                    "properties.keysArray().concat(bindings.map{key}).sortedSet{this}",
                    function (plus, minus) {
                        var keys = customProperties.map(function (prop) {
                            return prop.key;
                        });
                        plus.forEach(function (key) {
                            if (keys.indexOf(key) === -1 && describedPropertyKeys.indexOf(key) === -1) {
                                customProperties.push(
                                    new PropertyModel(self.object, self._objectBlueprint, key)
                                );
                            }
                        });
                        minus.forEach(function (key) {
                            for (var i = 0; i < customProperties.length; ++i) {
                                if (customProperties[i].key === key) {
                                    customProperties.splice(i, 1);
                                }
                            }
                        });
                    }
                );
            }
            this.propertyGroupsController.content = groups;
        }
    },

    /**
     * String keys of all the properties and bindings defined on the current
     * object that are not defined in the object's blueprint.
     *
     * @type {Array<String>}
     */
    customPropertyKeys: {
        get: function () {
            var describedKeys = this.objectBlueprint.propertyDescriptors.map(function (descriptor) {
                return descriptor.name;
            });
            var propertyKeys = this.object.properties.keysArray();
            var bindingKeys = this.object.bindings.map(function (bindingModel) {
                return bindingModel.key;
            });
            return propertyKeys.concat(bindingKeys).filter(function (key) {
                return describedKeys.indexOf(key) === -1;
            });
        }
    },

    inspectorController: {
        serializable: false,
        value: null
    },

    propertyGroupsController: {
        serializable: false,
        value: null
    },

    handleModalEditorButtonAction: {
        value: function (evt) {
            if (!(this.inspectorController && this.inspectorController.hasEditor)) {
                return;
            }

            var self = this,
                editor;

            this.inspectorController.editorComponent().then(function (Editor) {
                editor = new Editor();
                editor.object = self._object;
                editor.editingDocument = self.editingDocument;
                self.dispatchEventNamed("enterModalEditor", true, true, {
                    modalEditor: editor
                });
            }).done();
        }
    },

    handleLabelFieldAction : {
        value: function (evt) {
            if (this.object) {
                this.editingDocument.setOwnedObjectLabel(this.object, evt.target.value);
            }
        }
    }
});
