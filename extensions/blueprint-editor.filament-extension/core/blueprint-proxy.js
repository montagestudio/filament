var Montage = require("montage").Montage,
    EditingProxy = require("palette/core/editing-proxy").EditingProxy;

exports.BlueprintProxy = Montage.create(EditingProxy, {

    init:{
        value:function (label, editingDocument, proxiedObject) {
            var self = EditingProxy.init.call(this, label, editingDocument);

            self._proxiedObject = proxiedObject;
            self._exportId = Object.getPrototypeOf(proxiedObject);

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

    moduleId:{
        get:function () {
            return Montage.getInfoForObject(this._proxiedObject).moduleId;
        }
    },

    exportName:{
        get:function () {
            return Montage.getInfoForObject(this._proxiedObject).objectName;
        }
    },

    packageRequire:{
        get:function () {
            return Montage.getInfoForObject(this._proxiedObject).require;
        }
    },

    properties: {
        get: function () {
            return this._proxiedObject;
        }
    }

});
