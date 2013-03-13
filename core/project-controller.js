var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    LibraryItem = require("filament-extension/core/library-item.js").LibraryItem,
    Deserializer = require("montage/core/serialization").Deserializer,
    findObjectNameRegExp = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver._findObjectNameRegExp,
    RangeController = require("montage/core/range-controller").RangeController,
    WeakMap = require("montage/collections/weak-map"),
    Map = require("montage/collections/map"),
    ProjectController;

exports.ProjectController = ProjectController = Montage.create(Montage, {

    // "CLASS" METHODS

    /**
     * Asynchronously create a ProjectController, loading all the available extensions found by the
     * specified environment bridge.
     *
     * @param {EnvironmentBridge} bridge An environment bridge that normalizes different environment features
     * @param {ViewController} viewController A controller that manages registration of views that can appear through filament
     * @return {Promise} A promise for a ProjectController
     */
    load: {
        value: function (bridge, viewController) {

            var self = this;
            return bridge.availableExtensions.then(function (extensionUrls) {

                return Promise.all(extensionUrls.map(function (url) {
                    return self.loadExtension(url);
                }));

            }).then(function (extensions) {
                return ProjectController.create().init(bridge, viewController, extensions);
            });
        }
    },

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

    _fileUrlEditorMap: {
        value: null
    },

    _fileUrlDocumentMap: {
        value: null
    },

    /**
     * The ID of the preview being served by our host environment
     */
    _previewId: {
        value: null
    },

    /**
     * The active EditingDocument instance
     */
    //TODO not let this be read/write
    currentDocument: {
        value: null
    },

    // INITIALIZATION

    /**
     * Initialize a ProjectController
     *
     * @param {EnvironmentBridge} bridge An environment bridge that normalizes different environment features
     * @param {ViewController} viewController A controller that manages registration of views that can appear through filament
     * @param {array} extensions A collection of extension objects to make available to this instance of the projectController
     * @return {ProjectController} An initialized instance of a ProjectController
     */
    init: {
        value: function (bridge, viewController, extensions) {
            bridge.setDocumentDirtyState(false);

            var self = this;

            this._editorTypeInstanceMap = new WeakMap();
            this._fileUrlEditorMap = new Map();
            this._fileUrlDocumentMap = new Map();

            this._environmentBridge = bridge;
            this._viewController = viewController;
            this.moduleLibraryItemMap = new Map();
            this._packageNameLibraryItemsMap = new Map();

            this.loadedExtensions = extensions;
            this.activeExtensions = [];

            //TODO only activate some extensions…
            if (extensions) {
                extensions.forEach(function (extension) {
                    self.activateExtension(extension);
                });
            }

            this.openDocumentsController = RangeController.create().initWithContent([]);
            this.openDocumentsController.addRangeAtPathChangeListener("selection", this, "handleOpenDocumentsSelectionRangeChange");

            this.setupMenuItems();

            //TODO get rid of this once we have property dependencies
            this.addPathChangeListener("packageUrl", this, null, true);
            this.addPathChangeListener("packageUrl", this);
            this.addPathChangeListener("_windowIsKey", this, null, true);
            this.addPathChangeListener("_windowIsKey", this);

            this.addPathChangeListener("currentDocument.undoManager.undoLabel", this);
            this.addPathChangeListener("currentDocument.undoManager.redoLabel", this);
            this.addPathChangeListener("currentDocument.undoManager.undoCount", this);

            return this;
        }
    },

    // EXTENSIONS

    /**
     * Asynchronously load the extension package from the specified
     * extensionUrl, returning a reference to the exported Extension.
     *
     * When called as a method on an instance of a ProjectController
     * the loadedExtension will be added to the instance's
     * loadedExtensions collection automatically.
     *
     * @param {string} extensionUrl The extension package Url to load
     * @return {Promise} A promise for the exported Extension object
     */
    loadExtension: {
        enumerable: false,
        value: function (extensionUrl) {

            var self = this;

            // TODO npm install?
            return require.loadPackage(extensionUrl).then(function (packageRequire) {
                return packageRequire.async("extension");
            }).then(function (exports) {
                var extension = exports.Extension;

                if (!extension) {
                    throw new Error("Malformed extension. Expected '" + extensionUrl + "' to export 'Extension'");
                }

                if (self.loadedExtensions) {
                    self.loadedExtensions.push(extension);
                }

                return extension;
            });
        }
    },

    /**
     * The collection of all extensions loaded by the projectController.
     * Note that these are not necessarily active, simply loaded.
     */
    loadedExtensions: {
        value: null
    },

    /**
     * The collection of all active extensions
     */
    activeExtensions: {
        value: null
    },

    /**
     * Asynchronously activate the specified extension
     *
     * @param {Extension} extension The extension to activate
     * @return {Promise} A promise for the activated extension
     */
    activateExtension: {
        value: function (extension) {
            var activationPromise;

            if (-1 === this.activeExtensions.indexOf(extension)) {

                this.dispatchEventNamed("willActivateExtension", true, false, extension);
                this.activeExtensions.push(extension);

                if (typeof extension.activate === "function") {
                    activationPromise = extension.activate(document.application, this, this._viewController);
                } else {
                    activationPromise = Promise.resolve(extension);
                }

            } else {
                activationPromise = Promise.reject(new Error("Cannot activate an active extension"));
            }

            return activationPromise;
        }
    },

    /**
     * Asynchronously deactivate the specified extension
     *
     * @param {Extension} extension The extension to deactivate
     * @return {Promise} A promise for the deactivated extension
     */
    deactivateExtension: {
        value: function (extension) {
            var deactivationPromise,
                index = this.activeExtensions.indexOf(extension);

            if (index > -1) {

                this.dispatchEventNamed("willDeactivateExtension", true, false, extension);
                this.activeExtensions.splice(index, 1);

                if (typeof extension.deactivate === "function") {
                    deactivationPromise = extension.deactivate(document.application, this, this._viewController);
                } else {
                    deactivationPromise = Promise.resolve(extension);
                }

            } else {
                deactivationPromise = Promise.reject(new Error("Cannot deactivate an inactive extension"));
            }

            return deactivationPromise;
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

            //TODO what if this is called multiple times?

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

                    //TODO only do this if we have an index.html
                    self.environmentBridge.registerPreview(self.packageUrl, self.packageUrl + "/index.html").then(function (previewId) {
                        self._previewId = previewId;
                        self.dispatchEventNamed("didRegisterPreview", true, false);
                        //TODO not launch this automatically
                        return self.launchPreview();
                    }).done();

                    return true;
                });
        }
    },

    // PREVIEW SERVING

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
                self.dispatchEventNamed("didUnregisterPreview", true, false);
            });
        }
    },

    willCloseProject: {
        value: function () {
            //TODO only if we're registered
            this.unregisterPreview().done();
        }
    },

    // DOCUMENT HANDLING

    handleOpenDocumentsSelectionRangeChange: {
        value: function (plus, minus, index) {
            if (this.openDocumentsController.selection && this.openDocumentsController.selection.length > 0) {
                var fileUrl = this.openDocumentsController.selection[0].fileUrl;
                if (!this.currentDocument || fileUrl !== this.currentDocument.fileUrl) {
                    this.openFileUrl(fileUrl).done();
                }
            }
        }
    },

    //TODO make this a two step thing? loadFileUrl then openFileUrl to give us a place to have an editor instance and have it draw before "opening" the document?
    //TODO expose the currentEditor, not the currentDocument?
    /**
     * Find a suitable editor for the document at the specified fileUrl and open it
     *
     * @return {Promise} A promise for the editing document and the editor used to open the document
     */
    openFileUrl: {
        value: function (fileUrl) {
            var editor,
                docAlreadyLoaded,
                self = this,
                promisedLoadInfo;

            if (this.currentDocument && fileUrl === this.currentDocument.fileUrl) {
                // fileUrl is already open; do nothing
                editor = this._fileUrlEditorMap[fileUrl];
                promisedLoadInfo = Promise.resolve({document: this.currentDocument, editor: editor});
            } else {

                editor = this._editorForFileUrl(fileUrl);

                if (!editor) {
                    // No editor available for this document
                    promisedLoadInfo = Promise.resolve({document: null, editor: null});
                } else {

                    docAlreadyLoaded = !!this._fileUrlDocumentMap[fileUrl];
                    this._fileUrlEditorMap.set(fileUrl, editor);

                    // Editor available; load the editingDocument
                    if (!docAlreadyLoaded) {
                        this.dispatchEventNamed("willLoadDocument", true, false, fileUrl);
                    }

                    promisedLoadInfo = editor.load(fileUrl, this.packageUrl).then(function (editingDocument) {
                        if (self.currentDocument) {
                            self.dispatchEventNamed("willExitDocument", true, false, self.currentDocument);
                        }

                        if (!docAlreadyLoaded) {
                            self._fileUrlDocumentMap.set(fileUrl, editingDocument);
                            self.openDocumentsController.push(editingDocument);
                            self.dispatchEventNamed("didLoadDocument", true, false, editingDocument);
                        }

                        self.dispatchEventNamed("willEnterDocument", true, false, editingDocument);

                        self.currentDocument = editingDocument;
                        self.openDocumentsController.selection = [editingDocument];

                        if (!docAlreadyLoaded) {
                            self.dispatchEventNamed("didLoadDocument", true, false, editingDocument);
                        }

                        self.dispatchEventNamed("didEnterDocument", true, false, editingDocument);

                        return {document: editingDocument, editor: editor};
                    }, function (error) {
                        // Something gone wrong revert to the current document
                        console.log("Could not open the document. reverting to the previous one. ", error);
                        return Promise.resolve({document: self.currentDocument, editor: editor});
                    });
                }
            }

            return promisedLoadInfo;
        }
    },

    /**
     * Close the specified fileUrl in whatever editor has it open.
     *
     * @note If the specified fileUrl refers to the currentDocument the next logical document will
     * become the current document.
     *
     * @return {Promise} A promise for the closed document
     */
    closeFileUrl: {
        value: function (fileUrl) {

            var editingDocument = this._fileUrlDocumentMap.get(fileUrl),
                editingDocuments = this.openDocumentsController.content,
                openNextDocPromise,
                nextDoc,
                editor,
                self = this;

            if (!editingDocument) {
                return Promise.reject(new Error("Cannot close unopened file '" + fileUrl + "'"));
            }

            this.dispatchEventNamed("willCloseDocument", true, false, editingDocument);

            if (this.currentDocument && editingDocument === this.currentDocument) {
                //The current document is the one being closed:

                if (1 === editingDocuments.length) {
                    // No other documents to open; manually exit
                    this.dispatchEventNamed("willExitDocument", true, false, this.currentDocument);
                    this.currentDocument = null;
                    openNextDocPromise = Promise.resolve(true);
                } else {
                    //Open the next document
                    nextDoc = this._nextDocument(editingDocument);
                    openNextDocPromise = this.openFileUrl(nextDoc.fileUrl);
                }
            } else {
                openNextDocPromise = Promise.resolve(true);
            }

            return openNextDocPromise.then(function () {

                editor = self._fileUrlEditorMap.get(fileUrl);

                return editor.close(fileUrl).then(function (document) {
                    self.openDocumentsController.delete(document);
                    self._fileUrlEditorMap.delete(fileUrl);
                    self._fileUrlDocumentMap.delete(fileUrl);
                    return document;
                });
            });

        }
    },

    _editorForFileUrl: {
        value: function (fileUrl) {
            var editor = this._fileUrlEditorMap.get(fileUrl),
                editorType;

            if (!editor) {
                editorType = this._viewController.editorTypeForFileUrl(fileUrl);

                if (editorType) {
                    editor = this._editorTypeInstanceMap.get(editorType);

                    if (!editor) {
                        editor = editorType.create();
                        editor.projectController = this;
                        editor.viewController = this.viewController;

                        this._editorTypeInstanceMap.set(editorType, editor);
                    }
                }
            }

            return editor;
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
                savePromise = this.environmentBridge.save(this.currentDocument, this.currentDocument.fileUrl).then(function () {
                    self.environmentBridge.setDocumentDirtyState(false);
                    self.refreshPreview().done();
                    return self.currentDocument.fileUrl;
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

            this.environmentBridge.promptForSave(options).then(function (destination) {
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
                self.loadProject(applicationUrl);
            }).done();
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
    handlePackageUrlWillChange: {
        value: function (notification) {
            this.dispatchBeforeOwnPropertyChange("canEdit", this.canEdit);
        }
    },

    //TODO get rid of this when we get property dependencies
    handlePackageUrlChange: {
        value: function (notification) {
            this.dispatchOwnPropertyChange("canEdit", this.canEdit);
        }
    },

    //TODO get rid of this when we get property dependencies
    handle_windowIsKeyWillChange: {
        value: function (notification) {
            this.dispatchBeforeOwnPropertyChange("canEdit", this.canEdit);
        }
    },

    //TODO get rid of this when we get property dependencies
    handle_windowIsKeyChange: {
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

                mainMenu.menuItemForIdentifier("newComponent").defineBinding("enabled", {
                    "<-": "canEdit",
                    source: self
                });

                mainMenu.menuItemForIdentifier("newModule").defineBinding("enabled", {
                    "<-": "canEdit",
                    source: self
                });
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
