var Target = require("montage/core/target").Target,
    Map = require("montage/collections/map"),
    Url = require("core/url");

/**
 * A wrapper for NodeProxies and ReelProxies. While {@link ReelDocument} treats
 * DOM nodes and serialization objects of a component separately, the Component
 * tree fuses the two together.
 *
 * This abstraction glues the two proxies together and provides a common
 * interface.
 *
 * @class EntityProxy
 * @extends Target
 */
exports.EntityProxy = Target.specialize({

    _reelDocument: {
        value: null
    },

    _nodeProxy: {
        value: null
    },

    _reelProxy: {
        value: null
    },

    /**
     * @type {String}
     */
    proxyType: {
        get: function() {
            return "EntityProxy";
        }
    },

    /**
     * @type {Boolean}
     */
    hasComponent: {
        get: function () {
            return !!this._reelProxy;
        }
    },

    /**
     * @type {Boolean}
     */
    hasTemplate: {
        get: function () {
            return !!this._nodeProxy;
        }
    },

    /**
     * @type {Boolean}
     */
    isOwner: {
        get: function () {
            return this._isOwner;
        }
    },
    _isOwner: {
        value: false
    },

    /**
     * A friendly name for the proxy (component name, class name, tag name, etc.).
     * Uses the most specific label available.
     *
     * @type {String}
     */
    label: {
        get: function () {
            var exportName;
            if (this.isOwner) {
                // TODO: Use of private field
                exportName = this._reelDocument._exportName;
                return exportName[0].toUpperCase() + exportName.slice(1, exportName.length);
            } else if (this.hasTemplate && this._nodeProxy.montageId) {
                return this._nodeProxy.montageId;
            } else if (this.hasComponent) {
                return this._reelProxy.label;
            } else if (this._nodeProxy.className) {
                return this._nodeProxy.className;
            }
            return this._nodeProxy.tagName.toLowerCase();
        }
    },

    /**
     * Denotes which data the label is derived from.
     *
     * @type {String}
     */
    labelType: {
        get: function () {
            if (this.isOwner) {
                return "component";
            } else if (this.hasTemplate && this._nodeProxy.montageId) {
                return "data-montage-id";
            } else if (this.hasComponent) {
                return "label";
            } else if (this._nodeProxy.className) {
                return "class";
            }
            return "tagName";
        }
    },

    /**
     * The module id of this proxy's component. If the proxy is an owner,
     * the module id will be the id of the component. If the proxy is a
     * component instance, it will be the id of the prototype. Otherwise,
     * it will be null.
     *
     * @type {?String}
     */
    moduleId: {
        get: function () {
            if (this.hasComponent && this._reelProxy.moduleId.match(/^ui\//)) {
                return this._reelProxy.moduleId;
            }
            return null;
        }
    },

    /**
     * @type {?Map<String, Any>}
     */
    properties: {
        get: function () {
            return this._properties;
        }
    },
    _properties: {
        value: null
    },

    /**
     * @type {?Array<Object>}
     */
    listeners: {
        get: function () {
            return this._reelProxy ? this._reelProxy.listeners : null;
        }
    },

    /**
     * A map of the component's functions. Null if the proxy is not an owner.
     * The value in this map is an object with a "parameters" array and a
     * definition string.
     *
     * @type {?Object}
     */
    functions: {
        get: function () {
            return this._functions;
        }
    },
    _functions: {
        value: null
    },

    /**
     * @type {?Array<String>}
     */
    classes: {
        get: function () {
            if (this.hasTemplate) {
                return this._nodeProxy.className.length > 0 ?
                    this._nodeProxy.className.split(" ") :
                    [];
            }
            return null;
        }
    },

    parentEntity: {
        value: null
    },

    /**
     * @type {EntityProxy[]}
     */
    children: {
        value: null
    },

    /**
     * @function
     * @param proxy {(NodeProxy|ReelProxy)} The nodeProxy or reelProxy that
     * belong to the entity being represented. If the entity has both proxies,
     * either can be provided.
     * @param reelDocument {ReelDocument} The ReelDocument of the entity that
     * this node will represent. Used to listen for changes.
     * @param isOwner {Boolean} Whether the proxy is the owner of the given
     * reelDocument. If so, the properties and methods defined in the
     * reelDocument will be added to this proxy's data. Also, the components
     * defined in the document's serialization that have no DOM element will
     * be assumed to be top-level components and will be added to this proxy's
     * children.
     * @return this
     */
    init: {
        value: function (proxy, reelDocument, isOwner) {
            var self = this;
            if (proxy.proxyType !== "NodeProxy" && proxy.proxyType !== "ProxyObject") {
                throw new TypeError("Can't initialize EntityProxy with a proxy of type " + proxy.proxyType);
            }
            this._nodeProxy = (proxy.proxyType === "NodeProxy") ? proxy : (proxy.properties.get("element") || null);
            this._reelProxy = (proxy.proxyType === "ProxyObject") ? proxy : (proxy.component || null);
            this._reelDocument = reelDocument;
            if (this.hasComponent) {
                this._properties = new Map;
                function addSerializationProperty(value, key) {
                    self._properties.set(key, {
                        key: key,
                        value: value,
                        binding: "oneshot",
                        source: "serialization"
                    });
                }
                this._reelProxy.properties.forEach(addSerializationProperty);
                this._reelProxy.properties.addMapChangeListener(addSerializationProperty);
            }
            if (isOwner) {
                this._isOwner = true;
                Promise.resolve(reelDocument.javascriptProperties)
                    .then(function (properties) {
                        for (var key in properties) {
                            if (properties.hasOwnProperty(key)) {
                                self._properties.set(key, {
                                    key: key,
                                    value: properties[key],
                                    binding: "oneshot",
                                    source: "javascript"
                                });
                            }
                        }
                        self.dispatchOwnPropertyChange("properties", self.properties);
                    })
                    .catch(Function.noop);
                Promise.resolve(reelDocument.functions)
                    .then(function (functions) {
                        self._functions = new Map;
                        for (var key in functions) {
                            if (functions.hasOwnProperty(key)) {
                                self._functions.set(key, null);
                            }
                        }
                        self.dispatchOwnPropertyChange("functions", self.functions);
                    })
                    .catch(Function.noop);
            }
            this.children = this._topLevelComponentChildren().concat(this._domChildren());
            return this;
        }
    },

    _topLevelComponentChildren: {
        value: function () {
            var self = this,
                children = [],
                childProxy;
            if (this.isOwner && this._reelDocument.editingProxies) {
                this._reelDocument.editingProxies.forEach(function (proxy) {
                    if (!proxy.properties.has("element")) {
                        childProxy = new self.constructor().init(proxy, self._reelDocument);
                        children.push(childProxy);
                        childProxy.parentEntity = self;
                    }
                });
            }
            return children;
        }
    },

    _domChildren: {
        value: function () {
            var self = this,
                children = [],
                childProxy;
            if (this._nodeProxy && this._nodeProxy.children) {
                this._nodeProxy.children.forEach(function (proxy) {
                    childProxy = new self.constructor().init(proxy, self._reelDocument);
                    children.push(childProxy);
                    childProxy.parentEntity = self;
                });
            }
            return children;
        }
    }
});
