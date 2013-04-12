var Montage = require("montage").Montage,
    Bindings = require("montage/core/bindings").Bindings,
    EditingProxy = require("palette/core/editing-proxy").EditingProxy,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    Map = require("montage/collections/map");

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
     * The identifier of the representedObject
     */
    identifier: {
        get: function () {
            return this.getPath("properties.get('identifier')") || this.label;
        },
        set: function (value) {
            if (value !== this.identifier) {
                this.setObjectProperty("identifier", value);
            }
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
     * The parent component of this object. For non-component objects this is
     * the owner.
     */
    parentProxy: {
        value: null
    },

    /**
     * Initialize an ReelProxy suitable for editing
     *
     * @param {string} label The label for the represented object within a template
     * @param {object} serialization The revived serialization of the represented object
     * @param {string} exportId The string used as the exportId of the represented object if none is found in the serialization
     */
    init: {
        //TODO not pass along a reference to the editingDocument as part of the proxy itself
        // it's being done out of convenience to help out the inspector but I'm not sure I like
        // that
        value: function (label, serialization, exportId, editingDocument) {

            if (!exportId && !serialization.prototype && !serialization.object) {
                throw new Error("No exportId provided or found for template object with label '" + label + "'");
            }

            if (exportId && serialization.prototype && exportId !== serialization.prototype) {
                throw new Error("Conflicting serialization prototype and exportId values provided template object with label '" + label + "'");
            }

            if (serialization.object && serialization.prototype) {
                throw new Error("Serialization for object with label '" + label +  "' cannot have both 'prototype' and 'object' attributes");
            }

            //TODO make sure that if the serialization specifically had no prototype, we don't go and write one in when saving

            var self = EditingProxy.init.call(this, label, editingDocument);
            self._exportId = exportId || serialization.prototype || serialization.object;

            this._populateWithSerialization(serialization);

            return self;
        }
    },

    _populateWithSerialization: {
        value: function (serialization) {
            this._properties = new Map(serialization.properties);

            var bindings = [];
            for (var key in serialization.bindings) {
                if (serialization.bindings.hasOwnProperty(key)) {
                    var bindingEntry = serialization.bindings[key];
                    var bindingDescriptor = {
                        targetPath: key,
                        twoWay: "<->" in bindingEntry
                    };
                    bindingDescriptor.sourcePath = bindingDescriptor.twoWay ? bindingEntry["<->"] : bindingEntry["<-"];

                    bindings.push(bindingDescriptor);
                }
            }
            this._bindings = bindings;

            var listeners = [];
            if (serialization.listeners) {
                listeners = serialization.listeners.map(function (listenerEntry) {
                    return {
                        //TODO resolve the listener reference
                        listener: listenerEntry.listener,
                        type: listenerEntry.type,
                        useCapture: listenerEntry.useCapture
                    };
                });
            }
            this._listeners = listeners;
        }
    },

    /**
     * The map of properties that should be applied to the object this proxy represents
     */
    properties: {
        get: function () {
            return this._properties;
        }
    },

    _bindings: {
        value: null
    },

    /**
     * The collection of bindings associated with the object this proxy represents
     */
    bindings: {
        get: function () {
            return this._bindings;
        }
    },

    _listeners: {
        value: null
    },

    /**
     * The collection of listeners observing the object this proxy represents
     */
    listeners: {
        get: function () {
            return this._listeners;
        }
    },

    setObjectProperty: {
        value: function (property, value) {
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

    //TODO update this to not use serialization
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

    //TODO update this to not use serialization
    cancelObjectBinding: {
        value: function (sourceObjectPropertyPath) {
            delete this.serialization.bindings[sourceObjectPropertyPath];

            if (this.stageObject) {
                this.stageObject.cancelBinding(sourceObjectPropertyPath);
            }
        }
    }

});
