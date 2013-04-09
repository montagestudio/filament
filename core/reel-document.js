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
    ReelContext = require("core/serialization/reel-context").ReelContext;

// The ReelDocument is used for editing Montage Reels
exports.ReelDocument = Montage.create(EditingDocument, {

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this,
                objectName = MontageReviver.parseObjectLocationId(fileUrl).objectName;

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return packageRequire.async(fileUrl).get(objectName).then(function (componentPrototype) {
                    return Template.getTemplateWithModuleId(componentPrototype.templateModuleId, packageRequire);
                }).then(function (template) {
                        return self.create().init(fileUrl, template, packageRequire);
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

            //TODO handle external serializations
            var serialization = JSON.parse(template.getInlineObjectsString(template.document));
            var context = this.deserializationContext(serialization);

            //TODO make a real map
            self._editingProxyMap = {};
            self._addProxies(context.getObjects());

            return self;
        }
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

    _createElementFromMarkup: {
        value: function (markup, id) {
            //TODO not create an element each time
            var incubator = this.htmlDocument.createElement('div'),
                result;

            incubator.innerHTML = markup;
            result = incubator.removeChild(incubator.firstElementChild);
            result.setAttribute("data-montage-id", id);

            return result;
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

            //TODO not blindly append to the end of the body
            //TODO react to changing the element?
            if (proxy.element && !proxy.element.parentNode) {
                var parentProxy = proxy.parentProxy;
                if (parentProxy && parentProxy.element) {
                    parentProxy.element.appendChild(proxy.element);
                } else {
                    this._ownerElement.appendChild(proxy.element);
                }
            }
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

    associateWithLiveRepresentations: {
        value: function (owner, template, frame) {
            var labels = Object.keys(owner.templateObjects),
                self = this,
                proxy,
                serialization = template.getSerialization().getSerializationObject();

            var editController = this._editingController = EditingController.create();
            editController.frame = frame;
            editController.owner = owner;

            var ownerProxy = this.editingProxyForObject(owner);

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
                    proxy.parentProxy = this.editingProxyForObject(stageObject[0].parentComponent);
                } else {
                    proxy.stageObject = stageObject;
                    proxy.parentProxy = this.editingProxyForObject(stageObject.parentComponent) || ownerProxy;
                }
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
                    if (component.ownerComponent !== ownerComponent) {
                        // We've hit a component that isn't in the edited reel,
                        // so stop going up and use the last selection
                        // candidate.
                        break;
                    }
                    selectionCandidate = component;
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

    /**
     * The method is a temporary anomaly that accepts what our library items currently are
     * and builds a template for merging
     *
     * This will be replaced with an addTemplate or insertTemplate or mergeTemplate
     */
    addFragment: {
        value: function (serializationFragment, htmlFragment) {

            // Right now a LibraryItem only represents a single object or component
            // TODO account for a LibraryItem Template consisting of several objects and components
            var labelInOwner = this._generateLabel(serializationFragment),
                templateSerialization = {},
                self = this;

            templateSerialization [labelInOwner] = serializationFragment;

            var doc = document.implementation.createHTMLDocument();
            var serializationElement = doc.createElement("script");
            serializationElement.setAttribute("type", "text/montage-serialization");
            serializationElement.appendChild(document.createTextNode(JSON.stringify(templateSerialization)));
            doc.head.appendChild(serializationElement);
            doc.body.innerHTML = htmlFragment;

            //TODO this seems a bit like undoing the work we just did
            return Template.create().initWithDocument(doc, this._packageRequire).then(function(template) {
                self._buildSerialization();

                var serializationToMerge = template.getSerialization(),
                    elementToAppend = template.document.body.children[0],
                    labelsCollisionTable,
                    context,
                    proxy,
                    proxyElement,
                    actualLabel;

                // Merge the incoming template into the reelDocument's own template
                labelsCollisionTable = self._merge(self._template, serializationToMerge, elementToAppend);

                // Prepare a context that knows about the existing editing proxies prior to
                // creating new editing proxies
                context = self.deserializationContext(self._template.getSerialization().getSerializationObject(), self._editingProxyMap);

                serializationToMerge.getSerializationLabels().forEach(function (label) {

                    if (labelsCollisionTable && labelsCollisionTable.hasOwnProperty(label)) {
                        actualLabel = labelsCollisionTable[label];
                    } else {
                        actualLabel = label;
                    }

                    proxy = context.getObject(actualLabel);
                    self._addProxies(proxy);
                    proxyElement = proxy.getObjectProperty("element");

                    //TODO formalize this API
                    //TODO why _template?
                    self._editingController.owner._template.objectsString = self._template.objectsString;
                    self._editingController.owner._template.setDocument(self._template.document);

                    //TODO once we insert several labels per libraryItem, we need to know the markup for each inserted object
                    self._editingController.addComponent(label, serializationFragment, proxyElement.outerHTML, proxyElement ? proxyElement.getAttribute("data-montage-id") : null)
                        .then(function (newComponents) {

                            for (var label in newComponents) {
                                // NOTE the objects is a null-prototyped object that does not need
                                // to be filtered with a hasOwnProperty
                                self._editingProxyMap[label].stageObject = newComponents[label];
                            }
                        }).done();

                });

            });
        }
    },

    _merge: {
        value: function(template, serialization, element) {
            var templateSerialization = template.getSerialization(),
                labelsCollisionTable,
                idsCollisionTable;

            // Merge markup
            idsCollisionTable = template.insertNodeBefore(element, this._ownerElement.lastChild);
            serialization.renameElementReferences(idsCollisionTable);

            // Merge serialization
            labelsCollisionTable = templateSerialization.mergeSerialization(serialization);

            //Update underlying template string
            template.objectsString = templateSerialization.getSerializationString();

            return labelsCollisionTable;
        }
    },

    /**
     * Remove the specified proxy from the editing model object graph
     * @param {Proxy} proxy An editing proxy to remove from the editing model
     * @return {Promise} A promise for the removal of the proxy
     */
    removeObject: {
        value: function (proxy) {

            var self = this,
                removalPromise,
                deferredUndo = Promise.defer();

            this.undoManager.register("Remove", deferredUndo.promise);

            if (this._editingController) {
                removalPromise = this._editingController.removeObject(proxy.stageObject);
            } else {
                removalPromise = Promise.resolve(proxy);
            }

            return removalPromise.then(function (removedProxy) {
                self._removeProxies(removedProxy);
                // TODO build a template and schedule calling addTemplate/etc.
                // deferredUndo.resolve([self.addObject, self, removedProxy.label, self.serializationForProxy(removedProxy)]);
                return removedProxy;
            });
        }
    },

    deleteSelected: {
        value: function () {
            var selectedObject = this.getPath("selectedObjects.0");
            //TODO minimize different handling of objects and components
            if (selectedObject.markup) {
                return this.removeComponent(selectedObject);
            } else {
                return this.removeObject(selectedObject);
            }

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

            //TODO maybe the proxy shouldn't be involved in doing this as we hand out the proxies
            // throughout the editingEnvironment, I don't want to expose accessible editing APIs
            // that do not go through the editingDocument...or do I?

            // Might be nice to have an editing API that avoids undoability and event dispatching?
            proxy.setObjectProperty(property, value);

            this._buildSerialization();

//            this.dispatchEventNamed("didSetObjectProperty", true, true, {
//                object: proxy,
//                property: property,
//                value: value,
//                undone: undoManager.isUndoing,
//                redone: undoManager.isRedoing
//            });

            undoManager.register("Set Property", Promise.resolve([this.setOwnedObjectProperty, this, proxy, property, undoneValue]));

        }
    },

    defineObjectBinding: {
        value: function (sourceObject, sourceObjectPropertyPath, boundObject, boundObjectPropertyPath, oneWay, converter) {
            // TODO locaize
            this.undoManager.register("Define Binding", Promise.resolve([this.deleteBinding, this, sourceObject, sourceObjectPropertyPath]));

            //Similar concerns above, where does this API belong?
            sourceObject.defineObjectBinding(sourceObjectPropertyPath, boundObject, boundObjectPropertyPath, oneWay, converter);

            this._buildSerialization();

//            this.dispatchEventNamed("didDefineBinding", true, true, {
//                sourceObject: sourceObject,
//                sourceObjectPropertyPath: sourceObjectPropertyPath,
//                boundObject: boundObject,
//                boundObjectPropertyPath: boundObjectPropertyPath,
//                oneWay: oneWay,
//                converter: converter
//            });

        }
    },

    cancelObjectBinding: {
        value: function (sourceObject, sourceObjectPropertyPath) {
            var binding = sourceObject.bindings ? sourceObject.bindings[sourceObjectPropertyPath] : null,
                bindingString,
                converterEntry,
                boundObjectLabel,
                boundObject,
                boundObjectPropertyPath,
                oneWay,
                converter;

            if (!binding) {
                throw new Error("Cannot remove binding that does not exist");
            }

            //TODO what if we can't find an object with the label?
            //TODO rely on a deserializer from the package to help us decode this string
            oneWay = !!binding["<-"];
            bindingString = oneWay ? binding["<-"] : binding["<->"];
            bindingString.match(/^@([^\.]+)\.?(.*)$/);

            boundObjectLabel = RegExp.$1;
            boundObjectPropertyPath = RegExp.$2;

            //TODO what if boundObjectLabel and boundObjectPropertyPath are malformed?

            boundObject = this.editingProxyMap[boundObjectLabel];

            converterEntry = binding.converter;
            if (converterEntry) {
                converter = this.editingProxyMap[converterEntry["@"]];
            }

            // TODO localize
            this.undoManager.register("Delete Binding", Promise.resolve([this.defineBinding, this, sourceObject, sourceObjectPropertyPath, boundObject, boundObjectPropertyPath, oneWay, converter]));

            sourceObject.cancelObjectBinding(sourceObjectPropertyPath);

            this._buildSerialization();

//            this.dispatchEventNamed("didDeleteBinding", true, true, {
//                sourceObject: sourceObject,
//                sourceObjectPropertyPath: sourceObjectPropertyPath,
//                boundObject: boundObject,
//                boundObjectPropertyPath: boundObjectPropertyPath
//            });
        }
    }

});
