var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    EditingController = require("palette/core/controller/editing-controller").EditingController,
    Template = require("montage/core/template").Template,
    Promise = require("montage/core/promise").Promise,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    ReelProxy = require("core/reel-proxy").ReelProxy,
    SORTERS = require("palette/core/sorters"),
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor,
    ReelSerializer = require("core/serialization/reel-serializer").ReelSerializer,
    ReelVisitor = require("core/serialization/reel-visitor").ReelVisitor,
    ReelReviver = require("core/serialization/reel-reviver").ReelReviver,
    ReelContext = require("core/serialization/reel-context").ReelContext,
    NodeProxy = require("core/node-proxy").NodeProxy;

// The ReelDocument is used for editing Montage Reels
exports.ReelDocument = Montage.create(EditingDocument, {

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this,
                objectName = MontageReviver.parseObjectLocationId(fileUrl).objectName;

            // require.async() expect moduleId not URLs
            var componentModuleId = fileUrl;
            if (fileUrl.indexOf(packageUrl) > -1) {
                componentModuleId = fileUrl.substring(packageUrl.length + 1);
            }

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return packageRequire.async(componentModuleId).get(objectName).then(function (componentPrototype) {
                    return Template.getTemplateWithModuleId(componentPrototype.templateModuleId, packageRequire);
                }, function (error) {
                    return Promise.reject(new Error("Cannot load component template.", error));
                }).then(function (template) {
                        return self.create().init(fileUrl, template, packageRequire);
                    }, function (error) {
                        return Promise.reject(new Error("cannot initialize document for template.", error));
                    });
            });
        }
    },

    editorType: {
        get: function () {
            return ComponentEditor;
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
        value: function (fileUrl, template, packageRequire) {
            var self = EditingDocument.init.call(this, fileUrl, packageRequire);

            self._template = template;
            self.selectedObjects = [];
            self._editingProxyMap = {};
            self.errors = [];

            self._templateBodyNode = NodeProxy.create().init(this.htmlDocument.body, this);
            self.templateNodes = this._children(self._templateBodyNode);

            //TODO handle external serializations
            try {
                var serialization = JSON.parse(template.getInlineObjectsString(template.document));
                var context = this.deserializationContext(serialization);
                self._addProxies(context.getObjects());
            } catch (e) {

                var error = {
                    file: self.fileUrl,
                    error: {
                        id: "serializationError",
                        reason: e.message
                    }
                };

                self.errors.push(error);
            }

            return self;
        }
    },

    //TODO this will probably be actually discovered at the project level, maybe stored here? or is this just an accessor?
    errors: {
        value: null
    },

    deserializationContext: {
        value: function (serialization, objects) {
            var reviver = ReelReviver.create();
            var context = ReelContext.create().init(serialization, reviver, objects);
            context.editingDocument = this;
            return context;
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

    canUndo: {
        get: function () {
            return this.getPath("undoManager.undoCount > 0");
        }
    },

    canRedo: {
        get: function () {
            return this.getPath("undoManager.redoCount > 0");
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
            } else  {
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

    _buildSerialization: {
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

    serializationForProxy: {
        value: function (proxy) {
            var serializer = ReelSerializer.create().initWithRequire(this._packageRequire);
            var serialization = JSON.parse(serializer.serializeObject(proxy))[proxy.label];

            return SORTERS.unitSorter(serialization);
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

    save: {
        value: function (location, dataWriter) {
            //TODO I think I've made this regex many times...and probably differently
            var filenameMatch = location.match(/.+\/(.+)\.reel/),
                path,
                template = this._template,
                doc = this._template.document,
                serializationElement;

            if (!(filenameMatch && filenameMatch[1])) {
                throw new Error('Components can only be saved into ".reel" directories');
            }

            path = location + "/" + filenameMatch[1] + ".html";

            this._buildSerialization();

            return dataWriter(template.html, path);
        }
    },

    _editingController: {
        value: null
    },

    // Editing Model

    _addProxies: {
        value: function (proxies) {
            var self = this;

            this.dispatchBeforeOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchBeforeOwnPropertyChange("editingProxies", this.editingProxies);

            if (Array.isArray(proxies)) {
                proxies.forEach(function (proxy) {
                    self.__addProxy(proxy);
                });
            } else {
                self.__addProxy(proxies);
            }

            this.dispatchOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchOwnPropertyChange("editingProxies", this.editingProxies);

            self._buildSerialization();
        }
    },

    __addProxy: {
        value: function (proxy) {
            var proxyMap = this._editingProxyMap;

            proxyMap[proxy.label] = proxy;

            //TODO not simply stick this on the object; the inspector needs it right now
            proxy.packageRequire = this._packageRequire;
        }
    },

    _removeProxies: {
        value: function (proxies) {
            var self = this;

            this.dispatchBeforeOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchBeforeOwnPropertyChange("editingProxies", this.editingProxies);

            if (Array.isArray(proxies)) {
                proxies.forEach(function (proxy) {
                    self.__removeProxy(proxy);
                });
            } else {
                self.__removeProxy(proxies);
            }

            this.dispatchOwnPropertyChange("editingProxyMap", this.editingProxyMap);
            this.dispatchOwnPropertyChange("editingProxies", this.editingProxies);

            self._buildSerialization();
        }
    },

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

    associateWithLiveRepresentations: {
        value: function (owner, template, frame) {
            var labels = Object.keys(owner.templateObjects),
                self = this,
                proxy,
                serialization = template.getSerialization().getSerializationObject();

            var editController = this._editingController = EditingController.create();
            editController.frame = frame;
            editController.owner = owner;

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

                // Loop up parents until we find one which is in this reel, or
                // we hit the owner. Use as parent.
                var parent = stageObject;
                while ((parent = parent.parentComponent) !== owner && parent) {
                    if (parent.ownerComponent === owner) {
                        break;
                    }
                }

                // Object did not have parentComponent (i.e. was a plain
                // object, not a component)
                if (!parent) parent = owner;
                proxy.parentProxy =  this.editingProxyForObject(parent);
            }, this);
        }
    },

    _editingProxyMap: {
        value: null
    },

    editingProxyMap: {
        get: function () {
            return this._editingProxyMap;
        }
    },

    editingProxies: {
        get: function () {
            //TODO cache this
            var proxyMap = this._editingProxyMap,
                labels = Object.keys(proxyMap);

            return labels.map(function (label) {
                return proxyMap[label];
            });
        }
    },

    editingProxyForObject: {
        value: function (object) {
            var label = Montage.getInfoForObject(object).label,
                proxy = this._editingProxyMap[label];

            // label is undefined for the owner component
            if (label && !proxy) {
                throw new Error("No editing proxy found for object with label '" + label + "'");
            }

            return proxy;
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

    selectObjectsOnAddition: {
        value: true
    },

    selectedObjects: {
        value: null
    },

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
                selectedElements.indexOf(currentElement) === -1  &&
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

    // Selects nothing
    clearSelectedObjects: {
        value: function () {
            this.selectedObjects.clear();
        }
    },

    // Remove object from current set of selectedObjects
    deselectObject: {
        value: function (object) {
            var index = this.selectedObjects.indexOf(object);
            if (index >= 0) {
                this.selectedObjects.splice(index, 1);
            }
        }
    },

    // Add object to current set of selectedObjects
    selectObject: {
        value: function (object) {
            var selectedObjects = this.selectedObjects;

            if (selectedObjects.indexOf(object) === -1) {
                //TODO what is the order ofthe selectedObjects?
                selectedObjects.push(object);
            }
            //TODO otherwise, do we remove it here?

        }
    },

    // Editing API

    _generateLabel: {
        value: function (serialization) {
            var name = MontageReviver.parseObjectLocationId(serialization.prototype).objectName,
                label = name.substring(0, 1).toLowerCase() + name.substring(1),
                labelRegex = new RegExp("^" + label + "(\\d+)$", "i"),
                match,
                lastUsedIndex;

            lastUsedIndex = Object.keys(this.editingProxyMap).map(function (existingLabel) {
                match = existingLabel.match(labelRegex);
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
                });

            lastUsedIndex = lastUsedIndex || 0;

            return label + (lastUsedIndex + 1);
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
     * The method is a temporary anomaly that accepts what our library items currently are
     * and builds a template for merging
     *
     * This will be replaced with an addTemplate or insertTemplate or mergeTemplate
     */
    addLibraryItemFragments: {
        value: function (serializationFragment, htmlFragment, parentProxy, stageElement) {
            var labelInOwner = this._generateLabel(serializationFragment),
                templateSerialization = {},
                self = this,
                doc,
                serializationElement;

            templateSerialization [labelInOwner] = serializationFragment;

            doc = document.implementation.createHTMLDocument();
            serializationElement = doc.createElement("script");
            serializationElement.setAttribute("type", "text/montage-serialization");
            serializationElement.appendChild(document.createTextNode(JSON.stringify(templateSerialization)));
            doc.head.appendChild(serializationElement);
            doc.body.innerHTML = htmlFragment;

            return Template.create().initWithDocument(doc, this._packageRequire).then(function(template) {
                return self.addObjectsFromTemplate(template, parentProxy, stageElement);
            })
            .then(function (objects) {
                // only if there's only one object?
                if (objects.length && self.selectObjectsOnAddition) {
                    self.clearSelectedObjects();
                    self.selectObject(objects[0]);
                }
            });
        }
    },

    DEMOinsertLibraryItem: {
        value: function (serializationFragment, templateElement, stageElement) {
            var labelInOwner = this._generateLabel(serializationFragment),
                templateSerialization = {},
                self = this,
                doc,
                serializationElement;

            templateSerialization[labelInOwner] = serializationFragment;

            doc = document.implementation.createHTMLDocument();
            serializationElement = doc.createElement("script");
            serializationElement.setAttribute("type", "text/montage-serialization");
            serializationElement.appendChild(document.createTextNode(JSON.stringify(templateSerialization)));
            doc.head.appendChild(serializationElement);

            return Template.create().initWithDocument(doc, this._packageRequire).then(function(template) {
                return self.DEMOinsertObjectsFromTemplate(template, templateElement, stageElement);
            });
        }
    },

    DEMOinsertObjectsFromTemplate: {
        value: function (sourceTemplate, templateElement, stageElement) {
            // Ensure backing template is up to date
            this._buildSerialization();

            var destinationTemplate = this._template,
                context,
                proxy,
                addedProxies = [],
                self = this,
                revisedTemplate,
                ownerProxy;

            revisedTemplate = this.DEMOmerge(destinationTemplate, sourceTemplate, templateElement);
            ownerProxy = this.editingProxyMap.owner;

            // Prepare a context that knows about the existing editing proxies prior to
            // creating new editing proxies
            context = this.deserializationContext(destinationTemplate.getSerialization().getSerializationObject(), this._editingProxyMap);

            revisedTemplate.getSerialization().getSerializationLabels().forEach(function (label) {
                proxy = context.getObject(label);
                proxy.parentProxy = ownerProxy;
                self._addProxies(proxy);
                addedProxies.push(proxy);
            });

            // Introduce the revised template into the stage
            if (this._editingController) {

                //TODO not sneak this in through the editingController
                // Make the owner component in the stage look like we expect before trying to install objects
                this._editingController.owner._template.objectsString = destinationTemplate.objectsString;
                this._editingController.owner._template.setDocument(destinationTemplate.document);

                return self._editingController.addObjectsFromTemplate(revisedTemplate, stageElement).then(function (objects) {
                    for (var label in objects) {
                        if (objects.hasOwnProperty !== "function" || objects.hasOwnProperty(label)) {
                            self._editingProxyMap[label].stageObject = objects[label];
                        }
                    }

                    return addedProxies;
                });
            } else {
                return Promise.resolve(addedProxies);
            }
        }
    },

    DEMOmerge: {
        value: function(destinationTemplate, sourceTemplate, templateElement) {
            var serializationToMerge = sourceTemplate.getSerialization(),
                sourceContentRange,
                sourceContentFragment,
                sourceDocument = sourceTemplate.document,
                templateSerialization = destinationTemplate.getSerialization(),
                labelsCollisionTable,
                idsCollisionTable;

            sourceContentRange = sourceDocument.createRange();
            sourceContentRange.selectNodeContents(sourceDocument.body);
            sourceContentFragment = sourceContentRange.cloneContents();

            //Replace element reference with node we're using
            var serializationObject = serializationToMerge.getSerializationObject();
            var objectLabels = Object.keys(serializationObject);
            var propertiesEntry = serializationObject[objectLabels[0]].properties;
            var elementEntry = propertiesEntry ? propertiesEntry.element : null;

            if (elementEntry) {
                elementEntry["#"] = templateElement.getAttribute("data-montage-id");
            }

            // Merge serialization
            labelsCollisionTable = templateSerialization.mergeSerialization(serializationToMerge);

            //Update underlying template string
            destinationTemplate.objectsString = templateSerialization.getSerializationString();

            // Revise the sourceSerialization
            var revisedTemplate = sourceTemplate.clone(),
                revisedSerialization = revisedTemplate.getSerialization();

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

    /**
     * Merges content from the specified template into the Template being edited
     *
     * @param {Template} template A Montage template
     */
    addObjectsFromTemplate: {
        value: function (sourceTemplate, parentProxy, stageElement) {
            // Ensure backing template is up to date
            this._buildSerialization();

            var destinationTemplate = this._template,
                context,
                proxy,
                addedProxies = [],
                self = this,
                templateElement = (parentProxy) ? parentProxy.getObjectProperty("element")._templateNode : void 0,
                revisedTemplate,
                ownerProxy;

            revisedTemplate = this._merge(destinationTemplate, sourceTemplate, templateElement);
            ownerProxy = this.editingProxyMap.owner;

            // Prepare a context that knows about the existing editing proxies prior to
            // creating new editing proxies
            context = this.deserializationContext(destinationTemplate.getSerialization().getSerializationObject(), this._editingProxyMap);

            revisedTemplate.getSerialization().getSerializationLabels().forEach(function (label) {
                proxy = context.getObject(label);
                proxy.parentProxy = parentProxy || ownerProxy;
                self._addProxies(proxy);
                addedProxies.push(proxy);
            });

            // Introduce the revised template into the stage
            if (this._editingController) {

                //TODO not sneak this in through the editingController
                // Make the owner component in the stage look like we expect before trying to install objects
                this._editingController.owner._template.objectsString = destinationTemplate.objectsString;
                this._editingController.owner._template.setDocument(destinationTemplate.document);

                return self._editingController.addObjectsFromTemplate(revisedTemplate, stageElement).then(function (objects) {
                    for (var label in objects) {
                        if (objects.hasOwnProperty !== "function" || objects.hasOwnProperty(label)) {
                            self._editingProxyMap[label].stageObject = objects[label];
                        }
                    }

                    return addedProxies;
                });
            } else {
                return Promise.resolve(addedProxies);
            }
        }
    },

    /**
     * Merges the content from the sourceTemplate into the destinationTemplate while resolving
     * collisions between element identifiers and labels that already appear within the
     * destinationTemplate.
     *
     * @param {Template} destinationTemplate The template to merge the sourceTemplate content into
     * @param {Template} sourceTemplate The template to merge into the destination template
     *
     * @returns {Template} The revised template that was logically used to introduce the sourceTemplate into the destinationTemplate
     * @private
     */
    _merge: {
        value: function(destinationTemplate, sourceTemplate, templateElement) {
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
                insertionParent = templateElement || this._ownerElement;

            sourceContentRange = sourceDocument.createRange();
            sourceContentRange.selectNodeContents(sourceDocument.body);
            sourceContentFragment = sourceContentRange.cloneContents();

            newChildNodes = [];
            for (i = 0; (iChild = sourceContentFragment.childNodes[i]); i++) {
                newChildNodes.push(iChild);
            }

            // Merge markup
            idsCollisionTable = destinationTemplate.appendNode(sourceContentFragment, insertionParent._templateNode);
            if (idsCollisionTable) {
                serializationToMerge.renameElementReferences(idsCollisionTable);
            }

            // Add nodeProxies for newly added nodes
            newChildNodes.forEach(function (newChild) {
                var nodeProxy = NodeProxy.create().init(newChild, this);
                insertionParent.appendChild(nodeProxy); // Add as child to parent
                this.__addNodeProxy(nodeProxy); // Add to general collection of known proxies (temporarily)
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

            this.undoManager.register("Remove", deferredUndo.promise);

            if (this._editingController) {
                removalPromise = this._editingController.removeObject(proxy.stageObject);
            } else {
                removalPromise = Promise.resolve(proxy);
            }

            return removalPromise.then(function () {
                self._removeProxies(proxy);

                self._templateForProxy(proxy).then(function (restorationTemplate) {

                    // For now, with no option to remove the DOM node, we leave them behind;
                    // the restoration template should assume that its original element is
                    // still in place in the template DOM. We clear out the body of the
                    // restoration template to not reintrouce the component's element.
                    body = restorationTemplate.document.getElementsByTagName("body")[0];
                    bodyRange = restorationTemplate.document.createRange();
                    bodyRange.selectNodeContents(body);
                    bodyRange.deleteContents();

                    deferredUndo.resolve([self.addObjectsFromTemplate, self, restorationTemplate]);
                }).done();

                self.dispatchEventNamed("objectRemoved", true, false, { proxy: proxy });

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

    setOwnedObjectProperty: {
        value: function (proxy, property, value) {
            var undoManager = this.undoManager,
                undoneValue = proxy.getObjectProperty(property);

            if (value === undoneValue) {
                // The values are identical no need to do anything.
                return;
            }

            proxy.setObjectProperty(property, value);

            if (this._editingController) {

                //TODO clean this up, the editingController should probably be involved
                if (proxy.stageObject) {
                    if (proxy.stageObject.setPath) {
                        proxy.stageObject.setPath(property, value);
                    } else if (this.stageObject.setProperty) {
                        proxy.stageObject.setProperty(property, value);
                    }
                }
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerialization();

            undoManager.register("Set Property", Promise.resolve([this.setOwnedObjectProperty, this, proxy, property, undoneValue]));

        }
    },

    defineOwnedObjectBinding: {
        value: function (proxy, targetPath, oneway, sourcePath) {
            var binding = proxy.defineObjectBinding(targetPath, oneway, sourcePath);

            if (binding) {
                if (this._editingController) {
                    // TODO define the binding on the stage, make sure we can cancel it later
                }

                this.undoManager.register("Define Binding", Promise.resolve([this.cancelOwnedObjectBinding, this, proxy, binding]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerialization();

            return binding;
        }
    },

    cancelOwnedObjectBinding: {
        value: function (proxy, binding) {
            var removedBinding = proxy.cancelObjectBinding(binding);

            if (removedBinding) {
                if (this._editingController) {
                    // TODO cancel the binding in the stage
                }

                this.undoManager.register("Cancel Binding", Promise.resolve([
                    this.defineOwnedObjectBinding, this, proxy, binding.targetPath, binding.oneway, binding.sourcePath
                ]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerialization();

            return removedBinding;
        }
    },

    updateOwnedObjectBinding: {
        value: function (proxy, existingBinding, targetPath, oneway, sourcePath) {
            var removedBinding = proxy.cancelObjectBinding(existingBinding);
            var binding = proxy.defineObjectBinding(targetPath, oneway, sourcePath);

            if (removedBinding && binding) {
                if (this._editingController) {
                    // TODO cancel the binding in the stage
                    // TODO define the binding on the stage, make sure we can cancel it later
                }

                this.undoManager.register("Cancel Binding", Promise.resolve([
                    this.updateOwnedObjectBinding, this, proxy, binding, removedBinding.targetPath, removedBinding.oneway, removedBinding.sourcePath
                ]));
            }

            // Need to rebuild the serialization here so that the template
            // updates, ready for the inner template inspector
            this._buildSerialization();

            return removedBinding;
        }
    },

    addOwnedObjectEventListener: {
        value: function (proxy, type, listener, useCapture) {
            var listenerEntry = proxy.addObjectEventListener(type, listener, useCapture);

            if (listenerEntry) {
                if (this._editingController) {
                    // TODO register the listener on the stage, make sure we can remove it later
                }

                this.undoManager.register("Add Listener", Promise.resolve([this.removeOwnedObjectEventListener, this, proxy, listenerEntry]));
            }

            return listenerEntry;
        }
    },

    removeOwnedObjectEventListener: {
        value: function (proxy, listener) {
            var removedListener = proxy.removeObjectEventListener(listener);

            if (removedListener) {
                if (this._editingController) {
                    // TODO remove the listener on the stage
                }

                this.undoManager.register("Remove Listener", Promise.resolve([
                    this.addOwnedObjectEventListener, this, proxy, removedListener.type, removedListener.listener, removedListener.useCapture
                ]));
            }

            return removedListener;
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

            //Remove from template DOM
            var node = nodeProxy._templateNode;
            node.parentElement.removeChild(node);

            //Remove from Editing Model
            var index = this.templateNodes.indexOf(nodeProxy);
            if (index >= 0) {
                this.templateNodes.splice(index, 1);
            }

            nodeProxy.parentNode.removeChild(nodeProxy);

            //Remove children from EditingModel (temporary until this happens automatically)
            nodeProxy.children.forEach(function (childProxy) {
                index = this.templateNodes.indexOf(childProxy);
                if (index >= 0) {
                    this.templateNodes.splice(index, 1);
                }
            }, this);

            return nodeProxy;
        }
    },

    /**
     * Create a node proxy for a new element of the specified tagName.
     * This node proxy is not part of the template until it is explicitly
     * added to the template through one of the available methods.
     *
     * @see appendChildToTemplateNode
     *
     * @param {String} tagName The tagName of the element this nodeProxy will represent
     * @return {NodeProxy} A proxy for the newly created element.
     */
    createTemplateNode: {
        value: function (tagName) {
            var element = this.htmlDocument.createElement(tagName);
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
            return nodeProxy;
        }
    }

});
