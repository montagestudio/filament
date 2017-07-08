var PropertyModel = require("filament/core/property-model").PropertyModel;

function EditingDocument() {
    this.defineOwnedObjectBinding = function (object, key, oneway, sourcePath, converter) {
        var existingBinding = object.bindings.filter(function (binding) {
            return binding.key === key;
        })[0];
        if (existingBinding) {
            existingBinding.oneway = oneway;
            existingBinding.sourcePath = sourcePath;
            existingBinding.converter = converter;
        } else {
            object.bindings.push({
                key: key,
                oneway: oneway,
                sourcePath: sourcePath,
                converter: converter
            });
        }
    };
    this.setOwnedObjectProperty = function (object, key, value) {
        object.properties.set(key, value);
    };
    this.deleteOwnedObjectProperty = function (object, key) {
        object.properties.delete(key);
    };
    this.cancelOwnedObjectBinding = function (object, key) {
        for (var i = 0; i < object.bindings.length; i++) {
            if (object.bindings[i].key === key) {
                object.bindings.splice(i, 1);
                return;
            }
        }
    };
    this.templateObjectsTree = {
        templateObject: {}
    };
    return this;
}

describe("core/property-model", function () {
    var propertyModel,
        editingDocument,
        targetObject,
        targetObjectDescriptor,
        propertyDescriptor;

    beforeEach(function () {
        propertyDescriptor = {
            name: "foo",
            valueType: "boolean",
            defaultValue: true
        };
        targetObjectDescriptor = {
            propertyDescriptors: Map.from({
                foo: propertyDescriptor
            }),
            propertyDescriptorForName: function (key) {
                return this.propertyDescriptors.get(key);
            }
        };
        editingDocument = new EditingDocument();
        editingDocument.addOwnerBlueprintProperty = function (name, valueType) {
            targetObjectDescriptor.propertyDescriptors.set(name, {
                name: name,
                valueType: valueType
            });
        };
        editingDocument.modifyOwnerBlueprintProperty = function (name, property, value) {
            targetObjectDescriptor.propertyDescriptors.get(name)[property] = value;
        };
        editingDocument.removeOwnerBlueprintProperty = function (name) {
            targetObjectDescriptor.propertyDescriptors.delete(name);
        };
        targetObject = {
            editingDocument: editingDocument,
            properties: new Map(),
            bindings: [],
            getObjectBinding: function (key) {
                return this.bindings.filter(function (binding) {
                    return binding.key === key;
                })[0];
            }
        };
    });

    describe("initialization", function () {
        it("saves the correct arguments", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            expect(propertyModel.targetObject).toBe(targetObject);
            expect(propertyModel.targetObjectDescriptor).toBe(targetObjectDescriptor);
            expect(propertyModel.key).toBe("foo");
        });

        it("reports whether the key is complex", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo.bar");
            expect(propertyModel.isKeyComplex).toBeTruthy();
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            expect(propertyModel.isKeyComplex).toBeFalsy();
        });

        it("finds the property's descriptor if applicable", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            expect(propertyModel.propertyDescriptor).toBe(propertyDescriptor);
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "bar");
            expect(propertyModel.propertyDescriptor).toBeFalsy();
        });

        it("sets the value to the defaultValue of the property's descriptor if available", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            expect(propertyModel.value).toBe(true);
        });
    });

    describe("object property changes", function () {
        it("updates the value when the object's property value changes", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            targetObject.properties.set("foo", "aNewValue");
            expect(propertyModel.value).toBe("aNewValue");
        });
    });

    describe("object binding changes", function () {
        it("updates the binding properties when the object's binding model changes", function () {
            var converter = Object.create(null);
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            targetObject.bindings.push({
                key: "foo",
                sourcePath: "@source.path",
                oneway: true,
                converter: converter
            });
            expect(propertyModel.isBound).toBeTruthy();
            expect(propertyModel.sourcePath).toBe("@source.path");
            expect(propertyModel.oneway).toBeTruthy();
            expect(propertyModel.converter).toBe(converter);
        });
    });

    describe("editing model", function () {
        it("saves unbound properties", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "bar");
            propertyModel.value = "someValue";
            propertyModel.commit();
            expect(targetObject.properties.get("bar")).toBe("someValue");
        });

        it("saves unbound properties without a value", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "bar");
            propertyModel.commit();
            expect(targetObject.properties.has("bar")).toBeTruthy();
        });

        it("saves bound properties", function () {
            var converter = {},
                binding;
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "bar");
            propertyModel.isBound = true;
            propertyModel.sourcePath = "@source.path";
            propertyModel.oneway = true;
            propertyModel.converter = converter;
            propertyModel.commit();
            binding = targetObject.getObjectBinding("bar");
            expect(binding.oneway).toBeTruthy();
            expect(binding.sourcePath).toBe("@source.path");
            expect(binding.converter).toBe(converter);
        });

        it("deletes unbound properties", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            propertyModel.delete();
            expect(targetObject.properties.has("foo")).toBeFalsy();
        });

        it("deletes bound properties", function () {
            var binding;
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            propertyModel.isBound = true;
            propertyModel.commit();
            propertyModel.delete();
            binding = targetObject.getObjectBinding("foo");
            expect(binding).toBeFalsy();
        });
    });

    describe("binding conversion", function () {
        it("converts bindings into properties", function () {
            var binding;
            targetObject.bindings.push({
                key: "foo",
                sourcePath: "@source.path",
                oneway: true
            });
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            propertyModel.isBound = false;
            propertyModel.value = false;
            propertyModel.commit();
            binding = targetObject.getObjectBinding("foo");
            expect(binding).toBeFalsy();
            expect(targetObject.properties.get("foo")).toBe(false);
        });
    });

    describe("changing keys", function () {
        it("deletes the old property", function () {
            targetObject.properties.set("foo", "bar");
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            propertyModel.key = "bar";
            propertyModel.commit();
            expect(targetObject.properties.has("foo")).toBeFalsy();
            expect(targetObject.properties.get("bar")).toBe("bar");
        });

        it("deletes the old binding", function () {
            targetObject.bindings.push({
                key: "foo",
                sourcePath: "@target.path",
                oneway: true
            });
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            propertyModel.key = "bar";
            propertyModel.commit();
            expect(targetObject.getObjectBinding("foo")).toBeFalsy();
            expect(targetObject.getObjectBinding("bar")).toBeTruthy();
        });
    });

    describe("ObjectDescriptor editing on owners", function () {
        beforeEach(function () {
            editingDocument.templateObjectsTree = {
                templateObject: targetObject
            };
        });

        it("creates a new PropertyDescriptor for a new property", function () {
            var descriptor;
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "bar");
            propertyModel.valueType = "boolean";
            propertyModel.commit();
            descriptor = targetObjectDescriptor.propertyDescriptorForName("bar");
            expect(descriptor).toBeTruthy();
            expect(descriptor.name).toBe("bar");
            expect(descriptor.valueType).toBe("boolean");
        });

        it("modifies an existing PropertyDescriptor for a property", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            propertyModel.valueType = "string";
            propertyModel.commit();
            expect(targetObjectDescriptor.propertyDescriptorForName("foo")).toBeTruthy();
            expect(targetObjectDescriptor.propertyDescriptorForName("foo").valueType).toBe("string");
        });

        it("deletes an existing PropertyDescriptor for a property", function () {
            propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
            propertyModel.delete();
            expect(targetObjectDescriptor.propertyDescriptorForName("foo")).toBeFalsy();
        });
    });

    it("resets", function () {
        targetObject.properties.set("foo", "bar");
        propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
        propertyModel.value = "value";
        propertyModel.key = "bar";
        propertyModel.isBound = true;
        propertyModel.reset();
        expect(propertyModel.isBound).toBeFalsy();
        expect(propertyModel.key).toBe("foo");
        expect(propertyModel.value).toBe("bar");
    });

    it("restores defaults", function () {
        propertyModel = new PropertyModel(targetObject, targetObjectDescriptor, "foo");
        propertyModel.value = "value";
        propertyModel.isBound = true;
        propertyModel.commit();
        propertyModel.resetToDefault();
        expect(propertyModel.isBound).toBeFalsy();
        expect(propertyModel.value).toBe(true);
    });
});
