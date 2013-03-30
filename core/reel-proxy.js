var Montage = require("montage").Montage,
    Bindings = require("montage/core/bindings").Bindings,
    EditingProxy = require("palette/core/editing-proxy").EditingProxy,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver;

/**
 * The ReelProxy is an EditingProxy for objects that can be declared in a component's template.
 * This describes any Montage object such as visual components or non-visual controllers.
 *
 * Combined with the overarching EditingDocument the EditingProxies make up what can be
 * referred to as the EditingModel.
 *
 * While there may be a visual representation of the ReelProxy rendered somewhere in an editor
 * the authoritative model that is used to render the final output of the EditingDocument is
 * captured in the EditingModel alone.
 *
 * Editors of rich objects may need to interact with live objects to provide a
 * friendly editing experience. In this case, the editor must take up the burden of
 * performing edits through whatever APIs make the most sense at the time in addition to
 * writing the final changes to the affected EditingProxies. Again, if changes are not
 * captured by EditingProxies the changes are not known to the EditingModel.
 *
 * EditingProxies are not typically intended to be edited directly, though they do provide
 * methods to do so. Instead the EditingDocument, which houses a collection of EditingProxies,
 * exposes editing APIs which emit editing events and are recorded on included UndoManager.
 *
 * The editing methods on the EditingProxies is reserved for use by the EditingDocument itself
 * or any other editing which should circumvent the usual event emitting and undo recording;
 * even this usage is not currently advised.
 * @type {ReelProxy}
 */
exports.ReelProxy = Montage.create(EditingProxy,  {

    /**
     * The require for the package this proxy is used within
     */
    packageRequire: {
        get: function () {
            return this.editingDocument.packageRequire;
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

    _serialization: {
        value: null
    },

    /**
     * The combined serialization units used to populate the declaration of the represented object
     * @note The prototype or object property as well as the properties, bindings, and listeners units
     */
    serialization: {
        get: function () {
            return this._serialization;
        }
    },

    /**
     * The dictionary of the properties serialization unit
     */
    properties: {
        get: function () {
            return this.serialization.properties;
        }
    },

    /**
     * The dictionary of the serialization bindings unit
     */
    bindings: {
        get: function () {
            return this.serialization.bindings || null;
        }
    },

    /**
     * The dictionary of the listeners serialization unit
     */
    listeners: {
        get: function () {
            return this.serialization.listeners || null;
        }
    },

    /**
     * The live object this editingProxy is representing
     * @note Edits made to the proxy are set on the live objects, this may not be the case forever
     * as there's really no way to know whether setting properties in a declaration translates
     * to setting values at runtime without issue.
     */
    stageObject: {
        value: null
    },

    /**
     * Initialize an ReelProxy suitable for editing through an EditingDocument
     *
     * @param {string} label The label for this object within the EditingDocument
     * @param {object} serialization The serialization block used to declare this object in the EditingDocument's template
     * @param {EditingDocument} editingDocument The editingDocument that owns this editingObject
     * @param {string} exportId The string used as the exportId of the object represented by this editingObject
     */
    init: {
        value: function (label, serialization, editingDocument, exportId) {

            if (exportId && serialization.prototype && exportId !== serialization.prototype) {
                throw new Error("Conflicting serialization prototype and exportId values provided for ReelProxy");
            }
            //TODO make sure that if the serialization specifically had no prototype, we don't go and write one in when saving

            var self = EditingProxy.init.call(this, label, editingDocument);
            self._serialization = serialization;
            self._exportId = exportId || serialization.prototype;
            return self;
        }
    },

    setObjectProperty: {
        value: function (property, value) {

            if (!this.serialization.properties) {
                this.serialization.properties = {};
            }

            // Set property in an observable fashion, just in case it's a new property being added
            Montage.setPath.call(this.serialization.properties, property, value);

            if (this.stageObject) {
                //TODO how do we know what to do on the other side? Objects may not react well to setting values at runtime
                if (this.stageObject.setPath) {
                    this.stageObject.setPath(property, value);
                } else if (this.stageObject.setProperty) {
                    this.stageObject.setProperty(property, value);
                }
            }
        }
    },

    deleteObjectProperty: {
        value: function (property) {

            if (!this.serialization.properties || !this.serialization.properties.hasOwnProperty(property)) {
                throw new Error("Cannot remove nonexistent property '" + property + "'");
            }

            delete this.serialization.properties[property];

            if (!Object.keys(this.serialization.properties).length) {
                delete this.serialization.properties;
            }

            if (this.stageObject) {
                if (this.stageObject.setPath) {
                    this.stageObject.setPath(property, null);
                } else if (this.stageObject.setProperty) {
                    this.stageObject.setProperty(property, null);
                }
            }
        }
    },

    defineObjectBinding: {
        value: function (sourceObjectPropertyPath, boundObject, boundObjectPropertyPath, oneWay, converter) {
            //TODO handle converter

            if (!this.serialization.bindings) {
                this.serialization.bindings = {};
            }

            var arrow = (oneWay ? "<-" : "<->"),
                bindingSerialization = {},
                bindingDescriptor;

            //TODO what happenes when the labels change, we should either update or indicate they're broken...
            //TODO what happens if the serialization format changes, we shouldn't be doing this ourselves
            // we should rely on the serializer of the package's version of montage

            bindingSerialization[arrow] = "@" + boundObject.label + "." + boundObjectPropertyPath;
            this.serialization.bindings[sourceObjectPropertyPath] = bindingSerialization;

            if (this.stageObject) {
                bindingDescriptor = {};
                bindingDescriptor[arrow] = boundObjectPropertyPath;
                bindingDescriptor.source = boundObject.stageObject;

                if (converter) {
                    bindingDescriptor.converter = converter;
                }

                if (this.stageObject.getBinding(sourceObjectPropertyPath)) {
                    this.stageObject.cancelBinding(sourceObjectPropertyPath);
                }
                this.stageObject.defineBinding(sourceObjectPropertyPath, bindingDescriptor);
            }
        }
    },

    cancelObjectBinding: {
        value: function (sourceObjectPropertyPath) {
            delete this.serialization.bindings[sourceObjectPropertyPath];

            if (this.stageObject) {
                this.stageObject.cancelBinding(sourceObjectPropertyPath);
            }
        }
    }

});
