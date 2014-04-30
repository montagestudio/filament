var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    Document = require("core/document").Document,
    SORTERS = require("core/sorters"),
    ProxySerializer = require("core/serialization/proxy-serializer").ProxySerializer,
    ProxyReviver = require("core/serialization/proxy-reviver").ProxyReviver,
    ProxyContext = require("core/serialization/proxy-context").ProxyContext;

exports.EditingDocument = Document.specialize( {

    constructor: {
        value: function EditingDocument() {
            this.super();
            this._editingProxyMap = {};
            this.selectedObjects = [];
            this.highlightedElements = [];
            this.errors = [];
        }
    },

    propertyChangesDispatchingEnabled: {
        value: true
    },

    init: {
        value: function (fileUrl, dataSource, packageRequire) {
            this.super(fileUrl, dataSource);
            this._packageRequire = packageRequire;
            return this;
        }
    },

    deserializationContext: {
        value: function (serialization, objects) {
            var context = new this.contextConstructor().init(serialization, new this.reviverConstructor(), objects);
            context.editingDocument = this;
            return context;
        }
    },

    reviverConstructor: {
        value: ProxyReviver
    },

    contextConstructor: {
        value: ProxyContext
    },

    serializerConstructor: {
        value: ProxySerializer
    },

    _buildSerializationObjects: {
        value: function () {
            return {};
        }
    },

    serializationForProxy: {
        value: function (proxy) {
            var serializer = new this.serializerConstructor().initWithRequire(this._packageRequire);
            var serialization = JSON.parse(serializer.serializeObject(proxy))[proxy.label];
            return SORTERS.unitSorter(serialization);
        }
    },

    //TODO this will probably be actually discovered at the project level, maybe stored here? or is this just an accessor?
    errors: {
        value: null
    },

    /**
     * @deprecated
     * @see url
     */
    fileUrl: {
        get: function () {
            return this._url;
        }
    },

    _packageRequire: {
        value: null
    },

    packageRequire: {
        get: function () {
            return this._packageRequire;
        }
    },

    getOwnedObjectProperty: {
        value: function (proxy, property) {
            return proxy.getObjectProperty(property);
        }
    },

    getOwnedObjectProperties: {
        value: function (proxy, values) {
            return proxy.getObjectProperties(values);
        }
    },

    setOwnedObjectProperty: {
        value: function (proxy, property, value) {

            var undoManager = this.undoManager,
                undoneValue = proxy.getObjectProperty(property);

            if (value === undoneValue) {
                // The values are identical no need to do anything.
                return;
            }

            //TODO maybe the proxy shouldn't be involved in doing this as we hand out the proxies
            // throughout the editingEnvironment, I don't want to expose accessible editing APIs
            // that do not go through the editingDocument...or do I?

            // Might be nice to have an editing API that avoids undoability and event dispatching?
            proxy.setObjectProperty(property, value);

            undoManager.register("Set Property", Promise.resolve([this.setOwnedObjectProperty, this, proxy, property, undoneValue]));
            this._dispatchDidSetOwnedObjectProperty(proxy, property, value);
        }
    },

    setOwnedObjectProperties: {
        value: function (proxy, values) {

            var undoManager = this.undoManager,
                undoneValues = proxy.getObjectProperties(values);

            var identicalValues = true;
            for (var name in values) {
                if (values[name] !== undoneValues[name]) {
                    identicalValues = false;
                    break;
                }
            }
            if (identicalValues) {
                return;
            }

            //TODO maybe the proxy shouldn't be involved in doing this as we hand out the proxies
            // throughout the editingEnvironment, I don't want to expose accessible editing APIs
            // that do not go through the editingDocument...or do I?

            // Might be nice to have an editing API that avoids undoability and event dispatching?
            proxy.setObjectProperties(values);

            undoManager.register("Set Properties", Promise.resolve([this.setOwnedObjectProperties, this, proxy, undoneValues]));
            this._dispatchDidSetOwnedObjectProperties(proxy, values);
        }
    },

    /**
     * Sets the label of the given proxy
     * @param  {EditingProxy}       proxy
     * @param  {string} newLabel    The label to set
     * @return {boolean}            true if the label was changed, false if
     * not, because the label already existed
     */
    setOwnedObjectLabel: {
        value: function (proxy, newLabel) {
            var proxyMap = this._editingProxyMap,
                oldLabel = proxy.label;

            //TODO report an error when given an invalid label e.g. no label or label already exists
            if (newLabel && !proxyMap[newLabel]) {
                // add new label and current reference in editingProxyMap
                proxyMap[newLabel] = proxy;
                delete proxyMap[oldLabel];

                //TODO dispatch change for identifier etc.?
                proxy.label = newLabel;

                this.undoManager.register("Set Label", Promise.resolve([this.setOwnedObjectLabel, this, proxy, oldLabel]));
                this._dispatchDidSetOwnedObjectLabel(proxy, newLabel, oldLabel);
                return true;
            }
            return false;
        }
    },

    // Editing Model

    _addProxies: {
        value: function (proxies) {
            var self = this;

            this.dispatchBeforeOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchBeforeOwnPropertyChange("editingProxies", this.editingProxies);

            if (Array.isArray(proxies)) {
                proxies.forEach(function (proxy) {
                    self.__addProxy(proxy);
                });
            } else {
                self.__addProxy(proxies);
            }

            this.dispatchOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchOwnPropertyChange("editingProxies", this.editingProxies);
        }
    },

    __addProxy: {
        value: function (proxy) {
            var proxyMap = this._editingProxyMap;

            proxyMap[proxy.label] = proxy;

            //TODO not simply stick this on the object; the inspector needs it right now
            proxy.packageRequire = this._packageRequire;
        }
    },

    _replaceProxies: {
        value: function(proxies) {
            this.dispatchBeforeOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchBeforeOwnPropertyChange("editingProxies", this.editingProxies);

            this._editingProxyMap.clear();
            proxies.forEach(function (proxy) {
                this.__addProxy(proxy);
            }, this);

            this.dispatchOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchOwnPropertyChange("editingProxies", this.editingProxies);
        }
    },

    _removeProxies: {
        value: function (proxies) {
            var self = this;

            this.dispatchBeforeOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchBeforeOwnPropertyChange("editingProxies", this.editingProxies);

            if (Array.isArray(proxies)) {
                proxies.forEach(function (proxy) {
                    self.__removeProxy(proxy);
                });
            } else {
                self.__removeProxy(proxies);
            }

            this.dispatchOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchOwnPropertyChange("editingProxies", this.editingProxies);
        }
    },

    __removeProxy: {
        value: function (proxy) {
            var proxyMap = this._editingProxyMap;

            if (!proxyMap.hasOwnProperty(proxy.label)) {
                throw new Error("Could not find proxy to remove with label '" + proxy.label + "'");
            }
            delete proxyMap[proxy.label];
        }
    },


    _editingProxyMap: {
        value: null
    },

    /*
     * Returns the poxy map
     */
    editingProxyMap: {
        get: function () {
            return this._editingProxyMap;
        }
    },

    editingProxies: {
        get: function () {
            //TODO cache this
            var proxyMap = this._editingProxyMap,
                labels = Object.keys(proxyMap);

            return labels.map(function (label) {
                return proxyMap[label];
            });
        }
    },

    editingProxyForObject: {
        value: function (object) {
            var label = Montage.getInfoForObject(object).label,
                proxy = this._editingProxyMap[label];

            // label is undefined for the owner component
            if (label && !proxy) {
                throw new Error("No editing proxy found for object with label '" + label + "'");
            }

            return proxy;
        }
    },


    // Selection API

    selectObjectsOnAddition: {
        value: true
    },

    selectedObjects: {
        value: null
    },

    // Selects nothing
    clearSelectedObjects: {
        value: function () {
            this.selectedObjects.clear();
        }
    },

    // Remove object from current set of selectedObjects
    deselectObject: {
        value: function (object) {
            var index = this.selectedObjects.indexOf(object);
            if (index >= 0) {
                this.selectedObjects.splice(index, 1);
            }
        }
    },

    // Add object to current set of selectedObjects
    selectObject: {
        value: function (object) {
            var selectedObjects = this.selectedObjects;

            if (object && selectedObjects.indexOf(object) === -1) {
                //TODO what is the order ofthe selectedObjects?
                selectedObjects.push(object);
            }
            //TODO otherwise, do we remove it here?

        }
    },

    highlightedElements: {
        value: null
    },

    // Selects nothing
    clearHighlightedElements: {
        value: function () {
            this.highlightedElements.clear();
        }
    },

    // Remove object from current set of highlightedElements
    deHighlightElement: {
        value: function (object) {
            var index = this.highlightedElements.indexOf(object);
            if (index >= 0) {
                this.highlightedElements.splice(index, 1);
            }
        }
    },

    // Add object to current set of highlightedElements
    highlightElement: {
        value: function (object) {
            var highlightedElements = this.highlightedElements;

            if (highlightedElements.indexOf(object) === -1) {
                //TODO what is the order of the highlightedElements?
                highlightedElements.push(object);
            }
            //TODO otherwise, do we remove it here?

        }
    },

    _dispatchDidSetOwnedObjectProperty: {
        value: function(proxy, property, value) {
            if (this.propertyChangesDispatchingEnabled) {
                this.dispatchEventNamed("didSetOwnedObjectProperty", true, false, {
                    proxy: proxy,
                    property: property,
                    value: value
                });
            }
        }
    },

    _dispatchDidSetOwnedObjectProperties: {
        value: function(proxy, values) {
            if (this.propertyChangesDispatchingEnabled) {
                this.dispatchEventNamed("didSetOwnedObjectProperties", true, false, {
                    proxy: proxy,
                    values: values
                });
            }
        }
    },

    _dispatchDidSetOwnedObjectLabel: {
        value: function(proxy, newLabel, oldLabel) {
            if (this.propertyChangesDispatchingEnabled) {
                this.dispatchEventNamed("didSetOwnedObjectLabel", true, false, {
                    proxy: proxy,
                    newLabel: newLabel,
                    oldLabel: oldLabel
                });
            }
        }
    },
});
