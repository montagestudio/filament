/**
 * @module ui/component-tree.reel
 */
var Component = require("montage/ui/component").Component,
    CellModule = require("./cell.reel"),
    CellType = CellModule.CellType,
    Montage = require("montage").Montage,
    MultiMap = require("montage/collections/multi-map").MultiMap,
    SortedSet = require("montage/collections/sorted-set").SortedSet;

var NodeSet = Montage.specialize({

    array: {
        value: null
    },

    constructor: {
        value: function NodeSet(parentNode, propertyName, sortKey, mapper) {
            var self = this;
            this.array = [];
            this._collection = new SortedSet(
                null,
                function (a, b) {
                    return a[sortKey] === b[sortKey];
                },
                function (a, b) {
                    return a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
                }
            );
            function handleValueChange(value) {
                SortedSet.prototype.push.apply(self._collection, (value || []).map(mapper));
                self.array = self._collection.toArray();
            }
            parentNode.addPathChangeListener("proxy." + propertyName, handleValueChange);
            parentNode.addPathChangeListener("ownerProxy." + propertyName, handleValueChange);
        }
    }
})

var EntityNode = Montage.specialize({

    type: {
        value: CellType.Entity
    },

    ownerProxy: {
        value: null
    },

    constructor: {
        value: function EntityNode(entity, componentTree) {
            var self = this;
            this.proxy = entity;
            this.componentTree = componentTree;

            this.propertyNodes = new NodeSet(this, "properties", "key", function (value, key) {
                return {
                    type: CellType.Property,
                    key: key
                };
            });
            this.propertyNodes.addOwnPropertyChangeListener("array", this._dispatchChildrenChange.bind(this));

            this.listenerNodes = new NodeSet(this, "listeners", "type", function (listener) {
                return {
                    type: CellType.Listener,
                    eventType: listener.type
                };
            });
            this.listenerNodes.addOwnPropertyChangeListener("array", this._dispatchChildrenChange.bind(this));

            this.functionNodes = new NodeSet(this, "functions", "identifier", function (value, key) {
                return {
                    type: CellType.Function,
                    identifier: key
                };
            });
            this.functionNodes.addOwnPropertyChangeListener("array", this._dispatchChildrenChange.bind(this));

            this.classNodes = new NodeSet(this, "classes", "name", function (name) {
                return {
                    type: CellType.Class,
                    name: name
                };
            });
            this.classNodes.addOwnPropertyChangeListener("array", this._dispatchChildrenChange.bind(this));

            this.entityNodes = [];
            this._dispatchChildrenChange();

            this.componentTree.addOwnPropertyChangeListener("showProperties", this._dispatchChildrenChange.bind(this));
            this.componentTree.addOwnPropertyChangeListener("showListeners", this._dispatchChildrenChange.bind(this));
            this.componentTree.addOwnPropertyChangeListener("showFunctions", this._dispatchChildrenChange.bind(this));
            this.componentTree.addOwnPropertyChangeListener("showClasses", this._dispatchChildrenChange.bind(this));
        }
    },

    children: {
        get: function () {
            return []
                .concat(this.componentTree.showProperties ? this.propertyNodes.array : [])
                .concat(this.componentTree.showListeners ? this.listenerNodes.array : [])
                .concat(this.componentTree.showFunctions ? this.functionNodes.array : [])
                .concat(this.componentTree.showClasses ? this.classNodes.array : [])
                .concat(this.entityNodes);
        }
    },

    _dispatchChildrenChange: {
        value: function () {
            this.dispatchOwnPropertyChange("children", this.children);
        }
    }
});

/**
 * @class StructureExplorer
 * @extends Component
 */
exports.ComponentTree = Component.specialize(/** @lends ComponentTree# */ {

    reelDocumentFactory: {
        value: null
    },

    tree: {
        value: null
    },

    showProperties: {
        value: true
    },

    showListeners: {
        value: true
    },

    showFunctions: {
        value: true
    },

    showClasses: {
        value: true
    },

    /**
     * @type {MultiMap.<EntityProxy, Object>}
     */
    _proxyMap: {
        value: null
    },

    _treeNodeForProxy: {
        value: function (proxy) {
            var node = new EntityNode(proxy, this);
            node.entityNodes = proxy.children.map(this._treeNodeForProxy.bind(this));
            this._proxyMap.get(proxy).push(node);
            return node;
        }
    },

    expandProxy: {
        value: function (proxy) {
            var self = this;
            this.reelDocumentFactory.makeReelDocument(proxy.moduleId)
                .then(function (doc) {
                    self._proxyMap.get(proxy)
                        .forEach(function (node) {
                            node.ownerProxy = doc.entityTree;
                            node.entityNodes = doc.entityTree.children.map(self._treeNodeForProxy.bind(self));
                        });
                    self.tree.handleTreeChange();
                })
                .catch(Function.noop);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var self = this;
            if (firstTime) {
                this._proxyMap = new MultiMap();
                this.element.addEventListener("click", this, false);
                this.reelDocumentFactory.makeReelDocument("ui/main.reel")
                    .then(function (doc) {
                        self.data = self._treeNodeForProxy(doc.entityTree);
                        self.tree.handleTreeChange();
                    });
            }
        }
    },

    handleClick: {
        value: function (evt) {
            var target = evt.target;
            if (target === this.tree.element) {
                this.componentTreeController.clearSelection();
            }
        }
    }
});
