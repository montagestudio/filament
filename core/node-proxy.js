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
                    i;

            for (i = 0; (iChildNode = children.item(i)); i++) {
                childrenProxies.push(NodeProxy.create().init(iChildNode, this._editingDocument));
            }

            this.children = childrenProxies;

            this.defineBinding("isInTemplate", {"<-": "_editingDocument.templateNodes.has($)", parameters: this});

            return this;
        }
    },

    children: {
        value: null
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
            //TODO make this guard against edgecases e.g. transplanting nodes
            //TODO not actually update the underlying DOM live on edits?
            this._templateNode.appendChild(nodeProxy._templateNode);
            this.children.push(nodeProxy);
        }
    }

});
