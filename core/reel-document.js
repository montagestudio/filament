var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    EditingController = require("palette/core/controller/editing-controller").EditingController,
    TemplateFormatter = require("palette/core/template-formatter").TemplateFormatter,
    Template = require("montage/core/template").Template,
    Promise = require("montage/core/promise").Promise,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    ReelProxy = require("core/reel-proxy").ReelProxy,
    SORTERS = require("palette/core/sorters"),
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor,
    ReelSerializer = require("core/serialization/reel-serializer").ReelSerializer,
    ReelReviver = require("core/serialization/reel-reviver").ReelReviver,
    ReelContext = require("core/serialization/reel-context").ReelContext,
    NodeProxy = require("core/node-proxy").NodeProxy,
    visit = require("montage/mousse/serialization/malker").visit,
    URL = require("core/node/url");

// The ReelDocument is used for editing Montage Reels
exports.ReelDocument = EditingDocument.specialize({

    constructor: {
        value: function ReelDocument() {
            this.super();
        }
    },

    _editor: {
        value: null
    },

    editor: {
        get: function () {
            return this._editor;
        },
        set: function (value) {
            if (value === this._editor) {
                return;
            }

            if (this._editor) {
                this._editor.removeEventListener("menuValidate", this);
                this._editor.removeEventListener("menuAction", this);
            }

            this._editor = value;

            if (this._editor) {
                this._editor.addEventListener("menuValidate", this);
                this._editor.addEventListener("menuAction", this);
            }
        }
    },

    init: {
        value: function (fileUrl, template, packageRequire, moduleId) {
            var self = this.super(fileUrl, packageRequire);
            var error;

            self._template = template;
            this._moduleId = moduleId;
            this._exportName = MontageReviver.parseObjectLocationId(moduleId).objectName;

            if (template) {
                this.registerFile("html", this._saveHtml, this);

                self._templateBodyNode = NodeProxy.create().init(this.htmlDocument.body, this);
                self.templateNodes = this._children(self._templateBodyNode);

                //TODO handle external serializations
                try {
                    var serialization = JSON.parse(template.getInlineObjectsString(template.document));
                    var context = this.deserializationContext(serialization);
                    context.ownerExportId = moduleId;
                    self._addProxies(context.getObjects());
                } catch (e) {

                    error = {
                        file: self.fileUrl,
                        error: {
                            id: "serializationError",
                            reason: e.message
                        }
                    };

                    self.errors.push(error);
                }
            } else {
                error = {
                    file: self.fileUrl,
                    error: {
                        id: "syntaxError",
                        reason: "Template was not found or was invalid"
                    }
                };

                self.errors.push(error);
            }

            return self;
        }
    },

    reviverConstructor: {
        value: ReelReviver
    },

    contextConstructor: {
        value: ReelContext
    },

    serializerConstructor: {
        value: ReelSerializer
    },

    handleMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = evt.detail.identifier;

            if ("delete" === identifier) {
                menuItem.enabled = this.canDelete;
                evt.stop();
            } else if ("undo" === identifier) {
                menuItem.enabled = this.canUndo;
                //TODO localize
                menuItem.title = this.canUndo ? "Undo " + this.undoManager.undoLabel : "Undo";
                evt.stop();
            } else if ("redo" === identifier) {
                menuItem.enabled = this.canRedo;
                //TODO localize
                menuItem.title = this.canRedo ? "Redo " + this.undoManager.redoLabel : "Redo";
                evt.stop();
            }
        }
    },

    handleMenuAction: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = evt.detail.identifier;

            if ("delete" === identifier) {
                if (this.canDelete) {
                    this.deleteSelected().done();
                }
                evt.stop();
            } else if ("undo" === identifier) {
                if (this.canUndo) {
                    this.undo().done();
                }
                evt.stop();
            } else if ("redo" === identifier) {
                if (this.canRedo) {
                    this.redo().done();
                }
                evt.stop();
            }
        }
    },

    handleCancelBinding: {
        value: function (evt) {
            var detail = evt.detail;
            this.cancelOwnedObjectBinding(detail.targetObject, detail.binding);
        }
    },

    canDelete: {
        get: function () {
            return !!this.getPath("selectedObjects.0");
        }
    },

    _template: {
        value: null
    },

    _templateBodyNode: {
        value: null
    },

    templateBodyNode: {
        get: function () {
            return this._templateBodyNode;
        }
    },

    // TODO super quick demo implementation to build a repetition friendly "tree"
    _children: {
        value: function (node, depth) {
            if (!depth) {
                depth = 0;
            }

            if (!node) {
                return;
            } else {
                node.depth = depth;
                if (node.children) {

                    var array = [node];

                    var grandChildren = node.children.forEach(function (child) {
                        array = array.concat(this._children(child, depth + 1));
                    }, this);

                    return array;
                } else {
                    return [node];
                }
            }
        }
    },

    templateNodes: {
        value: null
    },

    nodeProxyForNode: {
        value: function (node) {
            var nodes = this.templateNodes,
                i = 0,
                iNode = nodes ? nodes[i] : null,
                foundNode;

            while (!foundNode && iNode) {
                if (node === iNode._templateNode) {
                    foundNode = iNode;
                } else {
                    i++;
                    iNode = nodes[i];
                }
            }

            return foundNode;
        }
    },

    nodeProxyForMontageId: {
        value: function (montageId) {
            var nodes = this.templateNodes;
            var element;
            for (var i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i].montageId === montageId) {
                    element = nodes[i];
                    break;
                }
            }

            return element;
        }
    },

    _buildSerializationObjects: {
        value: function () {
            var template = this._template,
                templateObjects = {};

            Object.keys(this._editingProxyMap).sort(SORTERS.labelComparator).forEach(function (label) {
                templateObjects[label] = this.serializationForProxy(this._editingProxyMap[label]);
            }, this);

            template.objectsString = JSON.stringify(templateObjects, null, 4);

            return templateObjects;
        }
    },

    htmlDocument: {
        get: function () {
            return this._template.document;
        }
    },

    _ownerElement: {
        get: function () {
            //TODO patch this up a bit; should the proxies have an element property?
            return this.getPath("_editingProxyMap.owner.properties.get('element')");
        }
    },

    __ownerBlueprint: {
        value: null
    },
    _ownerBlueprint: {
        get: function () {
            return this.__ownerBlueprint || (
                this.__ownerBlueprint = this._packageRequire.async(this._moduleId)
                .get(this._exportName)
                .get("blueprint")
            );
        }
    },

    _registeredFiles: {
        value: null
    },

    /**
     * Registers a new file to save when the document is saved.
     *
     * @param  {string}   extension The extension of the file.
     * @param  {function(location, dataWriter): Promise} saveCallback
     * A function to call to save the file. Passed the location of the file
     * created by taking the reel location, extracting the basename and
     * suffixing the extensions. Must return a promise for the saving of the
     * file.
     */
    registerFile: {
        value: function (extension, saveCallback, thisArg) {
            var registeredFiles = this._registeredFiles = this._registeredFiles || {};
            registeredFiles[extension] = {callback: saveCallback, thisArg: thisArg};
        }
    },

    unregisterFile: {
        value: function (extension) {
            var registeredFiles = this._registeredFiles;
            if (registeredFiles) {
                delete registeredFiles[extension];
            }
        }
    },

    _saveHtml: {
        value: function (location, dataWriter) {
            this._buildSerializationObjects();
            var html = TemplateFormatter.create().init(this._template).getHtml();

            return dataWriter(html, location);
        }
    },

    save: {
        value: function (location, dataWriter) {
            var self = this;
            //TODO I think I've made this regex many times...and probably differently
            var filenameMatch = location.match(/.+\/(.+)\.reel/),
                path,
                registeredFiles = this._registeredFiles,
                promise;

            if (!(filenameMatch && filenameMatch[1])) {
                throw new Error('Components can only be saved into directories with a ".reel" extension');
            }

            if (!registeredFiles) {
                promise = Promise.resolve();
            } else {
                if (location.charAt(location.length - 1) !== "/") {
                    location += "/";
                }
                promise = Promise.all(Object.map(registeredFiles, function (info, extension) {
                    var fileLocation = URL.resolve(location, filenameMatch[1] + "." + extension);
                    return info.callback.call(info.thisArg, fileLocation, dataWriter);
                }));
            }

            return promise.then(function (value) {
                self._changeCount = 0;
                return value;
            });
        }
    },

    _editingController: {
        value: null
    },

    // Editing Model

    __removeProxy: {
        value: function (proxy) {
            var proxyMap = this._editingProxyMap,
                parentNode;

            if (!proxyMap.hasOwnProperty(proxy.label)) {
                throw new Error("Could not find proxy to remove with label '" + proxy.label + "'");
            }
            delete proxyMap[proxy.label];

            if (proxy.element && (parentNode = proxy.element.parentNode)) {
                parentNode.removeChild(proxy.element);
            }
        }
    },

    __addNodeProxy: {
        value: function (proxy) {
            this.templateNodes.push(proxy);
            proxy.children.forEach(function (child) {
                this.__addNodeProxy(child);
            }, this);

            //TODO this is a hack to refresh the dpeth of everythign on a change
            this.templateNodes = this._children(this._templateBodyNode);

            this.dispatchEventNamed("domModified", true, false);
        }
    },

    __removeNodeProxy: {
        value: function (proxy) {
            //Remove from Editing Model
            var index = this.templateNodes.indexOf(proxy);
            if (index >= 0) {
                this.templateNodes.splice(index, 1);
            }

            // If a component is using the node as an element then remove the
            // element reference.
            if (proxy.component) {
                this.setOwnedObjectElement(proxy.component, void 0);
            }

            proxy.children.forEach(function (child) {
                this.__removeNodeProxy(child);
            }, this);

            this.dispatchEventNamed("domModified", true, false);
        }
    },

    associateWithLiveRepresentations: {
        value: function (documentPart, template, frame) {
            var labels = Object.keys(documentPart.objects),
                self = this,
                proxy,
                serialization = template.getSerialization().getSerializationObject(),
                owner;

            var editController = this._editingController = EditingController.create();
            editController.frame = frame;
            editController.template = template;
            editController.owner = owner = documentPart.objects.owner;

            labels.forEach(function (label) {
                proxy = self.editingProxyMap[label];
                var stageObject = owner.templateObjects[label];
                // If this is an array, and not just array...
                if (Array.isArray(stageObject) && !("value" in serialization[label])) {
                    // ... then it's something repeated, and so we don't
                    // currently have a live representation. This will
                    // be provided by an inspector
                    proxy.stageObject = null;
                    // FIXME/HACK: need a way to get the parent of a component
                    // without having a live object
                    if (!stageObject.length) {
                        console.error("TODO: cannot get parentComponent of " + label);
                        proxy.parentComponent = null;
                        return;
                    }
                    stageObject = stageObject[0];
                } else {
                    // Only set stage object if component is not repeated
                    proxy.stageObject = stageObject;
                }

                // Owner has no parent
                if (stageObject === owner) {
                    return;
                }
            }, this);
        }
    },

    componentProxyForElement: {
        value: function (element) {
            var proxies = this.editingProxies,
                i = 0,
                iProxy,
                foundProxy;

            while (!foundProxy && (iProxy = proxies[i])) {
                i++;
                if (element === iProxy.properties.get("element")) {
                    foundProxy = iProxy;
                }
            }

            return foundProxy;
        }
    },

    // Selection API

    updateSelectionCandidate: {
        value: function (currentElement) {
            if (!currentElement) {
                return;
            }

            var selectedObjects = this.selectedObjects;
            var selectionCandidate = currentElement.component;

            var ownerComponent = this.editingProxyMap.owner.stageObject;
            var ownerElement = ownerComponent.element;
            var selectedElements = selectedObjects.map(function (object) {
                return object.getPath("stageObject.element");
            });

            // Select the highest component inside the current selection
            while (
                currentElement !== ownerElement &&
                    selectedElements.indexOf(currentElement) === -1 &&
                    currentElement != null
                ) {
                var component = currentElement.component;
                if (component) {
                    // Correct code:
                    if (component.ownerComponent === ownerComponent) {
                        // Only update the selection candidate if the component
                        // is in this reel
                        selectionCandidate = component;
                    }

                }
                currentElement = currentElement.parentElement;
            }

            return selectionCandidate ? this.editingProxyForObject(selectionCandidate) : void 0;
        }
    },

    // Editing API

    _generateUniqueName: {
        value: function(baseName, existingNames) {
            var nameRegex = new RegExp("^" + baseName + "(\\d+)$", "i"),
                match,
                lastUsedIndex;

            lastUsedIndex = existingNames.map(function(name) {
                match = name.match(nameRegex);
                return match && match[1] ? match[1] : null;
            }).reduce(function (lastFoundIndex, index) {
                if (null == index) {
                    return lastFoundIndex;
                } else {
                    index = parseInt(index, 10);

                    if (null == lastFoundIndex) {
                        return index;
                        //TODO should we fill in gaps? or find the highest used index?
                    } else if (index > lastFoundIndex) {
                        return index;
                    } else {
                        return lastFoundIndex;
                    }
                }
            }, 0);

            lastUsedIndex = lastUsedIndex || 0;

            return baseName + (lastUsedIndex + 1);
        }
    },

    _generateMontageId: {
        value: function (moduleId) {
            var name = MontageReviver.parseObjectLocationId(moduleId).objectName,
                id = name.substring(0, 1).toLowerCase() + name.substring(1),
                idSelector = '[data-montage-id^="' + id + '"]',
                elements = this.htmlDocument.querySelectorAll(idSelector),
                arrayMap = Array.prototype.map,
                existingIds;

            existingIds = arrayMap.call(elements, function(element) {
                return element.getAttribute("data-montage-id");
            });

            return this._generateUniqueName(id, existingIds);
        }
    },

    _generateLabel: {
        value: function (serialization) {
            var name = MontageReviver.parseObjectLocationId(serialization.prototype).objectName,
                label = name.substring(0, 1).toLowerCase() + name.substring(1),
                existingLabels = Object.keys(this.editingProxyMap);

            return this._generateUniqueName(label, existingLabels);
        }
    },

    _templateForProxy: {
        value: function (proxy) {

            // TODO gather proxies that are children of this seeing as we're including their elements

            var doc,
                serializationElement,
                sourceDocument = this._template.document,
                proxySerializationFragment = this.serializationForProxy(proxy),
                proxySerialization = {},
                proxyElement = proxy.properties.get("element"),
                importedNode;

            proxySerialization[proxy.label] = proxySerializationFragment;

            doc = sourceDocument.implementation.createHTMLDocument();
            serializationElement = doc.createElement("script");
            serializationElement.setAttribute("type", "text/montage-serialization");
            serializationElement.appendChild(document.createTextNode(JSON.stringify(proxySerialization)));
            doc.head.appendChild(serializationElement);

            if (proxyElement) {
                importedNode = doc.importNode(proxyElement._templateNode, true);
                doc.body.appendChild(importedNode);
            }

            return Template.create().initWithDocument(doc, this._packageRequire);
        }
    },

    /**
     * Creates a montageId based on the suggestedId or, if already taken,
     * generates a new ID, and assigns it to the nodeProxy.
     * @param  {string} suggestedId   A prefered ID, usually the label of
     * the template object.
     * @param {string} moduleId The module ID to base the montage ID off if
     * the suggestedId isn't available.
     * @param  {NodeProxy} nodeProxy The nodeProxy to assign the ID to
     * @return {string}              The new montageId
     */
    createMontageIdForProxy: {
        value: function (suggestedId, moduleId, nodeProxy) {
            var montageId;
            if (this.nodeProxyForMontageId(suggestedId)) {
                montageId = this._generateMontageId(moduleId);
            } else {
                // If the generated component label can be used as
                // a montage id then there is no need to generate
                // another name, it is also clear for the user
                // that they are "bound" together.
                montageId = suggestedId;
            }
            this.setNodeProxyMontageId(nodeProxy, montageId);

            return montageId;
        }
    },

    /**
     * The method is a temporary anomaly that accepts what our library items currently are
     * and builds a template for merging
     *
     * This will be replaced with an addTemplate or insertTemplate or mergeTemplate
     */
    addLibraryItemFragments: {
        value: function (serializationFragment, htmlFragment, parentElement, nextSiblingElement, stageElement, montageId) {
            var labelInOwner,
                templateSerialization = {},
                self = this,
                doc,
                serializationElement;

            // Try and use the montageId as the label, if not generate one from the prototype name
            if (montageId && Object.keys(this.editingProxyMap).indexOf(montageId) === -1) {
                labelInOwner = montageId;
            } else {
                labelInOwner = this._generateLabel(serializationFragment);
            }

            // If there's no htmlFragment given then none of the element
            // references in the serialization are valid, and they might end up
            // capturing elements from the current template, which we don't
            // want. Solution: just remove all element references.
            if (serializationFragment && !htmlFragment) {
                var parent = serializationFragment;
                visit(serializationFragment, {
                    enterObject: function (walker, object, name) {
                        parent = object;
                    },
                    willEnterObject: function (walker, object, name) {
                        if (object.hasOwnProperty("#")) {
                            // remove element referenece
                            delete parent[name];
                            // don't enter this object
                            return false;
                        }
                    }
                });
            }

            templateSerialization[labelInOwner] = serializationFragment;

            doc = document.implementation.createHTMLDocument();
            serializationElement = doc.createElement("script");
            serializationElement.setAttribute("type", "text/montage-serialization");
            serializationElement.appendChild(document.createTextNode(JSON.stringify(templateSerialization)));
            doc.head.appendChild(serializationElement);
            if (htmlFragment) {
                doc.body.innerHTML = htmlFragment;
            }

            return Template.create().initWithDocument(doc, this._packageRequire).then(function (template) {
                return self.addObjectsFromTemplate(template, parentElement, nextSiblingElement, stageElement);
            }).then(function (objects) {
                // only if there's only one object?
                if (objects.length && self.selectObjectsOnAddition) {
                    self.clearSelectedObjects();
                    self.selectObject(objects[0]);
                }

                return objects;
            });
        }
    },

    addAndAssignLibraryItemFragment: {
        value: function (serializationFragment, nodeProxy) {
            var self = this,
                montageId = nodeProxy.montageId;

            this.undoManager.openBatch("Add component to element");

            return this.addLibraryItemFragments(serializationFragment, void 0, void 0, void 0, void 0, montageId).then(function (objects) {
                var label;

                if (objects.length === 1) {
                    label = objects[0].label;
                    if (!montageId) {
                        montageId = self.createMontageIdForProxy(label, serializationFragment.prototype, nodeProxy);
                    }
                    self.setOwnedObjectElement(objects[0], montageId);
                }

                return objects;
            }).finally(function () {
                self.undoManager.closeBatch();
                self.editor.refresh();
            });
        }
    },

    /**
     * Finds the component closest to the specified element in the current
     * reel
     * @param {NodeProxy} element
     * @private
     */
    nearestComponent: {
        value: function (element) {
            var owner = this.editingProxyMap.owner;
            var nearestComponent;
            var aParentNode;

            if (element) {
                while (
                    (
                        !nearestComponent ||
                        nearestComponent.ownerComponent !== owner ||
                        nearestComponent !== owner
                    ) &&
                    (aParentNode = element.parentNode)
                ) {
                    nearestComponent = element.component;
                    element = aParentNode;
                }
            }

            return nearestComponent || owner;
        }
    },

    /**
     * Merges content from the specified template into the Template being edited
     *
     * @param {Template} template A Montage template
     * @param {ReelProxy} parentProxy The proxy that will serve as the parent for inserted objects
     * @param {NodeProxy} nextNode The proxy representing the node to insert before in the DOM
     * @param {Element} nextSiblingElement TODO
     *
     * @return {Promise} A promise for the proxies inserted into the template being edited
     */
    addObjectsFromTemplate: {
        value: function (sourceTemplate, parentElement, nextSiblingElement, stageElement) {
            // Ensure backing template is up to date
            this._buildSerializationObjects();

            var destinationTemplate = this._template,
                context,
                self = this,
                revisedTemplate,
                ownerProxy;

            this.undoManager.openBatch("Add Objects");

            revisedTemplate = this._merge(destinationTemplate, sourceTemplate, parentElement, nextSiblingElement);
            ownerProxy = this.editingProxyMap.owner;

            // Prepare a context that knows about the existing editing proxies prior to
            // creating new editing proxies
            context = this.deserializationContext(destinationTemplate.getSerialization().getSerializationObject(), this._editingProxyMap);

            return Promise.all(revisedTemplate.getSerialization().getSerializationLabels().map(function (label) {
                    return Promise(context.getObject(label)).then(function (proxy) {
                        return self.addObject(proxy);
                    });
                }))
                .then(function (addedProxies) {

                    self.undoManager.closeBatch();

                    // Introduce the revised template into the stage
                    if (this._editingController) {

                        //TODO not sneak this in through the editingController
                        // Make the owner component in the stage look like we expect before trying to install objects
                        this._editingController.owner._template.objectsString = destinationTemplate.objectsString;
                        this._editingController.owner._template.setDocument(destinationTemplate.document);

                        return self._editingController.addObjectsFromTemplate(revisedTemplate, stageElement).then(function (objects) {
                            for (var label in objects) {
                                if (typeof objects.hasOwnProperty !== "function" || objects.hasOwnProperty(label)) {
                                    self._editingProxyMap[label].stageObject = objects[label];
                                }
                            }

                            return addedProxies;
                        });
                    } else {
                        return addedProxies;
                    }
                });
        }
    },

    /**
     * Merges the content from the sourceTemplate into the destinationTemplate while resolving
     * collisions between element identifiers and labels that already appear within the
     * destinationTemplate.
     *
     * @param {Template} destinationTemplate The template to merge the sourceTemplate content into
     * @param {Template} sourceTemplate The template to merge into the destination template
     * @param {Element} parentElement The optional element to insert the content of the template inside of
     * @param {Element} nextSiblingElement The optional element to insert the content of the template before
     *
     * @returns {Template} The revised template that was logically used to introduce the sourceTemplate into the destinationTemplate
     * @private
     */
    _merge: {
        value: function (destinationTemplate, sourceTemplate, parentElement, nextSiblingElement) {
            var serializationToMerge = sourceTemplate.getSerialization(),
                sourceContentRange,
                sourceContentFragment,
                sourceDocument = sourceTemplate.document,
                templateSerialization = destinationTemplate.getSerialization(),
                labelsCollisionTable,
                idsCollisionTable,
                newChildNodes,
                i,
                iChild,
                insertionParent = parentElement || this._ownerElement;

            sourceContentRange = sourceDocument.createRange();
            sourceContentRange.selectNodeContents(sourceDocument.body);
            sourceContentFragment = sourceContentRange.cloneContents();

            newChildNodes = [];
            for (i = 0; (iChild = sourceContentFragment.childNodes[i]); i++) {
                newChildNodes.push(iChild);
            }

            // Merge markup
            // NOTE operations are performed on the template with real template DOM nodes
            //TODO this is a it mof a mess where we perform the merge with the template DOM, but then do the "same" operation to associate the nodeProxies with their parent right afterwards
            if (nextSiblingElement) {
                idsCollisionTable = destinationTemplate.insertNodeBefore(sourceContentFragment, nextSiblingElement._templateNode);
            } else {
                idsCollisionTable = destinationTemplate.appendNode(sourceContentFragment, insertionParent._templateNode);
            }

            if (idsCollisionTable) {
                serializationToMerge.renameElementReferences(idsCollisionTable);
            }

            // Add nodeProxies for newly added node
            newChildNodes.forEach(function (newChild) {
                var nodeProxy = NodeProxy.create().init(newChild, this);

                if (nextSiblingElement) {
                    this.insertNodeBeforeTemplateNode(nodeProxy, nextSiblingElement);
                } else {
                    this.appendChildToTemplateNode(nodeProxy, insertionParent);
                }
            }, this);

            // Merge serialization
            labelsCollisionTable = templateSerialization.mergeSerialization(serializationToMerge);

            //Update underlying template string
            destinationTemplate.objectsString = templateSerialization.getSerializationString();

            // Revise the sourceSerialization
            var revisedTemplate = sourceTemplate.clone(),
                revisedSerialization = revisedTemplate.getSerialization();

            if (idsCollisionTable) {
                revisedSerialization.renameElementReferences(idsCollisionTable);
            }
            if (labelsCollisionTable) {
                revisedSerialization.renameSerializationLabels(labelsCollisionTable);
            }

            revisedTemplate.objectsString = revisedSerialization.getSerializationString();

            for (var id in idsCollisionTable) {
                if (typeof idsCollisionTable.hasOwnProperty !== "function" || idsCollisionTable.hasOwnProperty(id)) {
                    var element = revisedTemplate.getElementById(id);
                    revisedTemplate.setElementId(element, idsCollisionTable[id]);
                }
            }

            return revisedTemplate;
        }
    },

    addObject: {
        value: function (proxy) {
            this._addProxies(proxy);

            this.undoManager.register("Add object", Promise.resolve([this.removeObject, this, proxy]));

            this.editor.refresh();
            return proxy;
        }
    },

    /**
     * Remove the specified proxies from the editing model object graph
     * @param {Array} proxies The editing proxies to remove from the editing model
     * @return {Promise} A promise for the removal of the proxies
     */
    removeObjects: {
        value: function (proxies) {
            var undoLabel = "Remove Objects",
                self = this;

            if (1 === proxies.length) {
                undoLabel = "Remove";
            }

            this.undoManager.openBatch(undoLabel);

            var removalPromises = proxies.map(function (p) {
                return self.removeObject(p);
            });

            this.undoManager.closeBatch();

            return Promise.all(removalPromises);
        }
    },

    /**
     * Remove the specified proxy from the editing model object graph
     * @param {Proxy} proxy An editing proxy to remove from the editing model
     * @return {Promise} A promise for the removal of the proxy
     */
    removeObject: {
        value: function (proxy) {

            //TODO add options to remove child components and/or the DOM tree under this component
            //TODO this warrants some minor forking of removingObject vs removingComponent though I don't want seperata API if I can help it

            var self = this,
                removalPromise,
                deferredUndo = Promise.defer(),
                body,
                bodyRange;

            this.undoManager.openBatch("Remove");

            this.undoManager.register("Remove", deferredUndo.promise);

            if (this._editingController && proxy.stageObject) {
                removalPromise = this._editingController.removeObject(proxy.stageObject);
            } else {
                removalPromise = Promise.resolve(proxy);
            }

            return removalPromise.then(function () {
                var element = proxy.properties.get("element");
                if (element) {
                    self.setOwnedObjectElement(proxy, void 0);
                }

                self._removeProxies(proxy);

                deferredUndo.resolve([self.addObject, self, proxy]);

                self.dispatchEventNamed("objectRemoved", true, false, { proxy: proxy });

                self.undoManager.closeBatch();

                self.editor.refresh();
                return proxy;
            });
        }
    },

    deleteSelected: {
        value: function () {
            var selectedObject = this.getPath("selectedObjects.0"),
                result;

            if (selectedObject) {
                result = this.removeObject(selectedObject);
            } else {
                result = Promise.resolve(null);
            }

            return result;
        }
    },

    defineOwnedObjectBinding: {
        value: function (proxy, targetPath, oneway, sourcePath) {
            var binding = proxy.defineObjectBinding(targetPath, oneway, sourcePath);

            if (binding) {
                // if (this._editingController) {
                //     // TODO define the binding on the stage, make sure we can cancel it later
                // }

                this.undoManager.register("Define Binding", Promise.resolve([this.cancelOwnedObjectBinding, this, proxy, binding]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerializationObjects();

            return binding;
        }
    },

    cancelOwnedObjectBinding: {
        value: function (proxy, binding) {
            var removedBinding = proxy.cancelObjectBinding(binding);

            if (removedBinding) {
                // if (this._editingController) {
                //     // TODO cancel the binding in the stage
                // }

                this.undoManager.register("Cancel Binding", Promise.resolve([
                    this.defineOwnedObjectBinding, this, proxy, binding.targetPath, binding.oneway, binding.sourcePath
                ]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerializationObjects();

            return removedBinding;
        }
    },

    updateOwnedObjectBinding: {
        value: function (proxy, existingBinding, targetPath, oneway, sourcePath) {
            var removedBinding = proxy.cancelObjectBinding(existingBinding);
            var binding = proxy.defineObjectBinding(targetPath, oneway, sourcePath);

            if (removedBinding && binding) {
                // if (this._editingController) {
                //     // TODO cancel the binding in the stage
                //     // TODO define the binding on the stage, make sure we can cancel it later
                // }

                this.undoManager.register("Edit Binding", Promise.resolve([
                    this.updateOwnedObjectBinding, this, proxy, binding, removedBinding.targetPath, removedBinding.oneway, removedBinding.sourcePath
                ]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerializationObjects();

            return removedBinding;
        }
    },

    addOwnedObjectEventListener: {
        value: function (proxy, type, listener, useCapture) {
            var listenerEntry = proxy.addObjectEventListener(type, listener, useCapture);

            if (listenerEntry) {
                // if (this._editingController) {
                //     // TODO register the listener on the stage, make sure we can remove it later
                // }

                this.undoManager.register("Add Listener", Promise.resolve([this.removeOwnedObjectEventListener, this, proxy, listenerEntry]));
            }

            return listenerEntry;
        }
    },

    removeOwnedObjectEventListener: {
        value: function (proxy, listener) {
            var removedListener = proxy.removeObjectEventListener(listener);

            if (removedListener) {
                // if (this._editingController) {
                //     // TODO remove the listener on the stage
                // }

                this.undoManager.register("Remove Listener", Promise.resolve([
                    this.addOwnedObjectEventListener, this, proxy, removedListener.type, removedListener.listener, removedListener.useCapture
                ]));
            }

            return removedListener;
        }
    },

    setNodeProxyMontageId: {
        value: function(nodeProxy, montageId) {
            this.undoManager.register("Set Montage Id", Promise.resolve([this.setNodeProxyMontageId, this, nodeProxy, nodeProxy.montageId]));

            // TODO Kind of reaching into NodeProxy's domain but this will
            // have to do until we figure out the data model for the node
            // proxy.
            if (montageId) {
                nodeProxy._templateNode.setAttribute("data-montage-id", montageId);
            } else {
                nodeProxy._templateNode.removeAttribute("data-montage-id");
            }

            nodeProxy.dispatchOwnPropertyChange("montageId", montageId);
        }
    },

    setOwnedObjectElement: {
        value: function (proxy, montageId) {
            var element;
            if (montageId) {
                element = this.nodeProxyForMontageId(montageId);

                if (!element) {
                    throw new Error(montageId + " not found in templateNodes");
                }
            }

            var existingComponent = element ? element.component : null;

            if (existingComponent) {
                this.undoManager.openBatch("Set element");
                this.setOwnedObjectElement(existingComponent, null);
            }

            // HACK to give the flow height so that it can been seen and edited
            if (element && proxy.moduleId === "montage/ui/flow.reel") {
                var template = this.editor.projectController.libraryItemForModuleId(proxy.moduleId, proxy.exportName).html;
                var container = document.createElement("div");
                container.innerHTML = template;
                element._templateNode.setAttribute("style", container.firstChild.getAttribute("style"));
            }
            // END HACK

            var properties = proxy.properties;
            var oldElement = properties.get("element");

            properties.set("element", element);
            this.undoManager.register("Set element", Promise.resolve([
                this.setOwnedObjectElement, this, proxy, (oldElement) ? oldElement.montageId : void 0
            ]));

            if (existingComponent) {
                this.undoManager.closeBatch();
            }

            if (oldElement) {
                oldElement.dispatchOwnPropertyChange("component", void 0);
            }
            if (element) {
                element.dispatchOwnPropertyChange("component", proxy);
            }
        }
    },


    //Template Node Editing API

    canRemoveTemplateNode: {
        value: function (nodeProxy) {
            var isBody = "body" === nodeProxy.tagName.toLowerCase(),
                isOwner = !!(nodeProxy.component && "owner" === nodeProxy.component.label);

            return !(isBody || isOwner);
        }
    },

    removeTemplateNode: {
        value: function (nodeProxy) {
            // Don't allow removing the body or the owner's element
            if (!this.canRemoveTemplateNode(nodeProxy)) {
                return;
            }

            var nextSibling = nodeProxy.nextSibling,
                parentNode = nodeProxy.parentNode;

            this.undoManager.openBatch("Remove Node");

            nodeProxy.parentNode.removeChild(nodeProxy);
            this.__removeNodeProxy(nodeProxy);

            if (nextSibling) {
                this.undoManager.register("Remove Node", Promise.resolve([this.insertNodeBeforeTemplateNode, this, nodeProxy, nextSibling]));
            } else {
                this.undoManager.register("Remove Node", Promise.resolve([this.appendChildToTemplateNode, this, nodeProxy, parentNode]));
            }

            this.undoManager.closeBatch();

            return nodeProxy;
        }
    },

    /**
     * Create a node proxy for a new element with the given HTML. The given
     * HTML must be a single element with no children.
     * This node proxy is not part of the template until it is explicitly
     * added to the template through one of the available methods.
     *
     * @see appendChildToTemplateNode
     *
     * @param {String} tagName The tagName of the element this nodeProxy will represent
     * @return {NodeProxy} A proxy for the newly created element.
     */
    createTemplateNode: {
        value: function (html) {
            var container = this.htmlDocument.createElement("div");
            container.innerHTML = html;
            var element = container.firstChild;
            if (element.children.length) {
                throw new Error("Cannot create template node for element with children");
            }
            return NodeProxy.create().init(element, this);
        }
    },

    canAppendToTemplateNode: {
        value: function (nodeProxy) {
            var isBody = "body" === nodeProxy.tagName.toLowerCase();
            return !isBody;
        }
    },

    /**
     * Append the specified nodeProxy to the template
     *
     * @param {NodeProxy} nodeProxy The nodeProxy to introduce to the template
     * @param {NodeProxy} parentNodeProxy The optional parent proxy for the incoming nodeProxy
     * If not specified, the nodeProxy associated with the owner component will be used.
     * @return {NodeProxy} The node proxy that was inserted in the template
     */
    appendChildToTemplateNode: {
        value: function (nodeProxy, parentNodeProxy) {

            if (parentNodeProxy && !this.canAppendToTemplateNode(parentNodeProxy)) {
                return;
            }

            parentNodeProxy = parentNodeProxy || this._ownerElement;

            parentNodeProxy.appendChild(nodeProxy);
            this.__addNodeProxy(nodeProxy);

            this.undoManager.register("Append Node", Promise.resolve([this.removeTemplateNode, this, nodeProxy]));

            return nodeProxy;
        }
    },

    canInsertBeforeTemplateNode: {
        value: function (nodeProxy) {
            var isBody = "body" === nodeProxy.tagName.toLowerCase(),
                isOwner = !!(nodeProxy.component && "owner" === nodeProxy.component.label);

            return !(isBody || isOwner);
        }
    },

    /**
     * Insert the specified nodeProxy before the specified sibling proxy
     *
     * @param {NodeProxy} nodeProxy The nodeProxy to insert
     * @param {NodeProxy} nextSiblingProxy The nodeProxy to insert before
     * @return {NodeProxy} The node proxy that was inserted in the template
     */
    insertNodeBeforeTemplateNode: {
        value: function (nodeProxy, nextSiblingProxy) {

            if (!this.canInsertBeforeTemplateNode(nextSiblingProxy)) {
                return;
            }

            var parentProxy = nextSiblingProxy.parentNode;
            parentProxy.insertBefore(nodeProxy, nextSiblingProxy);
            this.__addNodeProxy(nodeProxy);

            this.undoManager.register("Insert Node Before", Promise.resolve([this.removeTemplateNode, this, nodeProxy]));

            return nodeProxy;
        }
    },

    canInsertAfterTemplateNode: {
        value: function (nodeProxy) {
            var isBody = "body" === nodeProxy.tagName.toLowerCase(),
                isOwner = !!(nodeProxy.component && "owner" === nodeProxy.component.label);

            return !(isBody || isOwner);
        }
    },

    /**
     * Insert the specified nodeProxy after the specified sibling proxy
     *
     * @param {NodeProxy} nodeProxy The nodeProxy to insert
     * @param {NodeProxy} nextSiblingProxy The nodeProxy to insert after
     * @return {NodeProxy} The node proxy that was inserted in the template
     */
    insertNodeAfterTemplateNode: {
        value: function (nodeProxy, previousSiblingProxy) {

            if (!this.canInsertAfterTemplateNode(previousSiblingProxy)) {
                return;
            }

            var parentProxy = previousSiblingProxy.parentNode;
            parentProxy.insertBefore(nodeProxy, previousSiblingProxy.nextSibling);
            this.__addNodeProxy(nodeProxy);

            this.undoManager.register("Insert Node After", Promise.resolve([this.removeTemplateNode, this, nodeProxy]));

            return nodeProxy;
        }
    },

    // Owner blueprint

    addOwnerBlueprintProperty: {
        value: function (propertyBlueprint) {
            var self = this;
            return this.undoManager.register(
                "Add owner property",
                this._ownerBlueprint.then(function (blueprint) {
                    blueprint.addPropertyBlueprint(propertyBlueprint);
                    blueprint.addPropertyBlueprintToGroupNamed(propertyBlueprint, self._exportName);
                    return [self.removeOwnerBlueprintProperty, self, propertyBlueprint];
                })
            );
        }
    },

    modifyOwnerBlueprintProperty: {
        value: function (propertyBlueprint, property, value) {
            var previousValue = propertyBlueprint[property];
            propertyBlueprint[property] = value;
            return this.undoManager.register(
                "Modify owner property",
                Promise.resolve([this.modifyOwnerBlueprintProperty, this, propertyBlueprint, property, previousValue])
            );
        }
    },

    removeOwnerBlueprintProperty: {
        value: function (propertyBlueprint) {
            var self = this;
            return this.undoManager.register(
                "Remove owner property",
                this._ownerBlueprint.then(function (blueprint) {
                    blueprint.removePropertyBlueprint(propertyBlueprint);
                    blueprint.removePropertyBlueprintFromGroupNamed(propertyBlueprint, self._exportName);
                    return [self.addOwnerBlueprintProperty, self, propertyBlueprint];
                })
            );
        }
    }

}, {
    load: {
        value: function (fileUrl, packageUrl) {
            var self = this;

            // require.async() expect moduleId not URLs
            var componentModuleId = URL.toModuleId(fileUrl, packageUrl);

            var objectName = MontageReviver.parseObjectLocationId(componentModuleId).objectName;

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return packageRequire.async(componentModuleId).get(objectName).then(function (componentPrototype) {
                    if (!componentPrototype) {
                        throw new Error("Cannot load component: Syntax error in " + componentModuleId + "[" + objectName + "] implementation");
                    }
                    return Template.getTemplateWithModuleId(componentPrototype.templateModuleId, packageRequire);
                },function (error) {
                    throw new Error("Cannot load component: " + error);
                }).then(function (template) {
                    return self.create().init(fileUrl, template, packageRequire, componentModuleId);
                }, function (error) {
                    // There is no template. This could still be a valid component…
                    console.log("Cannot load component template.", error);
                    return self.create().init(fileUrl, null, packageRequire, componentModuleId);
                });
            });
        }
    },

    editorType: {
        get: function () {
            return ComponentEditor;
        }
    }

});
