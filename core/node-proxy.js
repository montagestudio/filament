var Montage = require("montage").Montage,
    NodeProxy;

exports.NodeProxy = NodeProxy = Montage.create(Montage,  {

    _templateNode: {
        value: null
    },

    initWithNode: {
        value: function (node) {
            this._templateNode = node;
            return this;
        }
    },

    _children: {
        value: null
    },

    children: {
        get: function () {
            if (!this._children && this._templateNode) {
                var children = this._templateNode.children,
                    childrenProxies = [],
                    iChildNode,
                    i;

                for (i = 0; (iChildNode = children.item(i)); i++) {
                    childrenProxies.push(NodeProxy.create().initWithNode(iChildNode));
                }

                this._children = childrenProxies;
            }
            return this._children;
        }
    },

    tagName: {
        get: function () {
            return this._templateNode ? this._templateNode.tagName : null;
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
    }

});
