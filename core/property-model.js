var Montage = require("montage").Montage;

/**
 * A representation of a single property on an object. Can represent
 * properties with descriptors, custom properties, and bindings. Useful because
 * many parts of the component editor involve viewing and customizing an
 * object's properties.
 *
 * @class PropertyModel
 * @extends Montage
 */
exports.PropertyModel = Montage.specialize({

    /**
     * The proxy that the inspected property is defined on.
     *
     * @type {ReelProxy}
     */
    targetObject: {
        get: function () {
            return this._targetObject;
        },
        set: function (value) {
            this._targetObject = value;
        }
    },

    /**
     * The name of the property, or the targetPath if the property is bound.
     *
     * @readonly
     * @type {String}
     */
    key: {
        get: function () {
            return this._key;
        }
    },

    /**
     * Alias for key.
     *
     * @type {String}
     */
    targetPath: {
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
     * @type {Boolean}
     */
    isCustom: {
        value: null
    },

    /**
     * The value of the property on the targetObject. Setting will cause
     * changes to propagate to the object's editingDocument for serialization.
     *
     * @type {Any}
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
            this.commit();
        }
    },

    /**
     * Whether the key of this property (in practice, the targetPath of the
     * binding) is complex, i.e. is not just a simple (valid) property key.
     * This includes chaining (with .), FRB functions, arithmetic, concatenation,
     * higher order functions, boolean operators, scope operators (^), etc.
     * A model representing a complex binding cannot be reverted to a simple
     * unbound property.
     *
     * @example
     * "foo": not complex
     * "someKindOfProperty": not complex
     * "foo.bar": complex
     * "foo + bar": complex
     * "foo.filter{^baz == ban}": complex
     *
     * @type {Boolean}
     */
    isKeyComplex: {
        value: null
    },

    /**
     * @type {Boolean}
     */
    isBound: {
        value: null
    },

    /**
     * @type {Object}
     */
    bindingModel: {
        value: null
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
            var self = this;
            this.super();

            this.targetObject = targetObject;
            this._key = key;
            if (targetObjectDescriptor) {
                this._propertyDescriptor = targetObjectDescriptor.propertyDescriptorForName(key);
            }
            this.defineBinding("targetPath", {
                "<-": "key"
            });
            this.defineBinding("isCustom", {
                "<-": "!propertyDescriptor"
            });
            this.defineBinding("isKeyComplex", {
                "<-": "key",
                convert: function (k) {
                    return k.length > 0 && !(/^[A-Za-z]+\w*$/.test(k));
                }
            });
            this.defineBinding("bindingModel", {
                "<-": "targetObject.bindings.filter{key == ^key}.0"
            });
            this.defineBinding("isBound", {
                "<-": "!!bindingModel"
            });
            this.addPathChangeListener("targetObject.properties.get(key)", this, "_valueChanged");
        }
    },

    _valueChanged: {
        value: function (value) {
            this._value = value;
        }
    },

    /**
     * Applies the property, saving it to its target object's editing document.
     * This needs to be done to update the target object's serialization.
     */
    commit: {
        value: function () {
            var self = this,
                model = this.bindingModel,
                existingBinding;

            if (this._propertyDescriptor && this._propertyDescriptor.readOnly) {
                return;
            }

            if (this.isBound) {
                existingBinding = this.targetObject.bindings.filter(function (binding) {
                    return binding.key === self.key;
                })[0];
                if (existingBinding) {
                    return this.targetObject.editingDocument.updateOwnedObjectBinding(this.targetObject, existingBinding, model.key, model.oneway, model.sourcePath, model.converter);
                } else {
                    return this.targetObject.editingDocument.defineOwnedObjectBinding(this.targetObject, model.key, model.oneway, model.sourcePath, model.converter);
                }
            } else {
                this.targetObject.editingDocument.setOwnedObjectProperty(this.targetObject, this._key, this.value);
                return Promise.resolve();
            }
        }
    },

    /**
     * Deletes the property from the target object's serialization and/or
     * ObjectDescriptor.
     */
    delete: {
        value: function () {
            this.cancelBinding();
            this.targetObject.editingDocument.deleteOwnedObjectProperty(this.targetObject, this.key);
        }
    },

    /**
     * Creates a binding in place for this property. Does nothing if a binding
     * already exists.
     */
    convertToBinding: {
        value: function () {

        }
    },

    /**
     * Cancels an existing binding for this property, reverting it to an
     * unbound property. Does nothing if there is no binding to cancel.
     */
    cancelBinding: {
        value: function () {
            if (this.isBound) {
                this.targetObject.editingDocument.cancelOwnedObjectBinding(this.targetObject, this.bindingModel);
            }
        }
    }
});