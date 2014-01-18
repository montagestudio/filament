var Target = require("montage/core/target").Target,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    Map = require("montage/collections/map"),
    application = require("montage/core/application").application;

/**
 @class module:palette/coreediting-proxy.EditingProxy
 This the abstract class far all editor proxies.
 */
exports.EditingProxy = Target.specialize( /** @lends module:palette/coreediting-proxy.EditingProxy# */  {

    constructor: {
        value: function EditingProxy() {
            this.super();
        }
    },

    nextTarget: {
        get: function() {
            return this.editingDocument;
        }
    },

    proxyType: {
        get: function() {
            return "ProxyObject";
        }
    },

    /**
     * The label for this object within the EditingDocument's template
     */
    label: {
        value: null
    },

    _editingDocument: {
        value: null
    },

    /**
     * The editingDocument that owns this editingObject
     */
    editingDocument: {
        get: function () {
            return this._editingDocument;
        }
    },

    _exportId: {
        value: null
    },

    /**
     * The exportId of the object this proxy represents
     * @note An exportId is comprised of a moduleId and either an explicit or implicit exportName
     * @example "foo/bar/baz[Baz]"
     */
    exportId: {
        get: function () {
            return this._exportId;
        }
    },

    _moduleId: {
        value: null
    },

    /**
     * The moduleId portion of the exportId string
     * @example "foo/bar/baz"
     */
    moduleId: {
        get: function () {
            if (!this._moduleId && this._exportId) {
                var fileUrl = this.editingDocument.url;
                var packageUrl = this.editingDocument.packageRequire.location;
                var baseModuleId = "";
                if (fileUrl.indexOf(packageUrl) > -1) {
                    baseModuleId = fileUrl.substring(packageUrl.length);
                }

                var moduleId = MontageReviver.parseObjectLocationId(this._exportId).moduleId;
                if (moduleId[0] === "." && (moduleId[1] === "." || moduleId[1] === "/")) {
                    moduleId = this.editingDocument.packageRequire.resolve(baseModuleId + "/" + moduleId, baseModuleId);
                }
                this._moduleId = moduleId;
            }
            return this._moduleId;
        }
    },

    _exportName: {
        value: null
    },

    /**
     * The exportName portion of the exportId
     */
    exportName: {
        get: function () {
            if (!this._exportName && this._exportId) {
                this._exportName = MontageReviver.parseObjectLocationId(this._exportId).objectName;
            }
            return this._exportName;
        }
    },

    /**
     * Initialize an EditingProxy suitable for editing through an EditingDocument
     *
     * @param {string} label The label for this object within the EditingDocument
     * @param {EditingDocument} editingDocument The editingDocument that owns this editingObject
     */
    init: {
        value: function (label, serialization, exportId, editingDocument) {
            var self = this;
            self.label = label;
            self._exportId = exportId;
            self._editingDocument = editingDocument;

            self._populateWithSerialization(serialization);

            return self;
        }
    },

    _properties: {
        value: null
    },

    /**
     * The map of properties that should be applied to the object this proxy represents
     */
    properties: {
        get: function () {
            return this._properties;
        }
    },

    _populateWithSerialization: {
        value: function (serialization) {
            this._properties = new Map(serialization.properties);

            if (serialization.lumieres) {
                this.comment = serialization.lumieres.comment;
                this.x = serialization.lumieres.x;
                this.y = serialization.lumieres.y;
            }
        }
    },

    _dispatchDidChangeObjectProperties: {
        value: function(properties) {
            this.dispatchEventNamed("didChangeObjectProperties", true, false, {
                properties: properties
            });
        }
    },

    setObjectProperty: {
        value: function (property, value) {
            var properties = {};
            properties[property] = value;
            this._dispatchDidChangeObjectProperties(properties);
            this.properties.set(property, value);
        }
    },

    getObjectProperty: {
        value: function (property) {
            return this.properties.get(property);
        }
    },

    deleteObjectProperty: {
        value: function (property) {
            this.properties.delete(property);
        }
    },

    setObjectProperties: {
        value: function (values) {
            this._dispatchDidChangeObjectProperties(values);
            for (var name in values) {
                if (values.hasOwnProperty(name)) {
                    this.setObjectProperty(name, values[name]);
                }
            }
        }
    },

    getObjectProperties: {
        value: function (values) {
            var result = {},
                keys,
                index,
                key,
                value;

            if (values) {
                // We have a values object only returmn the required values
                for (var name in values) {
                    if (values.hasOwnProperty(name)) {
                        result[name] = this.getObjectProperty(name);
                    }
                }
            } else {
                // return all properties
                values = this.properties.values();
                keys = this.properties.keys();

                for (index = 0; (typeof (key = keys[index]) !== "undefined") &&  (typeof (value = values[index]) !== "undefined"); index++) {
                    result[key] = value;
                }
            }
            return result;
        }
    },

    // Schematic Information
    x: {
        value: null
    },

    y: {
        value: null
    },

    comment: {
        value: null
    }

});
