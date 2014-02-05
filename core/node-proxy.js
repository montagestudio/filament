var Target = require("montage/core/target").Target,
    NodeProxy;

var MONTAGE_ID_ATTRIBUTE = "data-montage-id",
    MONTAGE_ARG_ATTRIBUTE = "data-arg",
    MONTAGE_PARAM_ATTRIBUTE = "data-param";

exports.NodeProxy = NodeProxy = Target.specialize({

    constructor: {
        value: function NodeProxy() {
            this.super();

            this.defineBindings({
                // The node proxy's component is the editing proxy that has this
                // node as an element.
                // FIXME: this lead to issue when you a relying on a nodeProxy change 
                "component": {"<-": "_editingDocument.editingProxies.filter{properties.get('element') == $self}[0]"}
            }, {
                parameters: {
                    self: this
                }
            });

            var attributeMap = this._attributeToPropertyMap = {};
            attributeMap[MONTAGE_ID_ATTRIBUTE] = "montageId";
            attributeMap[MONTAGE_ARG_ATTRIBUTE] = "montageArg";
            attributeMap[MONTAGE_PARAM_ATTRIBUTE] = "montageParam";

            this.addPathChangeListener("component.label", this, "_dispatchPropertiesChange");
            this.addPathChangeListener("children.length", this, "_dispatchPropertiesChange");
        }
    },

    proxyType: {
        get: function() {
            return "NodeProxy";
        }
    },

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
            if (!this.parentNode) {
                return null;
            }

            var parentsChildren = this.parentNode.children;
            var indexInParent = parentsChildren.indexOf(this);
            return parentsChildren[indexInParent + 1];

        }
    },

    lastChild: {
        get: function () {
            var lastChild = null;

            if (this.children.length) {
                lastChild = this.children[this.children.length - 1];
            }

            return lastChild;
        }
    },

    tagName: {
        get: function () {
            return this._templateNode ? this._templateNode.tagName : null;
        },
        set: function (value) {
            var currentNode = this._templateNode;
            var doc = currentNode.ownerDocument;
            var parent = currentNode.parentNode;

            // Create new element
            var newNode = doc.createElement(value);
            // Copy attributes
            var attributes = currentNode.attributes;
            for (var i = 0, len = attributes.length; i < len; i++) {
                var attr = attributes[i];
                newNode.setAttribute(attr.name, attr.value);
            }
            // Move children
            var children = currentNode.childNodes;
            for (i = 0, len = children.length; i < len; i++) {
                // The nodes are removed from the childNodes array as we append
                // them here, so the next node to add is always the first one
                newNode.appendChild(children[0]);
            }
            // Set correct parent on the children's nodeProxies

            parent.replaceChild(newNode, currentNode);
            this._templateNode = newNode;
            this._dispatchPropertiesChange();
        }
    },

    montageId: {
        get: function () {
            return this.getAttribute(MONTAGE_ID_ATTRIBUTE);
        },
        set: function (value) {
            this.setAttribute(MONTAGE_ID_ATTRIBUTE, value);
            this._dispatchPropertiesChange();
        }
    },

    montageArg: {
        get: function() {
            return this.getAttribute(MONTAGE_ARG_ATTRIBUTE);
        },
        set: function (value) {
            this.setAttribute(MONTAGE_ARG_ATTRIBUTE, value);
            this._dispatchPropertiesChange();
        }
    },

    montageParam: {
        get: function() {
            return this.getAttribute(MONTAGE_PARAM_ATTRIBUTE);
        },
        set: function (value) {
            this.setAttribute(MONTAGE_PARAM_ATTRIBUTE, value);
            this._dispatchPropertiesChange();
        }
    },

    getAttribute: {
        value: function (attributeName) {
            return this._templateNode ? this._templateNode.getAttribute(attributeName) : null;
        }
    },

    _attributeToPropertyMap: {
        value: null
    },

    setAttribute: {
        value: function(attribute, value) {
            var previousValue = this.getAttribute(attribute);

            if (previousValue === value) {
                return;
            }

            var affectedProperty = this._attributeToPropertyMap[attribute];

            if (affectedProperty) {
                this.dispatchBeforeOwnPropertyChange(affectedProperty, previousValue);
            }

            if (value) {
                this._templateNode.setAttribute(attribute, value);
            } else {
                this._templateNode.removeAttribute(attribute);
            }

            if (affectedProperty) {
                this.dispatchOwnPropertyChange(affectedProperty, value || null);
                this._dispatchPropertiesChange();
            }
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

    _component: {
        value: null
    },

    component: {
        get: function() {
            return this._component;
        },
        set: function(value) {
            if (value !== this._component) {
                this._component = value;
                this._dispatchPropertiesChange();
            }
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
    },

    // PROPERTIES DISPATCHING, USED FOR MANUAL BINDINGS
    _dispatchPropertiesChange: {
        value: function() {
            this.dispatchEventNamed("propertiesChange", true, false);
        }
    }
});
