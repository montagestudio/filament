var Montage = require("montage").Montage,
    EditingProxy = require("palette/core/editing-proxy").EditingProxy,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver;


exports.BlueprintObjectProxy = EditingProxy.specialize({

    constructor: {
        value: function BlueprintObjectProxy() {
            this.super();
        }
    },

    init: {
        value: function (label, serialization, exportId, editingDocument) {
            var self = EditingProxy.init.call(this, label, serialization, exportId, editingDocument);

            self._exportId = exportId || serialization.prototype;

            if (self.moduleId && (self.moduleId !== "") && self.exportName && (self.exportName !== "")) {
                self.editingDocument.packageRequire.async(self.moduleId).get(self.exportName).then(function (target) {
                    if (target && target.blueprint) {
                        self._proxiedObject = target;
                        target.blueprint.then(function (blueprint) {
                            self.dispatchBeforeOwnPropertyChange("objectBlueprint", self._objectBlueprint);
                            self._objectBlueprint = blueprint;
                            self.dispatchOwnPropertyChange("objectBlueprint", blueprint);
                        },function (error) {
                            throw(new Error("Could not load blueprint for: " + self.moduleId + "[" + self.exportName + "]", error));
                        }).done();
                    } else {
                        // We say nothing. There could be reference that are implicitily created
                        throw(new Error("Target module has no blueprint: " + self.moduleId + "[" + self.exportName + "]"));
                    }
                },function (error) {
                    throw(new Error("Could not load module: " + self.moduleId + "[" + self.exportName + "]", error));
                }).done();
            } else {
                self.objectBlueprint = null;
            }

            return self;
        }
    },

    _proxiedObject: {
        value: null
    },


    proxiedObject: {
        get: function () {
            return this._proxiedObject;
        }
    },

    _objectBlueprint: {
        value: null
    },


    objectBlueprint: {
        get: function () {
            return this._objectBlueprint;
        }
    },

    getObjectProperty: {
        value: function (property) {
            var value = this.properties.get(property);
            if ((typeof value === "undefined") && this.proxiedObject) {
                value = this.proxiedObject[property];
            }
            return value;
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
                this._moduleId = MontageReviver.parseObjectLocationId(this._exportId).moduleId;
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

    packageRequire: {
        get: function () {
            return this.editingDocument.packageRequire;
        }
    }

})
;
