var Montage = require("montage").Montage;

function isBindingPathComplex(path) {
    return !!path &&
        path.length > 0 &&
        !(/^[A-Za-z]+\w*$/.test(path));
}

/**
 * A representation of a single property on an object. Can represent
 * properties with descriptors, custom properties, and bindings. Useful because
 * many parts of the component editor involve viewing and customizing an
 * object's properties.
 *
 * The PropertyModel is intended to be dirty-able in that its values are not
 * automatically synchronized with the Proxy it is targeting. This is to allow
 * flexibility when defining new properties. Use the commit() method to apply
 * changes onto the editing model.
 *
 * @class PropertyModel
 * @extends Montage
 */
exports.PropertyModel = Montage.specialize({

    /**
     * The proxy that the inspected property is defined on.
     *
     * @readonly
     * @type {ReelProxy}
     */
    targetObject: {
        get: function () {
            return this._targetObject;
        },
        set: function (value) {
            this._targetObject = value;
            this._isTargetObjectOwnerOfDocument =
                value.editingDocument.templateObjectsTree.templateObject === value;
        }
    },

    _isTargetObjectOwnerOfDocument: {
        value: false
    },

    /**
     * The name of the property, or the target path if the property is bound.
     *
     * @type {String}
     */
    key: {
        get: function () {
            return this._key;
        },
        set: function (value) {
            this._key = value;
        }
    },

    /**
     * The serialized value of the key, changed when commit() is called.
     * Used to prevent bindings to the editing model (properties & bindings)
     * from changing while the user is modifying values.
     *
     * @private
     * @type {String}
     */
    _trueKey: {
        value: null
    },

    /**
     * Whether the key of this property (in practice, the targetPath of the
     * binding) has features that make it complex, * i.e. is not just a simple
     * (valid) property key.
     * This includes chaining (with .), FRB functions, arithmetic, concatenation,
     * higher order functions, boolean operators, scope operators (^), etc.
     * A model representing a complex binding cannot be reverted to a simple
     * unbound property.
     *
     * @example
     * "someProperty": not complex
     * "foo.bar": complex
     * "foo + bar": complex
     * "foo.filter{^baz == ban}": complex
     *
     * @readonly
     * @type {Boolean}
     */
    isKeyComplex: {
        get: function () {
            return this._isKeyComplex;
        },
        set: function (value) {
            if (this._isKeyComplex === value) {
                return;
            }
            this._isKeyComplex = value;
            if (value) {
                this.isBound = true;
            }
        }
    },

    /**
     * The descriptor for the observed property, if there is one.
     *
     * @readonly
     * @type {PropertyDescriptor}
     */
    propertyDescriptor: {
        value: null
    },

    defaultValue: {
        value: null
    },

    /**
     * Whether the property is defined exclusively through serialization and
     * does not have a PropertyDescriptor.
     *
     * @readonly
     * @type {Boolean}
     */
    isCustom: {
        value: null
    },

    /**
     * Whether the property being modeled is a binding. This property can be
     * set to define/cancel bindings. It will be updated automatically whenever
     * the underlying object's properties/bindings collections change.
     *
     * @type {Boolean}
     */
    isBound: {
        get: function () {
            return this._isBound;
        },
        set: function (value) {
            if (!value && this._isKeyComplex) {
                return;
            }
            this._isBound = value;
            if (value) {
                this.sourcePath = this.sourcePath || "";
                this.oneway = !!this.oneway;
            } else {
                if (typeof this.value === "undefined") {
                    this.value = this.defaultValue;
                }
            }
        }
    },

    /**
     * The value of the unbound property. Not necessarily in sync with the
     * targetObject, call commit() to synchronize changes.
     *
     * @type {*}
     */
    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (value === this._value) {
                return;
            }
            this._value = value;
        }
    },

    /**
     * The type of the value. Only used if defining properties onto the object's
     * descriptor (i.e. the object is the owner of its document).
     *
     * @default string
     * @type {String}
     */
    valueType: {
        value: null
    },

    /**
     * The "right-side" of a binding.
     *
     * @type {String}
     */
    sourcePath: {
        value: null
    },

    // TODO: Wouldn't it make more sense to have a "twoway" property instead?
    // "oneway" is the property defined on binding models
    /**
     * The data flow of the binding. (true = <-, false = <->)
     *
     * @type {boolean}
     */
    oneway: {
        value: true
    },

    /**
     * The converter delegate that contains functions for converting/reverting
     * a sourcePath to a targetPath.
     *
     * @type {?Object}
     */
    converter: {
        value: null
    },

    /**
     * The actual value of this property as defined in the target object's
     * properties collection.
     *
     * @private
     * @type {?*}
     */
    _objectPropertyValue: {
        get: function () {
            return this.__objectPropertyValue;
        },
        set: function (value) {
            if (this._key !== this._trueKey) {
                return;
            }
            this.__objectPropertyValue = value;
            if (value) {
                this.value = value;
            }
        }
    },

    /**
     * The object representing the binding of this property as defined in the
     * target object's bindings collection.
     *
     * @private
     * @type {?Object}
     */
    _objectBindingModel: {
        get: function () {
            return this.__objectBindingModel;
        },
        set: function (value) {
            if (this._key !== this._trueKey) {
                return;
            }
            this.__objectBindingModel = value;
            if (value) {
                this.isBound = true;
                this.sourcePath = value.sourcePath;
                this.oneway = value.oneway;
                this.converter = value.converter;
            } else {
                this.isBound = false;
            }
        }
    },

    /**
     * @constructor
     *
     * @param {ReelProxy} targetObject The proxy being observed.
     * @param {ObjectDescriptor} targetObjectDescriptor The descriptor of the object being observed.
     * @param {String} key The name of the property or target path of the binding.
     */
    constructor: {
        value: function PropertyModel(targetObject, targetObjectDescriptor, key) {
            this.super();

            this.targetObject = targetObject;
            this.targetObjectDescriptor = targetObjectDescriptor;
            this._key = key;
            this._trueKey = key;

            this.defineBinding("isKeyComplex",          {"<-": "key", convert: isBindingPathComplex});
            this.defineBinding("propertyDescriptor",    {"<-": "targetObjectDescriptor.propertyDescriptorForName(key)"});
            this.defineBinding("isCustom",              {"<-": "!propertyDescriptor"});
            this.defineBinding("defaultValue",          {"<-": "propertyDescriptor.defaultValue"});
            this.defineBinding("valueType",             {"<-": "propertyDescriptor.valueType"});
            this.defineBinding("_objectPropertyValue",  {"<-": "targetObject.properties.get(key)"});
            this.defineBinding("_objectBindingModel",   {"<-": "targetObject.bindings.filter{key == ^key}.0"});
        }
    },

    /**
     * Applies the property, saving it to its target object's editing document.
     * This needs to be done to update the target object's serialization.
     */
    commit: {
        value: function () {
            var doc = this.targetObject.editingDocument,
                oldKey = this._trueKey,
                result;

            if (this.propertyDescriptor && this.propertyDescriptor.readOnly) {
                return;
            }

            if (this.isBound) {
                result = doc.defineOwnedObjectBinding(this.targetObject, this._key, this.oneway, this.sourcePath, this.converter);
            } else {
                doc.cancelOwnedObjectBinding(this.targetObject, this._key);
                if (this._isTargetObjectOwnerOfDocument) {
                    if (this._key === oldKey && this.propertyDescriptor) {
                        if (this.valueType !== this.propertyDescriptor.valueType) {
                            doc.modifyOwnerBlueprintProperty(this._key, "valueType", this.valueType);
                        }
                        if (this.value !== this.propertyDescriptor.defaultValue) {
                            doc.modifyOwnerBlueprintProperty(this._key, "defaultValue", this.value);
                        }
                    } else if (this.valueType) {
                        doc.addOwnerBlueprintProperty(this._key, this.valueType);
                    } else {
                        throw new Error("Cannot define blueprint property " + this._key + " without a valueType");
                    }
                }
                if (!this.defaultValue || this.value !== this.defaultValue || this._objectPropertyValue) {
                    if (typeof this.value === "undefined") {
                        // TODO: If value is undefined we should calculate
                        // the default value based on the valueType instead
                        // of just setting it to null
                        this.value = null;
                    }
                    result = doc.setOwnedObjectProperty(this.targetObject, this._key, this.value);
                }
            }

            if (oldKey && this._key !== oldKey) {
                doc.cancelOwnedObjectBinding(this.targetObject, oldKey);
                if (!this.isBound) {
                    doc.deleteOwnedObjectProperty(this.targetObject, oldKey);
                }
                if (this._isTargetObjectOwnerOfDocument) {
                    doc.removeOwnerBlueprintProperty(oldKey);
                }
            }

            this._trueKey = this._key;

            return result;
        }
    },

    /**
     * Discards all changes to this property model, restoring its values to
     * be in sync with the target object. Does nothing if the property has
     * not been committed onto the target object.
     */
    reset: {
        value: function () {
            this.key = this._trueKey;
            this._objectPropertyValue = this.__objectPropertyValue;
            this._objectBindingModel = this.__objectBindingModel;
        }
    },

    /**
     * Deletes the property from the target object's serialization and/or
     * ObjectDescriptor.
     */
    delete: {
        value: function () {
            if (this._isTargetObjectOwnerOfDocument) {
                this.targetObject.editingDocument.removeOwnerBlueprintProperty(this.key);
            }
            if (this.isBound) {
                this.targetObject.editingDocument.cancelOwnedObjectBinding(
                    this.targetObject, this.key);
            }
            this.targetObject.editingDocument.deleteOwnedObjectProperty(
                this.targetObject, this.key);
        }
    },

    /**
     * Restores the inspected property to its values as defined in its property
     * descriptor.
     *
     * @throws Error if the property does not have a PropertyDescriptor
     */
    resetToDefault: {
        value: function () {
            if (!this.propertyDescriptor) {
                throw new Error("Cannot reset property model to default because it has no property descriptor");
            }
            if (this._isTargetObjectOwnerOfDocument) {
                return;
            }
            this.reset();
            this.delete();
            this.value = this.defaultValue;
        }
    }
});