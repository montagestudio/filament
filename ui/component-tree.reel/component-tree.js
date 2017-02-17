/**
 * @module ui/component-tree.reel
 */
var Component = require("montage/ui/component").Component,
    CellModule = require("./cell.reel"),
    CellType = CellModule.CellType,
    Montage = require("montage").Montage,
    SortedSet = require("montage/collections/sorted-set").SortedSet;

var EntityNode = Montage.specialize({

    type: {
        value: CellType.Entity
    },

    constructor: {
        value: function EntityNode(entity, componentTree) {
            var self = this;
            this.proxy = entity;
            this.componentTree = componentTree;

            this.propertyNodes = this._createNodeContainer("properties", "key", function (value, key) {
                return {
                    type: CellType.Property,
                    key: key
                };
            });
            this.listenerNodes = this._createNodeContainer("listeners", "type", function (listener) {
                return {
                    type: CellType.Listener,
                    eventType: listener.type
                };
            });
            this.functionNodes = this._createNodeContainer("functions", "identifier", function (value, key) {
                return {
                    type: CellType.Function,
                    identifier: key
                };
            });
            this.classNodes = this._createNodeContainer("classes", "name", function (name) {
                return {
                    type: CellType.Class,
                    name: name
                };
            });
            this.entityNodes = [];
            this._dispatchChildrenChange();

            this.componentTree.addOwnPropertyChangeListener("showProperties", this._dispatchChildrenChange.bind(this));
            this.componentTree.addOwnPropertyChangeListener("showListeners", this._dispatchChildrenChange.bind(this));
            this.componentTree.addOwnPropertyChangeListener("showFunctions", this._dispatchChildrenChange.bind(this));
            this.componentTree.addOwnPropertyChangeListener("showClasses", this._dispatchChildrenChange.bind(this));
        }
    },

    _createNodeContainer: {
        value: function (pluralName, sortKey, nodeMapper) {
            var self = this,
                set = new SortedSet(
                    this.proxy[pluralName] && this.proxy[pluralName].map(nodeMapper),
                    function (a, b) {
                        return a[sortKey] === b[sortKey];
                    },
                    function (a, b) {
                        return a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
                    }
                );
            this.proxy.addOwnPropertyChangeListener(pluralName, function (value) {
                set.clear();
                SortedSet.prototype.push.apply(set, (value || []).map(nodeMapper));
                self._dispatchChildrenChange();
            });
            return set;
        }
    },

    children: {
        get: function () {
            return []
                .concat(this.componentTree.showProperties ? this.propertyNodes.toArray() : [])
                .concat(this.componentTree.showListeners ? this.listenerNodes.toArray() : [])
                .concat(this.componentTree.showFunctions ? this.functionNodes.toArray() : [])
                .concat(this.componentTree.showClasses ? this.classNodes.toArray() : [])
                .concat(this.entityNodes);
        }
    },

    _dispatchChildrenChange: {
        value: function () {
            this.dispatchOwnPropertyChange("children", this.children);
        }
    },

    propertyNodes: {
        value: null
    },

    listenerNodes: {
        value: null
    },

    functionNodes: {
        value: null
    },

    classNodes: {
        value: null
    },

    entityNodes: {
        value: null
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
     * @type {Map.<EntityProxy, Object>}
     */
    _proxyMap: {
        value: null
    },

    _buildTree: {
        value: function () {
            var self = this;
            this.reelDocumentFactory.makeReelDocument("ui/main.reel")
                .then(function (doc) {
                    self.data = self._treeNodeForProxy(doc.entityTree);
                    self.tree.handleTreeChange();
                });
        }
    },

    _treeNodeForProxy: {
        value: function (proxy) {
            var node = new EntityNode(proxy, this);
            node.entityNodes = proxy.children.map(this._treeNodeForProxy.bind(this));
            this._proxyMap.set(proxy, node);
            return node;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._proxyMap = new Map();
                this.element.addEventListener("click", this, false);
                this._buildTree();
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
