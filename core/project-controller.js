var Montage = require("montage/core/core").Montage,
    DocumentController = require("core/document-controller").DocumentController,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application,
    LibraryItem = require("filament-extension/core/library-item.js").LibraryItem,
    Deserializer = require("montage/core/serialization").Deserializer,
    findObjectNameRegExp = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver._findObjectNameRegExp,
    RangeController = require("montage/core/range-controller").RangeController,
    WeakMap = require("montage/collections/weak-map"),
    Map = require("montage/collections/map"),
    ProjectController;

exports.ProjectController = ProjectController = Montage.create(DocumentController, {

    // PROPERTIES

    _environmentBridge: {
        value: null
    },

    /**
     * The environment bridge providing services for the projectController
     */
    environmentBridge: {
        get: function () {
            return this._environmentBridge;
        }
    },

    _viewController: {
        value: null
    },

    _projectUrl: {
        value: null
    },

    /**
     * The url of the project this projectController is meant to open
     */
    projectUrl: {
        get: function () {
            return this._projectUrl;
        }
    },

    /**
     * The url of the package of the open project
     */
    packageUrl: {
        value: null
    },

    /**
     * The package description of the open project
     */
    packageDescription: {
        value: null
    },

    /**
     * The controller managing the collection of openDocuments
     */
    openDocumentsController: {
        value: null
    },

    // The flat list of files to present in the package explorer
    files: {
        value: null
    },

    // The collection of dependencies for this package
    dependencies: {
        value: null
    },

    // The groups of library items available to this package
    libraryGroups: {
        value: null
    },

    _editorTypeInstanceMap: {
        value: null
    },

    _editorController: {
        value: null
    },

    // INITIALIZATION

    /**
     * Initialize a ProjectController
     *
     * @param {EnvironmentBridge} bridge An environment bridge that normalizes different environment features
     * @param {Object} viewController A controller that manages registration of views that can appear through filament
     * @param {Object} editorController A controller that manages the visible editor stack
     * @return {ProjectController} An initialized instance of a ProjectController
     */
    init: {
        value: function (bridge, viewController, editorController) {
            bridge.setDocumentDirtyState(false);

            var self = this;

            this._environmentBridge = bridge;
            this._viewController = viewController;
            this._editorController = editorController;
            this.moduleLibraryItemMap = new Map();
            this._packageNameLibraryItemsMap = new Map();

            this._documentTypeUrlMatchers = [];
            this._urlMatcherDocumentTypeMap = new WeakMap();
            this._editorTypeInstanceMap = new WeakMap();

            this.openDocumentsController = RangeController.create().initWithContent(this.documents);

            //TODO get rid of this once we have property dependencies
            this.addPathChangeListener("packageUrl", this, "handleCanEditDependencyWillChange", true);
            this.addPathChangeListener("packageUrl", this, "handleCanEditDependencyChange");
            this.addPathChangeListener("_windowIsKey", this, "handleCanEditDependencyWillChange", true);
            this.addPathChangeListener("_windowIsKey", this, "handleCanEditDependencyChange");

            this.addPathChangeListener("currentDocument.undoManager.undoLabel", this);
            this.addPathChangeListener("currentDocument.undoManager.redoLabel", this);
            this.addPathChangeListener("currentDocument.undoManager.undoCount", this);

            application.addEventListener("openUrl", this);
            application.addEventListener("closeDocument", this);
            application.addEventListener("menuValidate", this);

            return this;
        }
    },

    // PROJECT LOADING

    /**
     * Asynchronously load the project at the specified url
     *
     * @param {string} url The url of the file to attempt to open
     * @return {Promise} A promise for the project's loaded status
     */
    loadProject: {
        value: function (url) {

            var self = this;

            this._projectUrl = url;

            return self.environmentBridge.projectInfo(url)
                .then(function (projectInfo) {
                    return self._openProject(projectInfo.packageUrl, projectInfo.dependencies);
                });
        }
    },

    _openProject: {
        value: function (packageUrl, dependencies) {
            var self = this;

            this.dispatchEventNamed("willOpenPackage", true, false, {
                packageUrl: packageUrl
            });

            this.packageUrl = packageUrl;
            this.dependencies = dependencies;

            require.loadPackage(this.packageUrl).then(function (packageRequire) {
                self.packageDescription = packageRequire.packageDescription;
            }).done();

            // Add in components from the package being edited itself
            this.dependencies.unshift({dependency: "", url: this.environmentBridge.convertBackendUrlToPath(this.packageUrl)});

            this.watchForFileChanges();

            return Promise.all([this.populateFiles(), this.populateLibrary()])
                .then(function () {
                    self.dispatchEventNamed("didOpenPackage", true, false, {
                        packageUrl: self.packageUrl
                    });
                    return packageUrl;
                });
        }
    },

    // DOCUMENT HANDLING

    _editorTypeEditorMap: {
        value: null
    },

    _currentEditor: {
        value: null
    },

    _urlMatcherDocumentTypeMap: {
        value: null
    },

    _documentTypeUrlMatchers: {
        value: null
    },

    registerUrlMatcherForDocumentType: {
        value: function (urlMatcher, documentType) {
            if (!(documentType && urlMatcher)) {
                throw new Error("Both a document type and a url matcher are needed to register");
            }

            if (this._urlMatcherDocumentTypeMap.has(urlMatcher)) {
                throw new Error("Already has this url matcher registered for a document type");
            }

            //TODO use one data structure for both of these
            this._documentTypeUrlMatchers.push(urlMatcher);
            this._urlMatcherDocumentTypeMap.set(urlMatcher, documentType);
        }
    },

    unregisterUrlMatcherForDocumentType: {
        value: function (urlMatcher, documentType) {
            //TODO track documentTypes we have open
            throw new Error("Implement unregistering a document type");
        }
    },

    /**
     * The document prototype to use for the specified url
     * @override
     */
    documentTypeForUrl: {
        value: function (url) {
            var documentType,
                matchResults = this._documentTypeUrlMatchers.filter(function (matcher) {
                    return matcher(url) ? matcher : false;
                });

            if (matchResults.length) {
                documentType = this._urlMatcherDocumentTypeMap.get(matchResults[matchResults.length - 1]);
            }

            return documentType;
        }
    },

    /**
     * @override
     */
    createDocumentWithTypeAndUrl: {
        value: function (documentType, url) {
            return documentType.load(url, this.packageUrl);
        }
    },

    handleOpenUrl: {
        value: function (evt) {
            this.openUrlForEditing(evt.detail).done();
        }
    },

    /**
     * Open a document representing the specified fileUrl.
     *
     * This will also bring the document's editor to the front.
     *
     * @param {string} fileUrl The url for which to open a representative document
     * @return {Promise} A promise for the representative document
     */
    openUrlForEditing: {
        value: function (fileUrl) {
            var self = this,
                editor,
                alreadyOpenedDoc,
                documentType,
                editorType;

            if (this.currentDocument && fileUrl === this.currentDocument.url) {
                return Promise.resolve(this.currentDocument);
            }

            // Find editor to make frontmost
            alreadyOpenedDoc = this.documentForUrl(fileUrl);

            if (alreadyOpenedDoc) {
                editorType = alreadyOpenedDoc.editorType
            } else {
                documentType = this.documentTypeForUrl(fileUrl);

                if (documentType) {
                    editorType = documentType.editorType;
                }
            }

            if (editorType) {
                editor = this._editorTypeInstanceMap.get(editorType);

                if (!editor) {
                    editor = editorType.create();
                    //TODO formalize exactly what we pass along to the editors
                    // Most of this right here is simply for the componentEditor
                    editor.projectController = this;
                    editor.viewController = this._viewController;
                    this._editorTypeInstanceMap.set(editorType, editor);
                }

                this._editorController.bringEditorToFront(editor);
                this._currentEditor = editor;

                this.dispatchEventNamed("willOpenDocument", true, false, {
                    url: fileUrl
                });

                return this.openUrl(fileUrl).then(function (doc) {
                    self.dispatchEventNamed("didOpenDocument", true, false, {
                        document: doc,
                        isCurrentDocument: doc === self.currentDocument
                    });
                    return doc;
                });
            } else {
                //TODO do something more appropriate if there's no editor available for this document
                return Promise.resolve(null);
            }
        }
    },

    /**
     * @override
     */
    acceptedCurrentDocument: {
        value: function () {
            this._currentEditor.open(this.currentDocument);
            var selection;
            if (this.currentDocument) {
                selection = [this.currentDocument];
            } else {
                selection = [];
            }
            this.openDocumentsController.selection = selection;
        }
    },

    handleCloseDocument: {
        value: function (evt) {
            this.closeDocument(evt.detail).done();
        }
    },

    /**
     * Close the specified document.
     *
     * @note If the specified document refers to the currentDocument the next logical document will
     * become the current document.
     *
     * @param {Document} document The document to close
     * @return {Promise} A promise for the closed document
     */
    closeDocument: {
        value: function (document) {

            if (!this._urlDocumentMap.get(document.url)) {
                return Promise.reject(new Error("Cannot close a document that is not open"));
            }

            var editorType = document.editorType,
                editor = this._editorTypeInstanceMap.get(editorType),
                self = this,
                nextDocument = null,
                closedPromise,
                wasCurrentDocument = document === this.currentDocument;


            if (wasCurrentDocument) {
                nextDocument = this._nextDocument(document);
            }

            this.dispatchEventNamed("willCloseDocument", true, false, {
                document: document,
                isCurrentDocument: wasCurrentDocument
            });

            if (nextDocument) {
                closedPromise = this.openUrlForEditing(nextDocument.url).then(function () {
                    editor.close(document);
                    self.removeDocument(document);
                    return document;
                });
            } else {
                editor.close(document);
                this.removeDocument(document);
                closedPromise = Promise.resolve(document);
            }

            return closedPromise.then(function (doc) {
                self.dispatchEventNamed("didCloseDocument", true, false, {
                    document: doc,
                    wasCurrentDocument: doc === self.currentDocument
                });
                return doc;
            });

        }
    },

    // Find the "next" document after the specified document
    _nextDocument: {
        value: function (editingDocument) {
            var editingDocuments = this.openDocumentsController.organizedContent,
                docIndex = editingDocuments.indexOf(editingDocument),
                nextDocIndex = docIndex + 1;

            if (nextDocIndex > editingDocuments.length - 1) {
                nextDocIndex = docIndex - 1;
            }

            return editingDocuments[nextDocIndex];
        }
    },

    _needsMenuUpdate: {
        value: false
    },

    handlePathChange: {
        value: function (value, property, object) {

            var self = this;

            switch (property) {
            case "undoCount":
            case "undoLabel":
            case "redoLabel":

                // While several properties trigger the need for updating, only update once
                if (!this._needsMenuUpdate) {
                    this._needsMenuUpdate = true;
                    //TODO reconsider where the nextTicking responsibility should live; it's weird being here
                    // ensuring consistency between the various bound properties in the undoManager that may not have synced up yet
                    Promise.nextTick(function () {
                        self.updateUndoMenus();
                    });
                }

                if ("undoCount" === property) {
                    this.environmentBridge.setDocumentDirtyState(null != value && value > 0);
                }

                break;
            }
        }
    },

    updateUndoMenus: {
        enumerable: false,
        value: function () {

            var undoEnabled = this.getPath("currentDocument.undoManager.canUndo"),
                redoEnabled = this.getPath("currentDocument.undoManager.canRedo");

            this.environmentBridge.setUndoState(undoEnabled, this.getPath("currentDocument.undoManager.undoLabel"));
            this.environmentBridge.setRedoState(redoEnabled, this.getPath("currentDocument.undoManager.redoLabel"));

            this._needsMenuUpdate = false;
        }
    },


    _objectNameFromModuleId: {
        value: function (moduleId) {
            //TODO this utility should live somewhere else (/baz/foo-bar.reel to FooBar)
            findObjectNameRegExp.test(moduleId);
            return RegExp.$1.replace(Deserializer._toCamelCaseRegExp, Deserializer._replaceToCamelCase);
        }
    },

    //TODO cache this promise, clear cache when we detect a change?
    findLibraryItems: {
        enumerable: false,
        value: function (dependencies) {
            var self = this,
                moduleId,
                objectName,
                dependencyLibraryPromises,
                dependencyLibraryEntry,
                offeredLibraryItems;

            dependencyLibraryPromises = dependencies.map(function (dependency) {

                return self.environmentBridge.componentsInPackage(dependency.url)
                    .then(function (componentUrls) {

                        dependencyLibraryEntry = {
                            dependency: dependency.dependency
                        };

                        if (componentUrls) {
                            dependencyLibraryEntry.libraryItems = componentUrls.map(function (componentUrl) {
                                if (/\/node_modules\//.test(componentUrl)) {
                                    // It's a module inside a node_modules dependency
                                    //TODO be able to handle dependencies from mappings?
                                    moduleId = componentUrl.replace(/\S+\/node_modules\//, "");
                                } else {
                                    //It's a module that's part of the current package being edited
                                    moduleId = componentUrl.replace(dependency.url + "/", "");
                                }
                                objectName = self._objectNameFromModuleId(moduleId);
                                return self.libraryItemForModuleId(moduleId, objectName);
                            }).filter(function (libraryItem) {
                                return libraryItem;
                            });
                        } else {
                            dependencyLibraryEntry.libraryItems = [];
                        }

                        // add libraryItems any extensions offered for this package
                        offeredLibraryItems = self._packageNameLibraryItemsMap.get(dependency.dependency);
                        if (offeredLibraryItems) {
                            dependencyLibraryEntry.libraryItems.push.apply(dependencyLibraryEntry.libraryItems, offeredLibraryItems);
                        }

                        return dependencyLibraryEntry;
                    });
            });

            return Promise.all(dependencyLibraryPromises);
        }
    },

    moduleLibraryItemMap: {
        enumerable: false,
        value : null
    },

    //TODO handle multiple extensions possibly registering for the same moduleId, latest one wins?
    registerLibraryItemForModuleId: {
        value: function (libraryItem, moduleId) {
            this.moduleLibraryItemMap[moduleId] = libraryItem;

            //TODO don't refresh the library each time
            if (this.dependencies) {
                this.populateLibrary().done();
            }
        }
    },

    //TODO allow for multiple extensions to unregister for same moduleId, don't disrupt current order
    unregisterLibraryItemForModuleId: {
        value: function (moduleId) {
            delete this.moduleLibraryItemMap[moduleId];

            //TODO don't refresh the library each time
            if (this.dependencies) {
                this.populateLibrary().done();
            }
        }
    },

    libraryItemForModuleId: {
        value: function (moduleId, objectName) {
            var libraryEntry = this.moduleLibraryItemMap[moduleId],
                item;

            if (libraryEntry) {
                item = libraryEntry.create();
            } else if (typeof libraryEntry === "undefined") {
                item = LibraryItem.create();
                item.serialization = {prototype: moduleId};
                item.name = objectName;
                item.html = '<div></div>';
            }

            return item;
        }
    },

    _packageNameLibraryItemsMap: {
        value: null
    },

    registerLibraryItemForPackageName: {
        value: function (libraryItem, packageName) {
            var addedLibraryItems = this._packageNameLibraryItemsMap.get(packageName);

            if (!addedLibraryItems) {
                addedLibraryItems = [];
                this._packageNameLibraryItemsMap.set(packageName, addedLibraryItems);
            }

            addedLibraryItems.push(libraryItem);

            //TODO don't refresh the library each time
            if (this.dependencies) {
                this.populateLibrary().done();
            }
        }
    },

    unregisterLibraryItemForPackageName: {
        value: function (libraryItem, packageName) {
            var addedLibraryItems = this._packageNameLibraryItemsMap.get(packageName),
                index;

            if (addedLibraryItems) {
                index = addedLibraryItems.indexOf(libraryItem);
                if (index >= 0) {
                    addedLibraryItems.splice(index, 1);
                    //TODO don't refresh the library each time
                    if (this.dependencies) {
                        this.populateLibrary().done();
                    }
                }
            }
        }
    },

    undo: {
        value: function () {
            if (this.currentDocument) {
                this.currentDocument.undo();
            }
        }
    },

    redo: {
        value: function () {
            if (this.currentDocument) {
                this.currentDocument.redo();
            }
        }
    },

    save: {
        value: function () {

            if (!this.environmentBridge) {
                throw new Error("Cannot save without an environment bridge");
            }

            var savePromise,
                self = this;

            if (!this.currentDocument) {
                savePromise = Promise.resolve(null);
            } else {

                this.dispatchEventNamed("willSave", true, false);

                //TODO use either the url specified (save as), or the currentDoc's fileUrl
                //TODO improve this, we're reaching deeper than I'd like to find the fileUrl
                savePromise = this.environmentBridge.save(this.currentDocument, this.currentDocument.url).then(function () {
                    self.environmentBridge.setDocumentDirtyState(false);
                    self.dispatchEventNamed("didSave", true, false);
                    return self.currentDocument.url;
                });
            }

            return savePromise;
        }
    },

    installDependencies: {
        value: function () {
            var self = this,
                config = {
                    prefix : this.environmentBridge.convertBackendUrlToPath(this.packageUrl)
                };

            this.environmentBridge.installDependencies(config).then(function () {
                //TODO update this.dependencies, they've possibly changed
                self.populateLibrary().done();
            }).done();
        }
    },

    createApplication: {
        value: function () {
            var options = {
                    displayAsSheet: true,
                    prompt: "Create" //TODO localize this
                },
                self = this;

            return this.environmentBridge.promptForSave(options).then(function (destination) {
                if (!destination) {
                    window.close();
                    return null;
                }

                // remove traling slash
                destination = destination.replace(/\/$/, "");
                var destinationDividerIndex = destination.lastIndexOf("/"),
                    appName = destination.substring(destinationDividerIndex + 1),
                    packageHome = destination.substring(0, destinationDividerIndex).replace("file://localhost", ""),
                    promise = self.environmentBridge.createApplication(appName, packageHome);

                this.dispatchEventNamed("asyncActivity", true, false, {
                    promise: promise,
                    title: "Create application", // TODO localize
                    status: destination
                });

                return promise;
            }).then(function (applicationUrl) {
                return self.loadProject(applicationUrl);
            });
        }
    },

    _create: {
        value: function (thing, subdirectory, fn) {
            if (!this.canEdit) {
                throw new Error("Cannot create " + thing + " without an open project"); // TODO localize
            }

            var packagePath = this.environmentBridge.convertBackendUrlToPath(this.packageUrl),
                options = {
                    //TODO so what if the ui doesn't exist?
                    defaultDirectory: "file://localhost" + packagePath + "/" + subdirectory,
                    defaultName: "my-" + thing, // TODO localize
                    prompt: "Create" //TODO localize
                };

            return this.environmentBridge.promptForSave(options)
                .then(function (destination) {
                    if (!destination) {
                        return null;
                    }
                    // remove trailing slash
                    destination = destination.replace(/\/$/, "");
                    var destinationDividerIndex = destination.lastIndexOf("/"),
                        name = destination.substring(destinationDividerIndex + 1),
                        //TODO complain if packageHome does not match this.packageUrl?
                        packageHome = destination.substring(0, destinationDividerIndex).replace("file://localhost", ""),
                        relativeDestination = destination.substring(0, destinationDividerIndex).replace(packageHome, "").replace(/^\//, ""),
                        promise = fn(name, packageHome, relativeDestination);

                    this.dispatchEventNamed("asyncActivity", true, false, {
                        promise: promise,
                        title: "Create " + thing, // TODO localize
                        status: destination
                    });

                    return promise;
                });
        }
    },

    createComponent: {
        value: function () {
            return this._create("component", "ui",
                this.environmentBridge.createComponent.bind(this.environmentBridge));
        }
    },

    createModule: {
        value: function () {
            return this._create("module", "core",
                this.environmentBridge.createModule.bind(this.environmentBridge));
        }
    },

    _windowIsKey: {
        value: true //TODO not assume our window is key
    },

    didBecomeKey: {
        value: function () {
            this._windowIsKey = true;
        }
    },

    didResignKey: {
        value: function () {
            this._windowIsKey = false;
        }
    },

    //TODO get rid of this when we get property dependencies
    handleCanEditDependencyWillChange: {
        value: function (notification) {
            this.dispatchBeforeOwnPropertyChange("canEdit", this.canEdit);
        }
    },

    //TODO get rid of this when we get property dependencies
    handleCanEditDependencyChange: {
        value: function (notification) {
            this.dispatchOwnPropertyChange("canEdit", this.canEdit);
        }
    },

    canEdit: {
        get: function () {
            return !!(this._windowIsKey && this.packageUrl);
        }
    },

    validateMenu: {
        value: function (menu) {
            var validated = false;

            switch (menu.identifier) {
            case "undo":
            case "redo":
                this.updateUndoMenus();
                validated = true;
                break;
            }

            return validated;
        }
    },

    setupMenuItems: {
        enumerable: false,
        value: function () {

            var self = this;

            this.environmentBridge.mainMenu.then(function (mainMenu) {
                var menuItem;

                menuItem = mainMenu.menuItemForIdentifier("newComponent");
                if (menuItem) {
                    menuItem.defineBinding("enabled", {
                        "<-": "canEdit",
                        source: self
                    });
                } else {
                    throw new Error("Cannot load menu item 'newComponent'");
                }

                menuItem = mainMenu.menuItemForIdentifier("newModule");
                if (menuItem) {
                    menuItem.defineBinding("enabled", {
                        "<-": "canEdit",
                        source: self
                    });
                } else {
                    throw new Error("Cannot load menu item 'newModule'");
                }
            }).done();
        }
    },

    watchForFileChanges: {
        enumerable: false,
        value: function () {
            var self = this,
                changeHandler = function (changeType, filePath) {
                    self.handleFileSystemChange(changeType, filePath);
                };

            this.environmentBridge.watch(this.packageUrl, ["builds/"], changeHandler).done();
        }
    },

    repopulateOnFileSystemChanges: {
        value: true
    },

    handleFileSystemChange: {
        value: function (change, filePath) {

            this.dispatchEventNamed("fileSystemChange", true, false, {
                change: change,
                filePath: filePath
            });

            if (this.repopulateOnFileSystemChanges) {
                this.populateFromFileSystem().done();
            }
        }
    },

    populateFromFileSystem: {
        value: function () {
            return Promise.all([this.populateFiles(), this.populateLibrary()]);
        }
    },

    /**
     * @deprecated
     */
    populateFiles: {
        enumerable: false,
        value: function () {
            var self = this;

            return this.filesAtUrl(this.packageUrl).then(function (fileDescriptors) {
                //TODO a bit of a hack here to make a "root node" as list only gives content inside the specified path
                self.files = {children: fileDescriptors, root: true};
            });
        }
    },

    filesAtUrl: {
        value: function (url) {
            var path = this.environmentBridge.convertBackendUrlToPath(url);
            return this.environmentBridge.list(path);
        }
    },

    populateLibrary: {
        enumerable: false,
        value: function () {
            var self = this;
            return this.findLibraryItems(this.dependencies).then(function (dependencyLibraryEntries) {
                self.libraryGroups = dependencyLibraryEntries;
            });
        }
    }

});
