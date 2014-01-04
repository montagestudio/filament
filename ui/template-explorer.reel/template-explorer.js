/**
    @module "./template-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    WeakMap = require("montage/collections/weak-map"),
    MimeTypes = require("core/mime-types"),
    Promise = require("montage/core/promise").Promise;

/**
    Description TODO
    @class module:"./template-explorer.reel".TemplateExplorer
    @extends module:montage/ui/component.Component
*/
exports.TemplateExplorer = Montage.create(Component, /** @lends module:"./template-explorer.reel".TemplateExplorer# */ {

    _showHidden: {
        value: false
    },

    _hiddenCardsCount: {
        value: 0
    },

    hiddenCardsCount: {
        get: function () {
            return this._hiddenCardsCount;
        },
        set: function (value) {
            if (value === this._hiddenCardsCount) {
                return;
            }
            this._hiddenCardsCount = value;
            this.needsDraw = true;
        }
    },

    showHidden: {
        get: function () {
            return this._showHidden;
        },
        set: function (value) {
            if (value === this._showHidden) {
                return;
            }

            this.dispatchBeforeOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
            this._templateObjectFilterPath = null;
            this._showHidden = value;
            this.dispatchOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
        }
    },

    _templateObjectFilterTerm: {
        value: null
    },

    templateObjectFilterTerm: {
        get: function () {
            return this._templateObjectFilterTerm;
        },
        set: function (value) {
            if (value === this._templateObjectFilterTerm) {
                return;
            }

            this.dispatchBeforeOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
            this._templateObjectFilterPath = null;
            this._templateObjectFilterTerm = value;
            this.dispatchOwnPropertyChange("templateObjectFilterPath", this.templateObjectFilterPath);
        }
    },

    _templateObjectFilterPath : {
        value: null
    },

    templateObjectFilterPath: {
        get: function () {
            var term = this.templateObjectFilterTerm,
                filterPath;

            if (!this._templateObjectFilterPath) {

                if (this._showHidden) {
                    filterPath = "";
                } else {
                    filterPath = "!editorMetadata.get('isHidden') && ";
                }

                if (term) {
                    // TODO remove manual capitalization once we can specify case insensitivity
                    var capitalizedTerm = term.toCapitalized();
                    filterPath += "!label.contains('owner') && (label.contains('" + term + "') || label.contains('" + capitalizedTerm + "'))";
                } else {
                    filterPath += "!label.contains('owner')";
                }

                this._templateObjectFilterPath = filterPath;
            }

            return this._templateObjectFilterPath;
        }
    },

    _templateObjectsTree: {
        value: null
    },

    templateObjectsTree: {
        get : function () {
            if (!this._templateObjectsTree) {
                this.buildTemplateObjectTree();
            }
            return this._templateObjectsTree;
        },
        set: function (value) {
            if (value !== this._templateObjectsTree) {
                this._templateObjectsTree = value;
            }
        }
    },

    constructor: {
        value: function TemplateExplorer() {
            this.super();
            this.defineBinding("templateObjectsController.filterPath", {"<-": "templateObjectFilterPath"});
        }
    },

    /*
        Subroutines for buildTemplateObjectTree
     */
    _buildTreeAddRoot: {
        value: function (insertionMap) {
            var root = {
                templateObject: this.ownerObject,
                children: []
            };
            this.templateObjectsTree = root;
            insertionMap.set(this.ownerObject, root);
            return root;
        }
    },
    _buildTreeFillFIFO: {
        value: function () {
            var proxyFIFO = [];
            var editingDocument = this.editingDocument,
                proxyMap = editingDocument.editingProxyMap;
            for (var componentName in proxyMap) {
                if (proxyMap.hasOwnProperty(componentName)) {
                    var component = proxyMap[componentName];
                    if (component !== this.ownerObject) {
                        proxyFIFO.push(component);
                    }
                }
            }
            return proxyFIFO;
        }
    },
    _buildTreeFindParentComponent: {
        value: function (reelProxy) {
            var nodeProxy = reelProxy.properties.get('element'),
                parentNodeProxy = nodeProxy,
                parentReelProxy;
            while (parentNodeProxy = parentNodeProxy.parentNode) {
                if (parentNodeProxy.component) {
                    parentReelProxy = parentNodeProxy.component;
                    break;
                }
            }
            return parentReelProxy;
        }
    },
    /*
        Build the templateObjectsTree from the templatesNodes
        Steps:
            - add the root element
            - create a list of components to be arranged in the tree, "proxyFIFO"
            - pick the head element, "nodeProxy" of the list and try to add it to the tree. 
              While adding to the tree we keep a map of elements to tree node updated.
            - if the element has no DOM representation it is added to the root of the tree as first child
            - otherwise we seek the element's parentComponent to then add it
            - if the parentComponent has not yet been added we postpone adding this node for later by pushing back into the FIFO
    */
    buildTemplateObjectTree: {
        value: function () {
            var successivePushes = 0;
            // map of ReelProxy to tree node, for quick tree node access
            var insertionMap = new WeakMap();
            // add the root
            var root = this._buildTreeAddRoot(insertionMap);
            // filling the FIFO
            var proxyFIFO = this._buildTreeFillFIFO(proxyFIFO);
            var reelProxy;
            while (reelProxy = proxyFIFO.shift()) {
                if (reelProxy.properties && reelProxy.properties.get('element')) {
                    // find the parent component
                    var parentReelProxy = this._buildTreeFindParentComponent(reelProxy);
                    if (!parentReelProxy) {
                        throw new Error("Can not build templateObjectsTree: can't find parent component");
                    }

                    if (insertionMap.has(parentReelProxy)) {
                        // add the node to the tree
                        var node = {
                            templateObject: reelProxy,
                            children: []
                        };
                        var parentNode = insertionMap.get(parentReelProxy);
                        parentNode.children.push(node);
                        insertionMap.set(reelProxy, node);
                        // reset the infinite loop guard
                        successivePushes = 0;
                    } else {
                        // parentReelProxy not found -> has not been added to the tree yet
                        proxyFIFO.push(reelProxy);
                        successivePushes++;
                    }
                } else {
                    // has not DOM representation, added as root children
                    var nodeTemplateLess = {
                        templateObject: reelProxy,
                        children: []
                    };
                    // let's add them in top to keep the tree "cleaner"
                    root.children.unshift(nodeTemplateLess);
                }
                // to be safe, guard to prevent an infinite loop
                if (successivePushes > proxyFIFO.length) {
                    throw new Error("Can not build templateObjectsTree: looping on the same components");
                }
            }
        }
    },

    _willAcceptDrop: {
        value: false
    },

    highlightedComponent: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this._element.addEventListener("dragover", this, false);
            this._element.addEventListener("dragleave", this, false);
            this._element.addEventListener("drop", this, false);

            this._element.addEventListener("click", this);

            application.addEventListener("editBindingForObject", this, false);
            application.addEventListener("editListenerForObject", this, false);

            this.addRangeAtPathChangeListener("editingDocument.selectedObjects", this, "handleSelectedObjectsChange");
            // listen to change on editingProxies to refresh the tree
            this.addRangeAtPathChangeListener("editingDocument.editingProxies", this, "handleEditingProxiesChange");
        }
    },

    templateObjectsController: {
        value: null
    },

    Controller: {
        value: null
    },

    editingDocument: {
        value: null
    },

    showListeners: {
        value: true
    },

    showBindings: {
        value: true
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            var availableTypes = event.dataTransfer.types;

            //Accept dropping prototypes from library
            if (availableTypes && availableTypes.has(MimeTypes.PROTOTYPE_OBJECT)) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                this._willAcceptDrop = true;
            } else {
                event.dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
            }
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (evt) {
            var availableTypes = event.dataTransfer.types;
            if (availableTypes && availableTypes.has(MimeTypes.PROTOTYPE_OBJECT)) {
                var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                    transferObject = JSON.parse(data);

                this.editingDocument.addLibraryItemFragments(transferObject.serializationFragment).done();
            }
            this._willAcceptDrop = false;
        }
    },

    handleDefineBindingButtonAction: {
        value: function (evt) {
            //TODO not wipe out content if open/already has a bindingModel
            var bindingModel = Object.create(null);
            bindingModel.targetObject = evt.detail.get("targetObject");
            bindingModel.oneway = true;

            this.dispatchEventNamed("addBinding", true, false, {
                bindingModel: bindingModel
            });
        }
    },

    handleCancelBindingButtonAction: {
        value: function (evt) {
            evt.stop();
            var targetObject = evt.detail.get("targetObject");
            var binding = evt.detail.get("binding");
            this.editingDocument.cancelOwnedObjectBinding(targetObject, binding);
        }
    },

    handleEditBindingForObject: {
        value: function (evt) {
            var bindingModel = evt.detail.bindingModel;
            var existingBinding = evt.detail.existingBinding;

            this.dispatchEventNamed("addBinding", true, false, {
                bindingModel: bindingModel,
                existingBinding: existingBinding
            });
        }
    },

    handleAddListenerButtonAction: {
        value: function (evt) {
            var listenerModel = Object.create(null);
            listenerModel.targetObject = evt.detail.get("targetObject");
            listenerModel.useCapture = false;

            this.dispatchEventNamed("addListenerForObject", true, false, {
                listenerModel: listenerModel
            });
        }
    },

    handleEditListenerForObject: {
        value: function (evt) {
            var listenerModel = evt.detail.listenerModel;
            var existingListener = evt.detail.existingListener;

            this.dispatchEventNamed("addListenerForObject", true, false, {
                listenerModel: listenerModel,
                existingListener: existingListener
            });
        }
    },

    handleRemoveListenerButtonAction: {
        value: function (evt) {
            evt.stop();
            var targetObject = evt.detail.get("targetObject");
            var listener = evt.detail.get("listener");
            this.editingDocument.removeOwnedObjectEventListener(targetObject, listener);
        }
    },

    handleClick: {
        value: function (evt) {
            var target = evt.target;

            // clear selection on click outside from cards
            if (
                    target === this.element ||
                    target === this.templateObjects.templateNodeList.element ||
                    (target.component && target.component.identifier === "row")
                ) {
                this.editingDocument.clearSelectedObjects();
                this.editingDocument.clearSelectedElements();
            }
        }
    },

    handleRemoveElementAction: {
        value: function (evt) {
            this.editingDocument.setOwnedObjectElement(evt.detail.get('templateObject'), null);
        }
    },

    handleSelectedObjectsChange: {
        value: function (selectedObjects, oldSelectedObjects) {
            if (!selectedObjects || 0 === selectedObjects.length || selectedObjects.length > 1) {
                return;
            }

            //TODO do something sane if multiple objects are selected
            var selectedObject = selectedObjects[0],
                iterations = this.templateObjects.templateTreeController.iterations,
                iterationCount,
                iteration,
                i,
                selectedIteration;

            for (i = 0, iterationCount = iterations.length; (!selectedIteration && (iteration = iterations[i])); i++) {
                if (selectedObject === iteration.object) {
                    selectedIteration = iteration;
                }
            }

            if (selectedIteration) {
                this._scrollToElement = selectedIteration.firstElement;
                this.needsDraw = true;
            }
        }
    },

    handleEditingProxiesChange: {
        value: function (plus, minus, index) {
            var self = this;
            // nodeProxy's component property is set with a binding on editingProxy too
            // Using a nextTick assure us to be called after that binding has been set
            Promise.nextTick(function(){
                self.buildTemplateObjectTree();
            });
        }
    },

    _scrollToElement: {
        value: null
    },

    draw: {
        value: function () {
            if (this._scrollToElement) {
                // NOTE we need to wait for the drawing of the repetition to settle down
                // before we scroll to the iteration element we determeind we need to go to
                // this check for the selected class feel a little brittle but works well enough right now
                if (this._scrollToElement.classList.contains('selected')) {
                    this._scrollToElement.scrollIntoViewIfNeeded();
                    this._scrollToElement = null;
                } else {
                    this.needsDraw = true;
                }
            }
            var label = this.element.querySelector(".TemplateExplorer-hiddenControl");
            label.classList.toggle("is-disabled", this.hiddenCardsCount === 0);
        }
    }

});
