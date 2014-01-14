var EditingDocument = require("palette/core/editing-document").EditingDocument,
    EditingController = require("palette/core/controller/editing-controller").EditingController,
    TemplateFormatter = require("palette/core/template-formatter").TemplateFormatter,
    Template = require("montage/core/template").Template,
    Promise = require("montage/core/promise").Promise,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    SORTERS = require("palette/core/sorters"),
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor,
    ReelSerializer = require("core/serialization/reel-serializer").ReelSerializer,
    ReelReviver = require("core/serialization/reel-reviver").ReelReviver,
    ReelContext = require("core/serialization/reel-context").ReelContext,
    NodeProxy = require("core/node-proxy").NodeProxy,
    visit = require("montage/mousse/serialization/malker").visit,
    URL = require("core/node/url"),
    PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint,
    EventBlueprint = require("montage/core/meta/event-blueprint").EventBlueprint,
    ObjectReferences = require("core/object-references").ObjectReferences;

// The ReelDocument is used for editing Montage Reels
exports.ReelDocument = EditingDocument.specialize({

    constructor: {
        value: function ReelDocument() {
            this.super();
            this.sideData = Object.create(null);
            this.references = new ObjectReferences();
            this.selectedElements = [];

            this.addRangeAtPathChangeListener("selectedObjects", this, "handleSelectedObjectsChange");
            this.addRangeAtPathChangeListener("selectedElements", this, "handleSelectedElementsChange");
        }
    },

    _editor: {
        value: null
    },

    selectedElements: {
        value: null
    },

    activeSelection: {
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
                            reason: e.message,
                            stack: e.stack
                        },
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

            if (self.errors.length) {
                console.error("Errors loading document", self.errors);
            }

            return self;
        }
    },

    /**
     * An object to store UI state
     * @type {Object}
     */
    sideData: {
        value: null
    },

    /**
     * Stores which objects reference which other objects, so that when they're
     * deleted in the editor, other references can be cleaned up.
     * @type {ObjectReferences}
     */
    references: {
        value: null
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

    filesDidChange: {
        value: function (changes) {
            var shouldReload = false;

            // Reload the frame whenever external CSS is changed
            for (var i = 0; i < changes.length; i++) {
                if (changes[i].fileUrl.search(/\.css$/) !== -1) {
                    shouldReload = true;
                    break;
                }
            }

            if (shouldReload) {
                this.editor.refresh();
            }
        }
    },

    selectElement: {
        value: function (elem) {
            if (this.selectedElements.indexOf(elem) === -1) {
                this.selectedElements.push(elem);
            }
        }
    },

    clearSelectedElements: {
        value: function () {
            this.selectedElements = [];
        }
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
            var identifier = evt.detail.identifier;

            if ("delete" === identifier) {
                if (this.canDelete) {
                    this.deleteSelected();
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
            return !!this.activeSelection && this.activeSelection.length > 0;
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

                    node.children.forEach(function (child) {
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

    nodeProxyForComponent: {
        value: function (component) {
            var nodes = this.templateNodes,
                i = 0,
                iNode = nodes ? nodes[i] : null,
                foundNode;

            while (!foundNode && iNode) {
                if (component === iNode.component) {
                    foundNode = iNode;
                } else {
                    i++;
                    iNode = nodes[i];
                }
            }

            return foundNode;
        }
    },

    nodeProxyForXPath: {
        value: function (xpath) {
            var element = this.htmlDocument.evaluate(
                        xpath,
                        this.htmlDocument,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
            return this.nodeProxyForNode(element);
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
        }
    },

    __removeNodeProxy: {
        value: function (proxy) {
            //Remove from Editing Model
            var index = this.templateNodes.indexOf(proxy);
            if (index >= 0) {
                this.templateNodes.splice(index, 1);
            }

            // If an object is using the node then remove the element reference.
            this.references.forEach(proxy, function (proxy, property) {
                this.setOwnedObjectProperty(proxy, property, void 0);
            }, this);

            proxy.children.forEach(function (child) {
                this.__removeNodeProxy(child);
            }, this);
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
            if (!selectionCandidate) {
                return;
            }
            var ownerComponent = this.editingProxyMap.owner.stageObject;
            if (!ownerComponent) {
                return;
            }
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
            this.setNodeProxyAttribute(nodeProxy, "data-montage-id", montageId);

            return montageId;
        }
    },

    /**
     * @private
     * Build a template on the fly for inclusion into the existing document
     * given relevant information
     *
     * @return {Promise} A promise for a Montage template constructed with the specified information
     */
    _buildTemplate: {
        value: function (label, serializationFragment, htmlFragment) {
            var templateSerialization = {},
                doc = document.implementation.createHTMLDocument(),
                serializationElement;

            // Try and use the montageId as the label, if not generate one from the prototype name
            if (!label || Object.keys(this.editingProxyMap).indexOf(label) > -1) {
                label = this._generateLabel(serializationFragment);
            }

            templateSerialization[label] = serializationFragment;

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

            serializationElement = doc.createElement("script");
            serializationElement.setAttribute("type", "text/montage-serialization");
            serializationElement.appendChild(document.createTextNode(JSON.stringify(templateSerialization)));
            doc.head.appendChild(serializationElement);
            if (htmlFragment) {
                doc.body.innerHTML = htmlFragment;
            }

            return Template.create().initWithDocument(doc, this._packageRequire);
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
            var self = this;

            return this._buildTemplate(montageId, serializationFragment, htmlFragment).then(function (template) {
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
                self.dispatchEventNamed("domModified", true, false);
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
            this.dispatchEventNamed("objectAdded", true);
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
                deferredUndo = Promise.defer();

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
                self.undoManager.closeBatch();

                self.dispatchEventNamed("objectRemoved", true, false, { proxy: proxy });

                self.editor.refresh();
                self.dispatchEventNamed("domModified", true, false);
                return proxy;
            });
        }
    },

    deleteSelectedObject: {
        value: function () {
            var selectedObject = this.getPath("selectedObjects.0"),
                result;

            if (selectedObject) {
                result = this.removeObject(selectedObject);
                result.done();
            }
            return selectedObject;
        }
    },

    deleteSelectedElement: {
        value: function () {
            var selectedElement = this.getPath("selectedElements.0");
            return this.removeTemplateNode(selectedElement);
        }
    },

    deleteSelected: {
        value: function () {
            if (this.activeSelection === this.selectedElements) {
                return this.deleteSelectedElement();
            }
            else if (this.activeSelection === this.selectedObjects){
                return this.deleteSelectedObject();
            }
        }
    },

    handleSelectedObjectsChange: {
        value: function (selectedObjects, oldSelectedObjects){
            if (!selectedObjects || selectedObjects.length > 0) {
                this.activeSelection = this.selectedObjects;
                this.clearSelectedElements();
            }
        }
    },

    handleSelectedElementsChange: {
        value: function (selectedElements, oldSelectedElements){
            if (!selectedElements || selectedElements.length > 0) {
                this.activeSelection = this.selectedElements;
                this.clearSelectedObjects();
            }
        }
    },

    defineOwnedObjectBinding: {
        value: function (proxy, targetPath, oneway, sourcePath, converter) {
            var binding = proxy.defineObjectBinding(targetPath, oneway, sourcePath, converter);

            if (binding) {
                // if (this._editingController) {
                //     // TODO define the binding on the stage, make sure we can cancel it later
                // }

                this.undoManager.register("Define Binding", Promise.resolve([this.cancelOwnedObjectBinding, this, proxy, binding]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerializationObjects();

            // Refresh the stage
            this.editor.refresh();

            return binding;
        }
    },

    _addOwnedObjectBinding: {
        value: function (proxy, binding, insertionIndex) {

            var addedBinding = proxy.addBinding(binding, insertionIndex);

            if (addedBinding) {
                this.undoManager.register("Define Binding", Promise.resolve([this.cancelOwnedObjectBinding, this, proxy, binding]));
            }

            return addedBinding;

        }
    },

    cancelOwnedObjectBinding: {
        value: function (proxy, binding) {
            var removedBinding,
                removedIndex,
                removedInfo;

            removedInfo = proxy.cancelObjectBinding(binding);
            removedBinding = removedInfo.removedBinding;
            removedIndex = removedInfo.index;

            if (removedBinding) {
                // if (this._editingController) {
                //     // TODO cancel the binding in the stage
                // }

                this.undoManager.register("Cancel Binding", Promise.resolve([
                    this._addOwnedObjectBinding, this, proxy, removedBinding, removedIndex
                ]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerializationObjects();

            // Refresh the stage
            this.editor.refresh();

            return removedBinding;
        }
    },

    updateOwnedObjectBinding: {
        value: function (proxy, existingBinding, targetPath, oneway, sourcePath, converter) {
            var originalTargetPath = existingBinding.targetPath,
                originalOneway = existingBinding.oneway,
                originalSourcePath = existingBinding.sourcePath,
                originalconverter = existingBinding.converter,
                updatedBinding;

            updatedBinding = proxy.updateObjectBinding(existingBinding, targetPath, oneway, sourcePath, converter);

            if (updatedBinding) {
                // if (this._editingController) {
                //     // TODO cancel the binding in the stage
                //     // TODO define the binding on the stage, make sure we can cancel it later
                // }

                this.undoManager.register("Edit Binding", Promise.resolve([
                    this.updateOwnedObjectBinding, this, proxy, updatedBinding, originalTargetPath, originalOneway, originalSourcePath, originalconverter
                ]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerializationObjects();

            // Refresh the stage
            this.editor.refresh();

            return updatedBinding;
        }
    },

    __implicitActionEventListenerTemplate: {
        value: null
    },

    _implicitActionEventListenerTemplate: {
        get: function () {

            if (!this.__implicitActionEventListenerTemplate) {
                var serializationFragment = {
                    "prototype": "montage/core/event/action-event-listener",
                    "_dev": {
                        "isHidden": true
                    }
                };
                this.__implicitActionEventListenerTemplate = this._buildTemplate("actionEventListener", serializationFragment, null);
            }

            return this.__implicitActionEventListenerTemplate;
        }
    },

    /**
     * Registers the specified listener as an observer of the object
     * represented by the proxy for the specified event type in during the
     * specified event distribution phase.
     *
     * Listeners are typically responsible for implementing an event handling
     * method that conforms to the Montage conventions
     * e.g. `handleActionEvent`
     *
     * If the optional `methodName` parameter is specified an `ActionEventListener`
     * object will be implicitly created and registered as the actual listener
     * as recorded in the returned listener registration. The specified listener
     * will be recorded as the AEL's `handler` and the methodName will be recorded
     * as AEL's `action`, i.e. the name of the method to call on the handler.
     *
     * @param {Proxy} proxy The proxy representing the object to listen to
     * @param {string} type The type of event to listen for
     * @param {Proxy} listener The proxy representing an object to handle an event
     * @param {boolean} useCapture Whether or not to listen in the capture phase versus the bubble phase
     * @param {string} methodName The name of the method to call on the listener object when handling an event
     *
     * @return {Promise} A promise for the listener registration with the specified properties
     */
    addOwnedObjectEventListener: {
        value: function (proxy, type, listener, useCapture, methodName) {

            var installListenerPromise,
                deferredUndoOperation = Promise.defer(),
                self = this;

            this.undoManager.openBatch("Add Listener");
            this.undoManager.register("Add Listener", deferredUndoOperation.promise);

            if (methodName) {
                installListenerPromise = this._implicitActionEventListenerTemplate.then(function (template) {
                    return self.addObjectsFromTemplate(template);
                }).then(function (objects) {
                    var actionEventListener = objects[0];
                    actionEventListener.setObjectProperty("handler", listener);
                    actionEventListener.setObjectProperty("action", methodName);
                    return actionEventListener;
                });
            } else {
                installListenerPromise = Promise.resolve(listener);
            }

            return installListenerPromise.then(function (actualListener) {
                var listenerEntry = proxy.addObjectEventListener(type, actualListener, useCapture);

                if (listenerEntry) {
                    // TODO register the listener on the stage, make sure we can remove it later

                    deferredUndoOperation.resolve([self._removeOwnedObjectEventListener, self, proxy, listenerEntry]);
                }

                // TODO this doesn't really do anything to guard against other unrelated sync operations being
                // entered into the same undo block
                self.undoManager.closeBatch();

                self.editor.refresh();

                return listenerEntry;
            });
        }
    },

    /**
     * Updates an existing listener entry with the specified type, listener,
     * and phase information.
     *
     * If an actionEventListener is the listener for the event some parameters will be
     * applied to the AEL's proxy. i.e. `listener` maps to `handler` and `methodName`
     * maps to `action.
     *
     * Additionally, if an AEL was in place previously but the `methodName` has been
     * removed, the AEL will be deleted.
     *
     * If there was no AEL but a `methodName` is specified, an AEL will be implicitly created.
     *
     * @param {Proxy} proxy The proxy representing the object being listened to by the specified listener
     * @param {Object} existingListener The object representing the existing listener registration
     * @param {string} type The type of event to listen for
     * @param {Proxy} explicitListener The proxy representing an object to handle an event
     * @param {boolean} useCapture Whether or not to listen in the capture phase versus the bubble phase
     * @param {string} methodName The name of the method to call on the listener object when handling an event
     *
     * @return {Promise} A promise for the updated listener registration
     */
    updateOwnedObjectEventListener: {
        value: function (proxy, existingListenerEntry, type, explicitListener, useCapture, methodName) {
            var originalType = existingListenerEntry.type,
                originalUseCapture = existingListenerEntry.useCapture,
                originalListener = existingListenerEntry.listener,
                isDirectedHandler = originalListener.properties.has("handler") && originalListener.properties.has("action"),
                originalHandler = isDirectedHandler ? originalListener.properties.get("handler") : null,
                originalMethodName = isDirectedHandler ? originalListener.properties.get("action") : null,
                undoListenerValue = originalListener,
                deferredUndoOperation = Promise.defer(),
                actualListenerPromise,
                self = this;

            //TODO same problem elsewhere regarding the blocks not working well with async code
            this.undoManager.openBatch("Edit Listener");
            this.undoManager.register("Edit Listener", deferredUndoOperation.promise);

            if (isDirectedHandler && methodName) {
                // Keep existing AEL, update as necessary
                actualListenerPromise = this._updateActionEventListener(originalListener, originalHandler, explicitListener, methodName);
                undoListenerValue = originalHandler;
            } else if (isDirectedHandler && !methodName) {
                // Remove existing AEL (Demotion); the methodName was cleared
                actualListenerPromise = this._promoteToActionEventListener(originalListener, explicitListener);
            } else if (!isDirectedHandler && methodName) {
                // The current listener is not an AEL, but we've been given a methodName
                actualListenerPromise = this._demoteFromActionEventListener(originalListener, explicitListener, methodName);
            } else {
                // No AEL involved
                actualListenerPromise = Promise.resolve(explicitListener);
            }

            return actualListenerPromise.then(function (actualListener) {
                self.undoManager.closeBatch();

                var updatedListenerEntry = proxy.updateObjectEventListener(existingListenerEntry, type, actualListener, useCapture);
                deferredUndoOperation.resolve([self.updateOwnedObjectEventListener, self, proxy, updatedListenerEntry, originalType, undoListenerValue, originalUseCapture, originalMethodName]);

                self.editor.refresh();
                return updatedListenerEntry;
            });
        }
    },

    _updateActionEventListener: {
        value: function (originalListener, originalHandler, explicitListener, methodName) {
            if (explicitListener !== originalHandler) {
                originalListener.setObjectProperty("handler", explicitListener);
            }
            originalListener.setObjectProperty("action", methodName);
            return Promise.resolve(originalListener);
        }
    },

    _promoteToActionEventListener: {
        value: function (originalListener, explicitListener) {

            var actualListenerPromise;

            if (this.undoManager.isUndoing || this.undoManager.isRedoing) {
                //No need to manually remove, that will happen when that undoable operation is performed
                actualListenerPromise = Promise.resolve(explicitListener);
            } else {
                actualListenerPromise = this.removeObject(originalListener).thenResolve(explicitListener);
            }

            return actualListenerPromise;
        }
    },

    _demoteFromActionEventListener: {
        value: function (originalListener, explicitListener, methodName) {

            var actualListenerPromise,
                self = this;

            //If the newly specified listener being put in place is itself an AEL, make sure it captures what it needs to
            if (explicitListener.properties.has("handler") && explicitListener.properties.has("action")){
                explicitListener.setObjectProperty("handler", originalListener);
                explicitListener.setObjectProperty("action", methodName);

                actualListenerPromise = Promise.resolve(explicitListener);

            } else if (this.undoManager.isUndoing || this.undoManager.isRedoing) {
                //No need to manually add, that will happen when that undoable operation is performed
                actualListenerPromise = Promise.resolve(explicitListener);
            } else {
                // Otherwise, put a new AEL in place (Promotion)
                actualListenerPromise = this._implicitActionEventListenerTemplate.then(function (template) {
                    return self.addObjectsFromTemplate(template);
                }).then(function (objects) {
                        var actionEventListener = objects[0];
                        actionEventListener.setObjectProperty("handler", explicitListener);
                        actionEventListener.setObjectProperty("action", methodName);
                        return actionEventListener;
                    });
            }

            return actualListenerPromise;
        }
    },

    /**
     * Removes the specified listener registration from the specified object
     *
     * @param {Proxy} proxy The proxy representing the object being listened to by the specified listener
     * @param {Object} listener The object representing the existing listener registration
     *
     * @return {Promise} A promise for the removed listener registration
     */
    removeOwnedObjectEventListener: {
        value: function (proxy, listener) {
            var removedListenerEntry,
                removedIndex,
                removedInfo,
                relatedObjectRemovalPromise,
                self = this;

            removedInfo = proxy.removeObjectEventListener(listener);
            removedListenerEntry = removedInfo.removedListener;
            removedIndex = removedInfo.index;

            if (removedListenerEntry) {
                this.undoManager.openBatch("Remove Listener");

                this.undoManager.register("Remove Listener", Promise.resolve([
                    this._addOwnedObjectEventListener, this, proxy, removedListenerEntry, removedIndex
                ]));

                if (removedListenerEntry.listener.properties.get("handler") && removedListenerEntry.listener.properties.get("action")) {
                    relatedObjectRemovalPromise = this.removeObject(removedListenerEntry.listener);
                }

                this.undoManager.closeBatch();
            }

            return (relatedObjectRemovalPromise || Promise.resolve()).then(function () {
                self.editor.refresh();
                return removedListenerEntry;
            });

        }
    },

    /**
     * @private
     * Adds the specified listener registration object into the specified proxy's
     * listener collection at the specified index.
     *
     * This is intended to be used as part of undoing the removal of a listener
     * so the removed object and its exact position in the collection are preserved.
     *
     * In particular this address the case where further undo operations
     * rely on that exact instance of the listener registration. It also keeps the
     * listener appearing in the same spot where it was just deleted from.
     */
    _addOwnedObjectEventListener: {
        value: function (proxy, listener, insertionIndex) {

            var addedListener = proxy.addEventListener(listener, insertionIndex);

            if (addedListener) {
                this.undoManager.register("Add Listener", Promise.resolve([this._removeOwnedObjectEventListener, this, proxy, listener]));
            }

            this.editor.refresh();
            return addedListener;

        }
    },

    /**
     * @private
     */
    _removeOwnedObjectEventListener: {
        value: function (proxy, listener) {

            var removedInfo = proxy.removeObjectEventListener(listener),
                removedListenerEntry = removedInfo.removedListener,
                removedIndex = removedInfo.index;

            if (removedListenerEntry) {
                this.undoManager.register("Remove Listener", Promise.resolve([this._addOwnedObjectEventListener, this, proxy, listener, removedIndex]));
            }

            this.editor.refresh();
            return removedListenerEntry;

        }
    },

    /**
     * Sets the specified attribute of a nodeProxy to be a specified value
     * @function
     * @param  {NodeProxy}  nodeProxy
     * @param  {string} attribute The attribute to set on the specified node proxy
     * @param  {string} value The value to set for the specified attribute
     * @return {boolean} Whether or not the value specified was applied
     */
    setNodeProxyAttribute: {
        value: function(nodeProxy, attribute, value) {
            var previousValue = nodeProxy.getAttribute(attribute);
            if (value === previousValue) {
                return true;
            }

            //TODO use an exported constant for attribute name; pick a place to store them
            if (attribute === "data-montage-id" && value &&
                this.templateNodes.some(function (node) {
                    return node.montageId === value;
                })) {

                // this data-montage-id already exists
                return false;
            }

            nodeProxy.setAttribute(attribute, value);
            this.undoManager.register("Set Node Attribute", Promise.resolve([this.setNodeProxyAttribute, this, nodeProxy, attribute, previousValue]));

            return true;
        }
    },

    /**
     * Sets the specified attribute of a nodeProxy to be a specified value
     * @function
     * @param  {NodeProxy}  nodeProxy
     * @param  {string} attribute The attribute to set on the specified node proxy
     * @param  {string} value The value to set for the specified attribute
     * @return {boolean} Whether or not the value specified was applied
     */
    setNodeProxyTagName: {
        value: function(nodeProxy, tagName) {
            var previousTagName = nodeProxy.tagName;
            if (tagName === previousTagName) {
                return true;
            }

            nodeProxy.tagName = tagName;
            this.undoManager.register("Set Node Tag Name", Promise.resolve([this.setNodeProxyTagName, this, nodeProxy, previousTagName]));
            this.editor.refresh();

            return true;
        }
    },

    // Override EditingDocument#setOwnedObjectLabel to also change the object's
    // element's montage id if possible
    setOwnedObjectLabel: {
        value: function (proxy, newLabel) {
            var nodeProxy = proxy.properties.get("element");
            // if this object has an element and the element's
            // data-montage-id is the same as a label, and no other element
            // exists with that montage id then change them both
            if (
                nodeProxy &&
                nodeProxy.montageId === proxy.label &&
                !this.nodeProxyForMontageId(newLabel)
            ) {
                this.undoManager.openBatch("Set label and montage id");
                var ok = this.super(proxy, newLabel);
                if (ok) {
                    this.setNodeProxyAttribute(nodeProxy, "data-montage-id", newLabel);
                }
                this.undoManager.closeBatch();
                return ok;
            } else {
                return this.super(proxy, newLabel);
            }
        }
    },

    setOwnedObjectEditorMetadata: {
        value: function (proxy, property, value) {
            var previousValue =  proxy.getEditorMetadata(property);

            if(previousValue === value){
                return;
            }

            proxy.setEditorMetadata(property, value);

            //TODO improve humanization of the undo name
            this.undoManager.register("Set " + property, Promise.resolve([
                this.setOwnedObjectEditorMetadata, this, proxy, property, previousValue
            ]));
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
            this.dispatchEventNamed("domModified", true, false);
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

    createTemplateNodeFromJSONNode: {
        value: function (jsonNode) {
            var element = document.createElement(jsonNode.name);
            jsonNode.attributes.forEach(function (attr) {
                element.setAttribute(attr.name, attr.value);
            });
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
            this.dispatchEventNamed("domModified", true, false);
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
            this.dispatchEventNamed("domModified", true, false);
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
     * Move a nodeProxy to become the previous sibling of a given node
     *
     * @param {NodeProxy} nodeProxy The node to move
     * @param {NodeProxy} nextSiblingProxy The node before wich to move
     * @return {NodeProxy} The node proxy that has been moved
     */
    moveTemplateNodeBeforeNode: {
        value: function (nodeProxy, nextSiblingProxy) {
            var oldNextSibling = nodeProxy.nextSibling;
            nodeProxy.parentNode.removeChild(nodeProxy);
            nextSiblingProxy.parentNode.insertBefore(nodeProxy, nextSiblingProxy);

            if (oldNextSibling) {
                this.undoManager.register("Move Node", Promise.resolve([this.moveTemplateNodeBeforeNode, this, nodeProxy, oldNextSibling]));
            } else {
                this.undoManager.register("Move Node", Promise.resolve([this.moveTemplateNodeChildNode, this, nodeProxy, nodeProxy.parentNode]));
            }
            this.editor.refresh();
            this.dispatchEventNamed("domModified", true, false);
            return nodeProxy;
        }
    },

    /**
     * Move a nodeProxy to be the next sibling of the a given node
     * @param {nodeProxy} nodeProxy The node to move
     * @param {NodeProxy} previousSiblingProxy The node after wich to move
     * @return {NodeProxy} The node proxy that has been moved
     */
    moveTemplateNodeAfterNode: {
        value: function (nodeProxy, previousSiblingProxy) {
            var oldNextSibling = nodeProxy.nextSibling,
                parentNode = nodeProxy.parentNode;
            parentNode.removeChild(nodeProxy);
            previousSiblingProxy.parentNode.insertBefore(nodeProxy, previousSiblingProxy.nextSibling);

            if (oldNextSibling) {
                this.undoManager.register("Move Node", Promise.resolve([this.moveTemplateNodeBeforeNode, this, nodeProxy, oldNextSibling]));
            } else {
                this.undoManager.register("Move Node", Promise.resolve([this.moveTemplateNodeChildNode, this, nodeProxy, parentNode]));
            }

            this.editor.refresh();
            this.dispatchEventNamed("domModified", true, false);
            return nodeProxy;
        }
    },

    /**
     * Move a nodeProxy to be the first child of the a given node
     * @param {nodeProxy} nodeProxy The node to move
     * @param {NodeProxy} previousSiblingProxy The node to become the parent node
     * @return {NodeProxy} The node proxy that has been moved
     */
    moveTemplateNodeChildNode: {
        value: function (nodeProxy, parentNode) {
            var oldParentNode = nodeProxy.parentNode,
                oldNextSibling = nodeProxy.nextSibling;
            oldParentNode.removeChild(nodeProxy);
            parentNode.appendChild(nodeProxy);

            if (oldNextSibling) {
                this.undoManager.register("Move Node", Promise.resolve([this.moveTemplateNodeBeforeNode, this, nodeProxy, oldNextSibling]));
            } else {
                this.undoManager.register("Move Node", Promise.resolve([this.moveTemplateNodeChildNode, this, nodeProxy, parentNode]));
            }

            this.editor.refresh();
            this.dispatchEventNamed("domModified", true, false);
            return nodeProxy;
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
            this.dispatchEventNamed("domModified", true, false);
            return nodeProxy;
        }
    },

    // Owner blueprint

    addOwnerBlueprintProperty: {
        value: function (name, valueType, cardinality, collectionValueType) {
            var self = this;
            return this.undoManager.register(
                "Add owner property",
                this._ownerBlueprint.then(function (blueprint) {
                    var propertyBlueprint = new PropertyBlueprint().initWithNameBlueprintAndCardinality(
                        name,
                        blueprint,
                        cardinality || 1
                    );
                    if (valueType) {
                        propertyBlueprint.valueType = valueType;
                    }
                    if (collectionValueType) {
                        propertyBlueprint.collectionValueType = collectionValueType;
                    }

                    blueprint.addPropertyBlueprint(propertyBlueprint);
                    blueprint.addPropertyBlueprintToGroupNamed(propertyBlueprint, self._exportName);
                    return [self.removeOwnerBlueprintProperty, self, name];
                })
            );
        }
    },

    modifyOwnerBlueprintProperty: {
        value: function (name, property, value) {
            var self = this;
            // get the owner blueprint first so that we can bail if the new
            // and previous value are the same
            return this._ownerBlueprint.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName(name);
                var previousValue = propertyBlueprint[property];
                if (value === previousValue) {
                    return Promise();
                }
                propertyBlueprint[property] = value;
                return self.undoManager.register(
                    "Modify owner property",
                    Promise.resolve([self.modifyOwnerBlueprintProperty, self, name, property, previousValue])
                );
            });
        }
    },

    removeOwnerBlueprintProperty: {
        value: function (name) {
            var self = this;
            return self.undoManager.register(
                "Remove owner property",
                this._ownerBlueprint.then(function (blueprint) {
                    var propertyBlueprint = blueprint.propertyBlueprintForName(name);
                    blueprint.removePropertyBlueprint(propertyBlueprint);
                    blueprint.removePropertyBlueprintFromGroupNamed(propertyBlueprint, self._exportName);
                    return [self.addOwnerBlueprintProperty, self, name, propertyBlueprint.valueType, propertyBlueprint.cardinality, propertyBlueprint.collectionValueType];
                })
            );
        }
    },

    addOwnerBlueprintEvent: {
        value: function (name) {
            var self = this;
            return this.undoManager.register(
                "Add owner event",
                this._ownerBlueprint.then(function (blueprint) {
                    var eventBlueprint = new EventBlueprint().initWithNameAndBlueprint(
                        name,
                        blueprint
                    );

                    blueprint.addEventBlueprint(eventBlueprint);
                    return [self.removeOwnerBlueprintEvent, self, name];
                })
            );
        }
    },

    removeOwnerBlueprintEvent: {
        value: function (name) {
            var self = this;
            return self.undoManager.register(
                "Remove owner event",
                this._ownerBlueprint.then(function (blueprint) {
                    var eventBlueprint = blueprint.eventBlueprintForName(name);
                    blueprint.removeEventBlueprint(eventBlueprint);
                    return [self.addOwnerBlueprintEvent, self, name];
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
