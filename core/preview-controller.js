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
            app.addEventListener("didSetOwnedObjectProperties", this);
            app.addEventListener("didSetOwnedObjectProperty", this);
            app.addEventListener("didSetOwnedObjectLabel", this);
            app.addEventListener("didDefineOwnedObjectBinding", this);
            app.addEventListener("didCancelOwnedObjectBinding", this);
            app.addEventListener("willUpdateOwnedObjectBinding", this);
            app.addEventListener("didUpdateOwnedObjectBinding", this);
            app.addEventListener("didAddOwnedObjectEventListener", this);
            app.addEventListener("didRemoveOwnedObjectEventListener", this);
            app.addEventListener("willUpdateOwnedObjectEventListener", this);
            app.addEventListener("didUpdateOwnedObjectEventListener", this);
            app.addEventListener("didAddObjectsFromTemplate", this);
            app.addEventListener("didAppendChildToTemplateNode", this);
            app.addEventListener("didInsertNodeBeforeTemplateNode", this);
            app.addEventListener("didInsertNodeAfterTemplateNode", this);
            app.addEventListener("didSetNodeAttribute", this);
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

    setPreviewObjectLabel: {
        value: function(ownerModuleId, label, newLabel) {
            if (typeof this.environmentBridge.setPreviewObjectLabel === "function") {
                return this.environmentBridge.setPreviewObjectLabel(this._previewId, ownerModuleId, label, newLabel);
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
        value: function(moduleId, elementLocation, how, templateFragment) {
            if (typeof this.environmentBridge.addTemplateFragment === "function") {
                return this.environmentBridge.addTemplateFragment(this._previewId, moduleId, elementLocation, how, templateFragment);
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
        value: function(moduleId, elementLocation, attributeName, attributeValue) {
            if (typeof this.environmentBridge.setPreviewElementAttribute === "function") {
                return this.environmentBridge.setPreviewElementAttribute(this._previewId, moduleId, elementLocation, attributeName, attributeValue);
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

    handleDidSetOwnedObjectProperties: {
        value: function (event) {
            var detail = event.detail;
            var proxy = detail.proxy;
            var ownerProxy = event.target.editingProxyMap.owner;
            var ownerModuleId = ownerProxy ? ownerProxy.exportId : null;

            this.setPreviewObjectProperties(proxy.label, ownerModuleId, detail.values).done();
        }
    },

    handleDidSetOwnedObjectProperty: {
        value: function (event) {
            var detail = event.detail;
            var proxy = detail.proxy;
            var ownerProxy = event.target.editingProxyMap.owner;
            var ownerModuleId = ownerProxy ? ownerProxy.exportId : null;
            var propertyValue = detail.value;
            var type;
            var value;

            if (propertyValue instanceof NodeProxy) {
                type = "element";
                value = this._getElementLocation(propertyValue, false, ownerProxy);
                value.elementId = propertyValue.montageId;
            } else if (propertyValue instanceof ReelProxy) {
                type = "object";
                value = {
                    label: propertyValue.label
                };
            } else {
                value = propertyValue;
            }

            this.setPreviewObjectProperty(ownerModuleId, proxy.label, detail.property, value, type).done();
        }
    },

    handleDidSetOwnedObjectLabel: {
        value: function (event) {
            var detail = event.detail;
            var ownerProxy = event.target.editingProxyMap.owner;
            var ownerModuleId = ownerProxy ? ownerProxy.exportId : null;

            this.setPreviewObjectLabel(ownerModuleId, detail.oldLabel, detail.newLabel).done();
        }
    },

    handleDidDefineOwnedObjectBinding: {
        value: function (event) {
            var detail = event.detail;
            var proxy = detail.proxy;
            var ownerProxy = event.target.editingProxyMap.owner;

            if (!ownerProxy) {
                return;
            }

            var binding = {
                propertyName: detail.targetPath,
                propertyDescriptor: {}
            };
            var direction = detail.oneway ? "<-" : "<->";
            binding.propertyDescriptor[direction] = detail.sourcePath;

            this.setPreviewObjectBinding(
                ownerProxy.exportId, proxy.label, binding)
            .done();
        }
    },

    handleDidCancelOwnedObjectBinding: {
        value: function (event) {
            var detail = event.detail;
            var proxy = detail.proxy;
            var ownerProxy = event.target.editingProxyMap.owner;

            if (!ownerProxy) {
                return;
            }

            this.deletePreviewObjectBinding(
                ownerProxy.exportId, proxy.label, detail.binding.targetPath)
            .done();
        }
    },

    handleWillUpdateOwnedObjectBinding: {
        value: function (event) {
            this.handleDidCancelOwnedObjectBinding(event);
        }
    },

    handleDidUpdateOwnedObjectBinding: {
        value: function (event) {
            this.handleDidDefineOwnedObjectBinding(event);
        }
    },

    handleDidAddObjectsFromTemplate: {
        value: function (event) {
            var document = event.target;
            var detail = event.detail;
            var template = detail.template;

            if (template.document.body.children.length > 0) {
                this._addTemplateToPreview(template, document,
                    detail.parentNode, detail.nextSiblingNode)
                .done();
            } else {
                this._addTemplateObjectsToPreview(template, document)
                .done();
            }
        }
    },

    handleDidSetNodeAttribute: {
        value: function(event) {
            var detail = event.detail;
            var node = detail.nodeProxy;
            var owner = event.target.editingProxyMap.owner;

            var location = this._getElementLocation(node, false, owner);

            this.setPreviewElementAttribute(
                owner.moduleId,
                location,
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

    _getTemplateElementLocation: {
        value: function(element) {
            var cssSelector = "";
            var index;

            while (element && element.tagName.toLowerCase() !== "body") {
                index = element.parentNode.children.indexOf(element);
                cssSelector = cssSelector + " > *:nth-child(" + (index+1) + ")";
                element = element.parentNode;
            }

            cssSelector = "body " + cssSelector;

            return {
                cssSelector: cssSelector
            };
        }
    },

    /**
     * Creates the information necessary to find a node in the live app.
     * To find a node we need three pieces of information:
     * - The component label where the content was added. (label)
     * - The argument name if the content was added to an argument of the
     *   component. (argumentName)
     * - A CSS selector from the component or the argument node that points to
     *   the exact node where the content was added. (cssSelector)
     *
     * @param {Node} node The node to get the location details for.
     * @param {boolean} isContainerNode Indicates if node is a container node. If
     *        it is then it means we need to locate the contents of the node and
     *        not the node itself. Useful when the node doesn't have any content
     *        we can point to or we want to append to it.
     * @param {NodeProxy} owner The owner of the template where the node is defined.
     * @returns {{label: string, argumentName: string, cssSelector: string}}
     */
    _getElementLocation: {
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
                label: componentNode.component.label,
                argumentName: argumentNode ? argumentNode.montageArg : null,
                cssSelector: cssSelector
            };
        }
    },

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

            location = this._getElementLocation(node, isContainerNode, ownerProxy);

            return this.addTemplateFragment(
                ownerProxy.exportId,
                location,
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

    handleDidAddOwnedObjectEventListener: {
        value: function(event) {
            var detail = event.detail;
            var proxy = detail.proxy;
            var ownerProxy = event.target.editingProxyMap.owner;

            this.addPreviewObjectEventListener(
                ownerProxy.moduleId,
                proxy.label,
                detail.type,
                detail.listener.label,
                detail.useCapture)
            .done();
        }
    },

    handleDidRemoveOwnedObjectEventListener: {
        value: function(event) {
            var detail = event.detail;
            var proxy = detail.proxy;
            var listener = detail.listener;
            var ownerProxy = event.target.editingProxyMap.owner;

            this.removePreviewObjectEventListener(
                ownerProxy.moduleId,
                proxy.label,
                listener.type,
                listener.listener.label,
                listener.useCapture)
            .done();
        }
    },

    handleWillUpdateOwnedObjectEventListener: {
        value: function(event) {
            this.handleDidRemoveOwnedObjectEventListener(event);
        }
    },

    handleDidUpdateOwnedObjectEventListener: {
        value: function(event) {
            this.handleDidAddOwnedObjectEventListener(event);
        }
    },

    handleDidInsertNodeBeforeTemplateNode: {
        value: function(event) {
            var document = event.target;
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

    handleDidInsertNodeAfterTemplateNode: {
        value: function(event) {
            var document = event.target;
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


    handleDidAppendChildToTemplateNode: {
        value: function(event) {
            var document = event.target;
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
