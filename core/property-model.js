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
            if (this._key !== value) {
                this._key = value;
                if (this.targetObjectDescriptor) {
                    this._propertyDescriptor = this.targetObjectDescriptor.propertyDescriptorForName(value);
                }
            }
        }
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
        value: null
    },

    /**
     * The descriptor for the observed property, if there is one.
     *
     * @readonly
     * @type {PropertyDescriptor}
     */
    propertyDescriptor: {
        get: function () {
            return this._propertyDescriptor;
        }
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
            this._isBound = value;
            if (value) {
                this.sourcePath = this.sourcePath || "";
                this.oneway = !!this.oneway;
            } else {
                if (typeof this.value === "undefined") {
                    this.value = this._propertyDescriptor ?
                        this._propertyDescriptor.defaultValue : "";
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
        value: null
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
            this.key = key;

            this.defineBinding("isKeyComplex",          {"<-": "key", convert: isBindingPathComplex});
            this.defineBinding("isCustom",              {"<-": "!propertyDescriptor"});
            this.defineBinding("_objectPropertyValue",  {"<-": "targetObject.properties.get(key)"});
            this.defineBinding("_objectBindingModel",   {"<-": "targetObject.bindings.filter{key == ^key}.0"});

            if (this._objectBindingModel) {
                this._committedBindingKey = this.key;
            } else if (this._objectPropertyValue) {
                this._committedPropertyKey = this.key;
            }
        }
    },

    /**
     * Applies the property, saving it to its target object's editing document.
     * This needs to be done to update the target object's serialization.
     */
    commit: {
        value: function () {
            var doc = this.targetObject.editingDocument,
                result;

            if (this._propertyDescriptor && this._propertyDescriptor.readOnly) {
                return;
            }

            if (this._committedPropertyKey && this._committedPropertyKey !== this.key) {
                doc.deleteOwnedObjectProperty(this.targetObject, this._committedPropertyKey);
            } else if (this._committedBindingKey && this._committedBindingKey !== this.key) {
                doc.cancelOwnedObjectBinding(this.targetObject, this._committedBindingKey);
            }

            if (this._isTargetObjectOwnerOfDocument && this._committedPropertyKey && this._committedPropertyKey !== this.key) {
                doc.removeOwnerBlueprintProperty(this._committedPropertyKey);
                this._propertyDescriptor = void 0;
            }

            if (this.isBound) {
                result = doc.defineOwnedObjectBinding(this.targetObject, this.key, this.oneway, this.sourcePath, this.converter);
                this._committedPropertyKey = void 0;
                this._committedBindingKey = this.key;
            } else {
                if (this._isTargetObjectOwnerOfDocument) {
                    if (this._propertyDescriptor) {
                        doc.modifyOwnerBlueprintProperty(this.key, "valueType", this.valueType);
                    } else {
                        doc.addOwnerBlueprintProperty(this.key, this.valueType);
                    }
                }
                if (this._committedBindingKey) {
                    doc.cancelOwnedObjectBinding(this._targetObject, this.key);
                }
                result = doc.setOwnedObjectProperty(this.targetObject, this.key, this.value);
                this._committedPropertyKey = this.key;
                this._committedBindingKey = void 0;
            }

            return result;
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
    }
});