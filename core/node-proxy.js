var Montage = require("montage").Montage,
    NodeProxy;

exports.NodeProxy = NodeProxy = Montage.create(Montage,  {

    _editingDocument: {
        value: null
    },

    _templateNode: {
        value: null
    },

    init: {
        value: function (node, editingDocument) {
            this._templateNode = node;
            this._editingDocument = editingDocument;

            var children = this._templateNode.children,
                    childrenProxies = [],
                    iChildNode,
                i,
                childProxy;

            for (i = 0; (iChildNode = children.item(i)); i++) {
                childProxy = NodeProxy.create().init(iChildNode, this._editingDocument);
                childrenProxies.push(childProxy);
                childProxy.parentNode = this;
            }

            this.children = childrenProxies;

            this.defineBinding("isInTemplate", {"<-": "_editingDocument.templateNodes.has($)", parameters: this});

            return this;
        }
    },

    parentNode: {
        value: null
    },

    children: {
        value: null
    },

    nextSibling: {
        get: function () {
            var parentsChildren = this.parentNode.children;
            var indexInParent = parentsChildren.indexOf(this);
            return parentsChildren[indexInParent + 1];

        }
    },

    tagName: {
        get: function () {
            return this._templateNode ? this._templateNode.tagName : null;
        }
    },

    montageId: {
        get: function () {
            return this._templateNode ? this._templateNode.getAttribute("data-montage-id") : null;
        }
    },

    snippet: {
        get: function () {
            var snippet = "";
            if (this._templateNode) {
                snippet = this._templateNode.outerHTML;
                if (this._templateNode.innerHTML.length) {
                    var contentStart = snippet.indexOf(this._templateNode.innerHTML);
                    snippet = snippet.substring(0, contentStart);
                }
            }
            return snippet;
        }
    },

    //TODO make react to changes in underlying computed function…not sure how to do that without knowing underlying implementation
    canRemoveNode: {
        get: function () {
            return this._editingDocument.canRemoveTemplateNode(this);
        }
    },

    canAppendToNode: {
        get: function () {
            return this._editingDocument.canAppendToTemplateNode(this);
        }
    },

    canInsertBeforeNode: {
        get: function () {
            return this._editingDocument.canInsertBeforeTemplateNode(this);
        }
    },

    canInsertAfterNode: {
        get: function () {
            return this._editingDocument.canInsertAfterTemplateNode(this);
        }
    },

    component: {
        get: function () {
            //TODO cache this and listen to see if it changes
            return this._editingDocument.componentProxyForElement(this);
        }
    },

    isInTemplate: {
        value: false
    },

    appendChild: {
        value: function (nodeProxy) {
            // HACK
            if (nodeProxy instanceof Node) {
                return;
            }

            //TODO make this guard against edgecases e.g. transplanting nodes
            //TODO not actually update the underlying DOM live on edits?
            this._templateNode.appendChild(nodeProxy._templateNode);
            this.children.push(nodeProxy);
            nodeProxy.parentNode = this;
        }
    },

    removeChild: {
        value: function (nodeProxy) {
            this._templateNode.removeChild(nodeProxy._templateNode);

            //TODO ensure child is actually a child
            var index = this.children.indexOf(nodeProxy);
            if (index >= 0) {
                this.children.splice(index, 1);
            }

            nodeProxy.parentNode = null;
            return nodeProxy;
        }
    },

    insertBefore: {
        value: function (nodeProxy, nextSiblingProxy) {

            if (nextSiblingProxy) {
                this._templateNode.insertBefore(nodeProxy._templateNode, nextSiblingProxy._templateNode);

                var index = this.children.indexOf(nextSiblingProxy);
                if (index >= 0) {
                    this.children.splice(index, 0, nodeProxy);
                }

                nodeProxy.parentNode = this;
            } else {
                this.appendChild(nodeProxy);
            }

            return nodeProxy;
        }
    }

});
