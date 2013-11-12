var Set = require("montage/collections/set"),
    Map = require("montage/collections/map"),
    MontageVisitor = require("montage/core/serialization/serializer/montage-visitor").MontageVisitor;

exports.ProxyVisitor = MontageVisitor.specialize({

    constructor: {
        value: function ProxyVisitor() {
            this.super();
        }
    },

    getTypeOf: {
        value: function (object) {
            if (object.proxyType) {
                return object.proxyType;
            } else if (object instanceof Map) {
                return "Map";
            } else if (object instanceof Set) {
                return "Set";
            } else {
                return MontageVisitor.getTypeOf.call(this, object);
            }
        }
    },

    visitProxyObject: {
        value: function (malker, proxyObject, name) {
            if (this.isObjectSerialized(proxyObject)) {
                this.serializeReferenceToProxyObject(malker, proxyObject, name);
            } else {
                this.handleProxyObject(malker, proxyObject, name);
            }
        }
    },

    visitMap: {
        value: function (malker, object, name) {
            var mapProxy = this.builder.createObjectLiteral();

            mapProxy.setProperty("type", "map");
            mapProxy.setProperty("entries", object.toObject());

            this.storeValue(mapProxy, object, name);
        }
    },

    visitSet: {
        value: function (malker, object, name) {
            var setProxy = this.builder.createObjectLiteral();

            setProxy.setProperty("type", "set");
            setProxy.setProperty("values", object.toObject());

            this.storeValue(setProxy, object, name);
        }
    },

    serializeReferenceToProxyObject: {
        value: function (malker, object, name) {
            var label = object.label,
                reference = this.builder.createObjectReference(label);

            this.builder.top.setProperty(name, reference);
        }
    },

    handleProxyObject: {
        value: function (malker, proxyObject, name) {
            var builderObject = this.builder.createCustomObject();

            this.setObjectSerialization(proxyObject, builderObject);

            this.serializeProxyObject(malker, proxyObject, builderObject);

            builderObject.setLabel(proxyObject.label);
            this.builder.top.setProperty(name, builderObject);
        }
    },

    serializeProxyObject: {
        value: function (malker, proxyObject, builderObject) {
            var propertiesBuilderObject = this.builder.createObjectLiteral();

            this.setObjectType(proxyObject, builderObject);
            builderObject.setProperty("properties", propertiesBuilderObject);

            this.builder.push(builderObject);

            this.setObjectProperties(malker, proxyObject);
            this.setObjectCustomUnits(malker, proxyObject);
            builderObject.setProperty("prototype", proxyObject.exportId);

            this.builder.pop();

            // Remove the properties unit in case none was serialized,
            // we need to add it before any other units to make sure that
            // it's the first unit to show up in the serialization, since we
            // don't have a way to order the property names in a serialization.
            if (propertiesBuilderObject.getPropertyNames().length === 0) {
                builderObject.clearProperty("properties");
            }
        }
    },

    setObjectProperties: {
        value: function (malker, object) {
            var propertiesObject;

            propertiesObject = this.builder.top.getProperty("properties");

            this.builder.push(propertiesObject);
            this.setSerializableObjectProperties(malker, object);
            this.builder.pop();
        }
    },

    setSerializableObjectProperties: {
        value: function (malker, object) {
            var propertyName,
                propertyNames = object.properties.keys(),
                propertyNamesCount = propertyNames.length;

            for (var i = 0; i < propertyNamesCount; i++) {
                propertyName = propertyNames[i];
                this.setProperty(malker, propertyName, object.getObjectProperty(propertyName));
            }
        }
    },

    setObjectCustomUnit: {
        value: function (malker, object, unitName) {
        }
    },

    setObjectType: {
        value: function (object, builderObject) {
            var exportId = object.getObjectProperty("prototype"),
                objectId = object.getObjectProperty("object");

            if (exportId) {
                builderObject.setProperty("prototype", exportId);
            } else if (objectId) {
                builderObject.setProperty("object", objectId);
            }
        }
    }

});
