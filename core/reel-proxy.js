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
exports.ReelProxy = Montage.create(EditingProxy, {

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

    // Schematic Information
    x: {
        value: null
    },

    y: {
        value: null
    },

    comment: {
        value: null
    },

    /**
     * The live object this editingProxy is representing
     * @note Edits made to the proxy are set on the live objects, this may not be the case forever
     * as there's really no way to know whether setting properties in a declaration translates
     * to setting values at runtime without issue.
     * @deprecated Don't use this for anything. I intend to remove this property to further decouple
     * the editing model from the live representation with the intent of being able to have a single
     * editingModel presented by several live presentations in different contexts at the same time;
     * there will be no definitive live representation to supply the editing model with.
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

            if (label !== "owner" && !exportId && !serialization.prototype && !serialization.object) {
                throw new Error("No exportId provided or found for template object with label '" + label + "'");
            }

            if (exportId && serialization.prototype && exportId !== serialization.prototype) {
                throw new Error("Conflicting serialization prototype and exportId values provided template object with label '" + label + "'");
            }

            if (serialization.object && serialization.prototype) {
                throw new Error("Serialization for object with label '" + label + "' cannot have both 'prototype' and 'object' attributes");
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
                    var bindingDescriptor = Object.create(null);

                    bindingDescriptor.targetPath = key;
                    bindingDescriptor.oneway = ("<-" in bindingEntry);
                    bindingDescriptor.sourcePath = bindingDescriptor.oneway ? bindingEntry["<-"] : bindingEntry["<->"];

                    bindings.push(bindingDescriptor);
                }
            }
            this._bindings = bindings;

            var listeners = [],
                listenerDescriptor;

            if (serialization.listeners) {
                listeners = serialization.listeners.map(function (listenerEntry) {
                    listenerDescriptor = Object.create(null);

                    //TODO resolve the listener reference
                    listenerDescriptor.listener = listenerEntry.listener;
                    listenerDescriptor.type = listenerEntry.type;
                    listenerDescriptor.useCapture = listenerEntry.useCapture;
                    return listenerDescriptor;
                });
            }
            this._listeners = listeners;

            if (serialization.lumieres) {
                this.comment = serialization.lumieres.comment;
                this.x = serialization.lumieres.x;
                this.y = serialization.lumieres.y;
            }
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

    defineObjectBinding: {
        value: function (targetPath, oneway, sourcePath) {
            var binding = Object.create(null);

            binding.targetPath = targetPath;
            binding.oneway = oneway;
            binding.sourcePath = sourcePath;

            this.bindings.push(binding);

            return binding;
        }
    },

    cancelObjectBinding: {
        value: function (binding) {
            var removedBinding,
                bindingIndex = this.bindings.indexOf(binding);

            if (bindingIndex > -1) {
                this.bindings.splice(bindingIndex, 1);
                removedBinding = binding;
            }

            return removedBinding;
        }
    },

    addObjectEventListener: {
        value: function (type, listener, useCapture) {
            var listenerModel = Object.create(null);

            //TODO check for duplicate entry already registered

            listenerModel.type = type;
            listenerModel.listener = listener;
            listenerModel.useCapture = useCapture;

            this.listeners.push(listenerModel);

            return listenerModel;
        }
    },

    removeObjectEventListener: {
        value: function (listener) {
            var removedListener,
                listenerIndex = this.listeners.indexOf(listener);

            if (listenerIndex > -1) {
                this.listeners.splice(listenerIndex, 1);
                removedListener = listener;
            }

            return removedListener;
        }
    }

});
