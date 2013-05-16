var Montage = require("montage").Montage,
    EditingProxy = require("palette/core/editing-proxy").EditingProxy,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver;


exports.BlueprintObjectProxy = Montage.create(EditingProxy, {

    init:{
        value:function (label, serialization, exportId, editingDocument) {
            var self = EditingProxy.init.call(this, label, serialization, exportId, editingDocument);

            self._proxiedObject = serialization;
            self._exportId = exportId || serialization.prototype;

            return self;
        }
    },

    _proxiedObject:{
        value:null
    },


    proxiedObject:{
        get: function() {
            return this._proxiedObject;
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

    packageRequire:{
        get:function () {
            return this.editingDocument.packageRequire;
        }
    }

});
