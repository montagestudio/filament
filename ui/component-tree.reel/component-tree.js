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

    isDropBeforeTarget: {
        value: false
    },

    isDropAfterTarget: {
        value: false
    },

    isDropChildTarget: {
        value: false
    },

    constructor: {
        value: function EntityNode(entity, componentTree, parentNode) {
            var self = this;
            this.proxy = entity;
            this.componentTree = componentTree;
            this.parentNode = parentNode;

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

var DragDelegate = Montage.specialize({

    _draggedNode: {
        value: null
    },
    draggedNode: {
        get: function () {
            return this._draggedNode;
        }
    },

    _touchedNodes: {
        value: null
    },

    constructor: {
        value: function DragDelegate(componentTree) {
            this._componentTree = componentTree;
            this._touchedNodes = new Set();
        }
    },

    /**
     * Signal the start of a cell drag action from the user. Doing so will
     * cause the tree to calculate where the node can be moved, and set flags
     * on nodes that are drop targets.
     *
     * @function
     * @param {Integer} row The row index of the cell, given by the cell info.
     * @param {EntityNode} entityNode The data of the cell being dragged.
     */
    beginDragging: {
        value: function (row, entityNode) {
            var componentOwnerNode,
                visitQueue,
                node;

            if (this._draggedNode === entityNode) {
                return;
            }
            this._draggedNode = entityNode;

            componentOwnerNode = entityNode.parentNode;
            while (!componentOwnerNode.ownerProxy) {
                componentOwnerNode = componentOwnerNode.parentNode;
            }

            // Iterate over the component owner's children recursively and
            // set each child's drop permissions with the following criteria:
            //                              |before|after|child|
            //                              -------------------
            // Node that is being dragged   |  no  | no  | no  |
            // Component node               |  yes | yes | no  |
            // DOM element node             |  yes | yes | yes |
            visitQueue = Array.prototype.slice.call(componentOwnerNode.entityNodes);
            while (visitQueue.length > 0) {
                node = visitQueue.shift();
                if (node === entityNode) {
                    continue;
                }
                this._touchedNodes.add(node);
                node.isDropBeforeTarget = true;
                node.isDropAfterTarget = true;
                if (node.ownerProxy) {
                    continue;
                }
                node.isDropChildTarget = true;
                visitQueue = node.entityNodes.concat(visitQueue);
            }
        }
    },

    /**
     * Signal the end of a cell drag action. Does nothing if there is no
     * drag action in progress.
     *
     * @function
     * @param {?EntityNode} targetNode The target node being dragged to.
     * @param {?String} positioning The type of move: "before", "after" or "child".
     */
    endDrag: {
        value: function (targetNode, positioning) {
            var functionName;

            if (!this._draggedNode) {
                return;
            }

            this._touchedNodes.forEach(function (node) {
                node.isDropBeforeTarget = false;
                node.isDropChildTarget = false;
                node.isDropAfterTarget = false;
            });

            if (targetNode) {
                this._componentTree.moveEntity(this._draggedNode, targetNode, positioning);
            }

            this._draggedNode = null;
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

    _dragDelegate: {
        value: null
    },
    dragDelegate: {
        get: function () {
            if (!this._dragDelegate) {
                this._dragDelegate = new DragDelegate(this);
            }
            return this._dragDelegate;
        }
    },

    /**
     * @type {MultiMap.<EntityProxy, Object>}
     */
    _proxyMap: {
        value: null
    },

    _treeNodeForProxy: {
        value: function (proxy, parentNode) {
            var self = this,
                node = new EntityNode(proxy, this, parentNode);
            node.entityNodes = proxy.children.map(function (proxy) {
                return self._treeNodeForProxy(proxy, node);
            });
            this._proxyMap.get(proxy).push(node);
            return node;
        }
    },

    expandProxy: {
        value: function (proxy) {
            var visitQueue = Array.prototype.slice.call(proxy.children),
                child;
            while (child = visitQueue.shift()) {
                if (child.moduleId) {
                    this._loadProxyDocument(child);
                }
                if (child.children && child.children.length) {
                    visitQueue = child.children.concat(visitQueue);
                }
            }
        }
    },

    _loadProxyDocument: {
        value: function (proxy) {
            var self = this;
            return this.reelDocumentFactory.makeReelDocument(proxy.moduleId)
                .then(function (doc) {
                    self._proxyMap.get(proxy)
                        .forEach(function (node) {
                            node.ownerProxy = doc.entityTree;
                            node.entityNodes = doc.entityTree.children.map(function (child) {
                                return self._treeNodeForProxy(child, node);
                            });
                        });
                    self.tree.handleTreeChange();
                })
                .catch(Function.noop)
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var self = this;
            if (firstTime) {
                this.selection = [];
                this._proxyMap = new MultiMap();
                this.element.addEventListener("click", this, false);
                this.reelDocumentFactory.makeReelDocument("ui/main.reel")
                    .then(function (doc) {
                        self.data = self._treeNodeForProxy(doc.entityTree);
                        self.data.ownerProxy = self.data.proxy;
                    });
            }
        }
    },

    handleClick: {
        value: function (evt) {
            if (evt.target === this.tree.element) {
                this.selection = [];
            }
        }
    },

    handleTreeCellSelect: {
        value: function (evt) {
            this.selection = [evt.detail.proxy];
        }
    },

    moveEntity: {
        value: function (srcNode, destNode, positioning) {
            var self = this,
                owner = srcNode.proxy,
                srcParentChildren = srcNode.parentNode.entityNodes,
                destParentChildren = destNode.parentNode ? destNode.parentNode.entityNodes : null;
            while (!owner.isOwner) {
                owner = owner.parentEntity;
            }
            this.reelDocumentFactory.makeReelDocument(owner.moduleId)
                .then(function (doc) {
                    // TODO: This involves a lot of manual repositioning in the tree.
                    // I would rather be able to completely rely on bindings on
                    // the reelDocument.
                    switch (positioning) {
                        case "before":
                            doc.moveEntityBefore(srcNode.proxy, destNode.proxy);
                            srcParentChildren.splice(srcParentChildren.indexOf(srcNode), 1);
                            srcNode.parentNode = destNode.parentNode;
                            destParentChildren.splice(destParentChildren.indexOf(destNode), 0, srcNode);
                            break;
                        case "after":
                            doc.moveEntityAfter(srcNode.proxy, destNode.proxy);
                            srcParentChildren.splice(srcParentChildren.indexOf(srcNode), 1);
                            srcNode.parentNode = destNode.parentNode;
                            destParentChildren.splice(destParentChildren.indexOf(destNode) + 1, 0, srcNode);
                            break;
                        case "child":
                            doc.moveEntityChild(srcNode.proxy, destNode.proxy);
                            srcParentChildren.splice(srcParentChildren.indexOf(srcNode), 1);
                            srcNode.parentNode = destNode;
                            destNode.children.unshift(srcNode);
                            break;
                    }
                    self.tree.handleTreeChange();
                });
        }
    }
});
