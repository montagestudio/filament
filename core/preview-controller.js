var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise,
    NodeProxy = require("core/node-proxy").NodeProxy,
    ReelProxy = require("core/reel-proxy").ReelProxy;

exports.PreviewController = Target.specialize({

    constructor: {
        value: function PreviewController () {
            this.super();
        }
    },

    init: {
        value: function (appDelegate) {
            this._applicationDelegate = appDelegate;

            var self = this;

            // TODO replace all this with propertyPath dependencies
            this.addBeforePathChangeListener("_applicationDelegate.environmentBridge", function () {
                self.dispatchBeforeOwnPropertyChange("environmentBridge", self.environmentBridge);
            }, null, true);

            this.addPathChangeListener("_applicationDelegate.environmentBridge", function () {
                self.dispatchOwnPropertyChange("environmentBridge", self.environmentBridge);
            });

            this.addBeforePathChangeListener("environmentBridge.previewUrl", function () {
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
            }, null, true);

            this.addPathChangeListener("environmentBridge.previewUrl", function () {
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
            });

            var app = require("montage/core/application").application;

            app.addEventListener("didSave", this);
            app.addEventListener("didChangeObjectProperties", this);
            app.addEventListener("didChangeObjectProperty", this);
            app.addEventListener("didSetObjectBinding", this);
            app.addEventListener("didCancelObjectBinding", this);
            app.addEventListener("willUpdateObjectBinding", this);
            app.addEventListener("didUpdateObjectBinding", this);
            app.addEventListener("didAddObjectEventListener", this);
            app.addEventListener("didRemoveObjectEventListener", this);
            app.addEventListener("willUpdateObjectEventListener", this);
            app.addEventListener("didUpdateObjectEventListener", this);
            app.addEventListener("didAddObjectsFromTemplate", this);
            app.addEventListener("didInsertBeforeNode", this);
            app.addEventListener("didInsertAfterNode", this);
            app.addEventListener("didAppendNode", this);
            app.addEventListener("didSetAttribute", this);
            app.addEventListener("didChangeTemplate", this);

            return this;
        }
    },

    _applicationDelegate: {
        value: null
    },

    applicationDelegate: {
        get: function () {
            return this._applicationDelegate;
        }
    },

    environmentBridge: {
        get: function () {
            return this._applicationDelegate.environmentBridge;
        }
    },

    _previewId: {
        value: null
    },

    previewId: {
        get: function () {
            return this._previewId;
        }
    },

    previewUrl: {
        get: function () {
            if (this.environmentBridge) {
                var url = this.environmentBridge.previewUrl;
                return this._previewId ?  url + "/" + this._previewId + "/" : url;
            }
        }
    },

    /**
     * Registers the serving of a preview within this environment
     *
     * @param {string} name The name for this preview
     * @param {string} url The url to serve for this preview
     *
     * @return {Promise} A promise for the registration of this preview
     */
    registerPreview: {
        value: function (name, url) {
            var self = this;
            return this.environmentBridge.registerPreview(name, url).then(function (previewId) {
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
                self._previewId = previewId;
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
                self.dispatchEventNamed("didRegisterPreview", true, false);
                return name;
            });
        }
    },

    /**
     * Launch the preview server for this project
     *
     * @return {Promise} A promise for the successful launch of the preview
     */
    launchPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.launchPreview(this._previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchEventNamed("didLaunchPreview", true, false);
            });
        }
    },

    /**
     * Refresh the preview server for this project
     *
     * @return {Promise} A promise for the successful refresh of the preview
     */
    refreshPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.refreshPreview(this._previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchEventNamed("didRefreshPreview", true, false);
            });
        }
    },

    setPreviewObjectProperties: {
        value: function(label, ownerModuleId, properties) {
            if (typeof this.environmentBridge.setPreviewObjectProperties === "function") {
                return this.environmentBridge.setPreviewObjectProperties(this._previewId, label, ownerModuleId, properties);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    setPreviewObjectProperty: {
        value: function(ownerModuleId, label, propertyName, propertyValue, propertyType) {
            if (typeof this.environmentBridge.setPreviewObjectProperty === "function") {
                return this.environmentBridge.setPreviewObjectProperty(this._previewId, ownerModuleId, label, propertyName, propertyValue, propertyType);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    setPreviewObjectBinding: {
        value: function(ownerModuleId, label, binding) {
            if (typeof this.environmentBridge.setPreviewObjectBinding === "function") {
                return this.environmentBridge.setPreviewObjectBinding(this._previewId, ownerModuleId, label, binding);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    deletePreviewObjectBinding: {
        value: function(ownerModuleId, label, path) {
            if (typeof this.environmentBridge.deletePreviewObjectBinding === "function") {
                return this.environmentBridge.deletePreviewObjectBinding(this._previewId, ownerModuleId, label, path);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    addTemplateFragment: {
        value: function(moduleId, label, argumentName, cssSelector, how, templateFragment) {
            if (typeof this.environmentBridge.addTemplateFragment === "function") {
                return this.environmentBridge.addTemplateFragment(this._previewId, moduleId, label, argumentName, cssSelector, how, templateFragment);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    addTemplateFragmentObjects: {
        value: function(moduleId, templateFragment) {
            if (typeof this.environmentBridge.addTemplateFragmentObjects === "function") {
                return this.environmentBridge.addTemplateFragmentObjects(this._previewId, moduleId, templateFragment);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    setPreviewElementAttribute: {
        value: function(moduleId, label, argumentName, cssSelector, attributeName, attributeValue) {
            if (typeof this.environmentBridge.setPreviewElementAttribute === "function") {
                return this.environmentBridge.setPreviewElementAttribute(this._previewId, moduleId, label, argumentName, cssSelector, attributeName, attributeValue);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    setPreviewObjectTemplate: {
        value: function(moduleId, templateFragment) {
            if (typeof this.environmentBridge.setPreviewObjectTemplate === "function") {
                return this.environmentBridge.setPreviewObjectTemplate(this._previewId, moduleId, templateFragment);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    addPreviewObjectEventListener: {
        value: function(moduleId, label, type, listenerLabel, useCapture) {
            if (typeof this.environmentBridge.addPreviewObjectEventListener === "function") {
                return this.environmentBridge.addPreviewObjectEventListener(this._previewId, moduleId, label, type, listenerLabel, useCapture);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    removePreviewObjectEventListener: {
        value: function(moduleId, label, type, listenerLabel, useCapture) {
            if (typeof this.environmentBridge.removePreviewObjectEventListener === "function") {
                return this.environmentBridge.removePreviewObjectEventListener(this._previewId, moduleId, label, type, listenerLabel, useCapture);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    /**
     * Unregister the preview server for this project
     *
     * @return {Promise} A promise for the successful unregistration of the preview
     */
    unregisterPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.unregisterPreview(this._previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
                self._previewId = null;
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
                self.dispatchEventNamed("didUnregisterPreview", true, false);
            });
        }
    },

    //// LISTENERS

    handleDidSave: {
        value: function () {
            this.refreshPreview().done();
        }
    },

    handleDidChangeObjectProperties: {
        value: function (event) {
            var proxy = event.target;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;
            var ownerModuleId = ownerProxy ? ownerProxy.exportId : null;

            this.setPreviewObjectProperties(proxy.label, ownerModuleId, event.detail.properties).done();
        }
    },

    handleDidChangeObjectProperty: {
        value: function (event) {
            var proxy = event.target;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;
            var ownerModuleId = ownerProxy ? ownerProxy.exportId : null;
            var value = event.detail.value;
            var location;
            var type;

            if (value instanceof NodeProxy) {
                type = "element";
                location = this._getNodeLocation(value, false, ownerProxy);
                value = {
                    label: location.component.label,
                    argumentName: location.argumentName,
                    cssSelector: location.cssSelector
                };
            } else if (value instanceof ReelProxy) {
                type = "object";
                value = {
                    label: value.label
                };
            }

            this.setPreviewObjectProperty(ownerModuleId, proxy.label, event.detail.property, value, type).done();
        }
    },

    handleDidSetObjectBinding: {
        value: function (event) {
            var proxy = event.target;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;

            if (!ownerProxy) {
                return;
            }

            var binding = {
                propertyName: event.detail.binding.targetPath,
                propertyDescriptor: {}
            };
            var oneway = event.detail.binding.oneway ? "<-" : "<->";
            binding.propertyDescriptor[oneway] = event.detail.binding.sourcePath;

            this.setPreviewObjectBinding(
                ownerProxy.exportId, proxy.label, binding)
            .done();
        }
    },

    handleDidCancelObjectBinding: {
        value: function (event) {
            var proxy = event.target;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;

            if (!ownerProxy) {
                return;
            }

            this.deletePreviewObjectBinding(
                ownerProxy.exportId, proxy.label, event.detail.binding.targetPath)
            .done();
        }
    },

    handleWillUpdateObjectBinding: {
        value: function (event) {
            this.handleDidCancelObjectBinding(event);
        }
    },

    handleDidUpdateObjectBinding: {
        value: function (event) {
            this.handleDidSetObjectBinding(event);
        }
    },

    handleDidAddObjectsFromTemplate: {
        value: function (event) {
            var document = event.target;
            var detail = event.detail;

            if (detail.parentNode) {
                this._addTemplateToPreview(detail.template, document,
                    detail.parentNode, detail.nextSiblingNode)
                .done();
            } else {
                this._addTemplateObjectsToPreview(detail.template, document)
                .done();
            }
        }
    },

    handleDidSetAttribute: {
        value: function(event) {
            var node = event.target;
            var detail = event.detail;
            var owner = node._editingDocument.editingProxyMap.owner;

            var location = this._getNodeLocation(node, false, owner);

            this.setPreviewElementAttribute(
                owner.moduleId,
                location.component.label,
                location.argumentName,
                location.cssSelector,
                detail.attribute,
                detail.value)
            .done();
        }
    },

    _addTemplateObjectsToPreview: {
        value: function(template, document) {
            var ownerProxy = document.editingProxyMap.owner;
            var templateFragment = {
                serialization: template.objectsString
            };

            return this.addTemplateFragmentObjects(
                    ownerProxy.exportId, templateFragment);
        }
    },

    /**
     * Creates the information necessary to find a node in the live app.
     *
     * @param node Node The node to get the location details for.
     * @param isContainerNode boolean Indicates if node is a container node. If
     *        it is then it means we need to locate the contents of the node and
     *        not the node itself. Useful when the node doesn't have any content
     *        we can point to or we want to append to it.
     * @param owner ProxyNode The owner of the template where the node is defined.
     * @returns {component, argumentName, cssSelector}
     */
    _getNodeLocation: {
        value: function(node, isContainerNode, owner) {
            var argumentNode,
                anchorNode,
                componentNode,
                anchorNodeIsStarArgument,
                cssSelector = "",
                currentNode;

            // Find the component where the node is located.
            // We also check to see if the node resides inside a named
            // argument element.
            componentNode = isContainerNode ? node : node.parentNode;
            do {
                if (componentNode.component) {
                    break;
                } else if (componentNode.montageArg) {
                    argumentNode = componentNode;
                }
            } while (componentNode = /* assignment */ componentNode.parentNode);

            // If the node is inside a named parameter then the
            // anchor node is the component itself, otherwise it's the argument
            // node
            anchorNode = argumentNode || componentNode;

            if (!argumentNode && componentNode.component !== owner) {
                anchorNodeIsStarArgument = true;
            }

            // Generate the css selector path.
            // The css selector is similar in concept to an xpath, we create a
            // path of direct children from the anchor to the node.
            // :scope in this case means the container element.
            // For star arguments (non-named arguments) we need to adopt a
            // different strategy for selecting the first node in the path
            // because there is no container element, just a range of them.
            // :scope in this case means the first element of the range and we
            // select the first node of the path using the + adjacent sibling
            // selector.
            currentNode = node;
            while (currentNode && currentNode !== anchorNode) {
                var ix = currentNode.parentNode.children.indexOf(currentNode);

                // We use a different strategy for the selector of the first
                // node in the path for star arguments.
                if (anchorNodeIsStarArgument && currentNode.parentNode === anchorNode) {
                    cssSelector = new Array(ix+1).join("+ * ") + cssSelector;
                } else {
                    cssSelector = "> *:nth-child(" + (ix+1) + ")" + cssSelector;
                }

                currentNode = currentNode.parentNode;
            }
            cssSelector = ":scope " + cssSelector;

            return {
                component: componentNode.component,
                argumentName: argumentNode ? argumentNode.montageArg : null,
                cssSelector: cssSelector
            };
        }
    },

    /**
     * When adding a template content to the preview we need to provide three
     * pieces of information:
     * - The component where the content was added. (ownerModuleId + label)
     * - The argument name if the content was added to an argument of the
     *   component. (argumentName)
     * - A CSS selector from the component or the argument node that points to
     *   the exact node where the content was added. (cssSelector)
     */
    _addTemplateToPreview: {
        value: function(template, document, parentNode, nextSiblingNode) {
            var templateFragment;
            var ownerProxy = document.editingProxyMap.owner;
            var nodeCount;

            if (!ownerProxy) {
                return Promise.resolve();
            }

            nodeCount = template.document.body.children.length;
            templateFragment = {
                serialization: template.objectsString,
                html: template.document.body.innerHTML
            };

            return this._addTemplateFragmentToPreview(ownerProxy, parentNode,
                nextSiblingNode, templateFragment, nodeCount);
        }
    },

    _addTemplateFragmentToPreview: {
        value: function(ownerProxy, parentNode, nextSiblingNode, templateFragment, nodeCount) {
            var parentsChildren,
                indexInParent,
                node,
                isContainerNode,
                how,
                location;

            if (nextSiblingNode) {
                // If the template has elements then they were already added to
                // the owner's template dom tree and we need to account for it.
                // Instead of getting a reference to nextSiblingNode we get a
                // reference to the first node of the added template because
                // it is now in the same position that nextSiblingNode was
                // before the template was added.
                if (nodeCount > 0) {
                    parentsChildren = nextSiblingNode.parentNode.children;
                    indexInParent = parentsChildren.indexOf(nextSiblingNode);
                    node = parentsChildren[indexInParent - nodeCount];
                } else {
                    node = nextSiblingNode;
                }

                isContainerNode = false;
                how = "before";
            } else if (parentNode.component === ownerProxy) {
                node = parentNode;
                isContainerNode = true;
                how = "append";
            } else if (parentNode.component && !parentNode.component.montageArg) {
                // If we need to append the template to a star argument range of
                // nodes then we need to locate the last element of the range
                // and insert "after" that node.
                parentsChildren = parentNode.children;
                if (parentsChildren.length - nodeCount === 0) {
                    node = parentNode;
                    isContainerNode = true;
                } else {
                    // Use the node that was in the position of the last
                    // node before the contents of the template were added.
                    node = parentsChildren[parentsChildren.length - 1 - nodeCount];
                    isContainerNode = false;
                }
                how = "after";
            } else {
                node = parentNode;
                isContainerNode = true;
                how = "append";
            }

            location = this._getNodeLocation(node, isContainerNode, ownerProxy);

            return this.addTemplateFragment(
                ownerProxy.exportId,
                location.component.label,
                location.argumentName,
                location.cssSelector,
                how,
                templateFragment);
        }
    },

    handleDidChangeTemplate: {
        value: function(event) {
            var document = event.target;
            var template = event.detail.template;
            var owner = document.editingProxyMap.owner;

            var templateFragment = {
                serialization: template.objectsString,
                html: template.document.body.innerHTML
            };

            this.setPreviewObjectTemplate(
                owner.moduleId,
                templateFragment)
            .done();
        }
    },

    handleDidAddObjectEventListener: {
        value: function(event) {
            var proxy = event.target;
            var listenerModel = event.detail.listenerModel;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;

            this.addPreviewObjectEventListener(
                ownerProxy.moduleId,
                proxy.label,
                listenerModel.type,
                listenerModel.listener.label,
                listenerModel.useCapture)
            .done();
        }
    },

    handleDidRemoveObjectEventListener: {
        value: function(event) {
            var proxy = event.target;
            var listenerModel = event.detail.listenerModel;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;

            this.removePreviewObjectEventListener(
                ownerProxy.moduleId,
                proxy.label,
                listenerModel.type,
                listenerModel.listener.label,
                listenerModel.useCapture)
            .done();
        }
    },

    handleWillUpdateObjectEventListener: {
        value: function(event) {
            this.handleDidRemoveObjectEventListener(event);
        }
    },

    handleDidUpdateObjectEventListener: {
        value: function(event) {
            this.handleDidAddObjectEventListener(event);
        }
    },

    handleDidInsertBeforeNode: {
        value: function(event) {
            var document = event.target.editingDocument;
            var detail = event.detail;
            var ownerProxy = document.editingProxyMap.owner;
            var nodeCount = 1;
            var templateFragment;

            templateFragment = {
                html: detail.nodeProxy._templateNode.outerHTML
            };

            this._addTemplateFragmentToPreview(ownerProxy,
                detail.parentNodeProxy, detail.nextSiblingProxy, templateFragment,
                nodeCount)
            .done();
        }
    },

    handleDidInsertAfterNode: {
        value: function(event) {
            var document = event.target.editingDocument;
            var detail = event.detail;
            var ownerProxy = document.editingProxyMap.owner;
            var nodeCount = 1;
            var templateFragment;

            templateFragment = {
                html: detail.nodeProxy._templateNode.outerHTML
            };
            this._addTemplateFragmentToPreview(ownerProxy,
                detail.previousSiblingProxy.parentNode, null, templateFragment,
                nodeCount)
            .done();
        }
    },


    handleDidAppendNode: {
        value: function(event) {
            var document = event.target.editingDocument;
            var detail = event.detail;
            var ownerProxy = document.editingProxyMap.owner;
            var nodeCount = 1;
            var templateFragment;

            templateFragment = {
                html: detail.nodeProxy._templateNode.outerHTML
            };

            this._addTemplateFragmentToPreview(ownerProxy,
                detail.parentNodeProxy, detail.nextSiblingProxy, templateFragment,
                nodeCount)
            .done();
        }
    }

});
