var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    LibraryItem = require("filament-extension/core/library-item.js").LibraryItem,
    Deserializer = require("montage/core/deserializer").Deserializer,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

exports.ProjectController = Montage.create(Montage, {

    init: {
        value: function (bridge, viewController) {
            this._environmentBridge = bridge;
            this._viewController = viewController;
            this.openDocumentsController = ArrayController.create().initWithContent([]);

            this.openDocumentsController.addPropertyChangeListener("selectedObjects", this);

            this.loadedExtensions = [];
            this.activeExtensions = [];
            this.moduleLibraryItemMap = {};
            this.packageNameLibraryItemsMap = {};

            bridge.setDocumentDirtyState(false);
            this.setupMenuItems();

            var self = this,
                application = document.application,
                deferredEditor = Promise.defer();

            application.addEventListener("activateExtension", this);
            application.addEventListener("deactivateExtension", this);

            application.addEventListener("canLoadReel", function () {
                deferredEditor.resolve(true);
            });
            //TODO timeout the promise in some reasonable window

            // discover available extensions as soon as possible,
            // subsequent activity may rely on us knowing them
            this._extensionPromise = this.environmentBridge.availableExtensions
                .then(function (extensionUrls) {
                    return self.loadExtensions(extensionUrls);
                }).then(function (extensions) {
                    extensions.forEach(function (extension) {
                        self.activateExtension(extension); //TODO is the extension is supposed to be activated based on user preferences?
                    });
                });

            Promise.all([this._extensionPromise, deferredEditor]).then(function () {
                self.dispatchEventNamed("canLoadProject", true, false);
            }).done();

            this.addPropertyChangeListener("currentDocument.undoManager.undoLabel", this);
            this.addPropertyChangeListener("currentDocument.undoManager.redoLabel", this);
            this.addPropertyChangeListener("currentDocument.undoManager.undoCount", this);

            return this;
        }
    },

    loadExtensions: {
        enumerable: false,
        //TODO accept a single extension as well
        value: function (extensionUrls) {
            var self = this;

            return Promise.all(extensionUrls.map(function (url) {
                // TODO npm install?
                return require.loadPackage(url).then(function (packageRequire) {
                    return packageRequire.async("extension");
                }).then(function (exports) {
                    return self.loadExtension(exports);
                });
            }));
        }
    },

    loadExtension: {
        enumerable: false,
        value: function (extensionModule) {
            var extension = extensionModule.Extension;

            if (!extension) {
                throw new Error("Malformed extension. Expected '" + extensionModule + "' to export 'Extension'");
            }

            this.loadedExtensions.add(extension);
            return extension;
        }
    },

    loadedExtensions: {
        value: null
    },

    activeExtensions: {
        value: null
    },

    handleActivateExtension: {
        value: function (evt) {
            this.activateExtension(evt.detail).done();
        }
    },

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

    handleDeactivateExtension: {
        value: function (evt) {
            this.deactivateExtension(evt.detail).done();
        }
    },

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

    _environmentBridge: {
        value: null
    },

    environmentBridge: {
        get: function () {
            return this._environmentBridge;
        }
    },

    _viewController: {
        value: null
    },

    _extensionPromise: {
        value: null
    },

    // The project url as provided by the environment
    // Typically, if a url is provided by the environment this would be the url
    // to try and load.
    projectUrl: {
        get: function () {
            return this.environmentBridge.projectUrl;
        }
    },

    // The url of the package of the open project
    packageUrl: {
        value: null
    },

    // The ID of the preview being served by our host environment
    previewId: {
        enumerable: false,
        value: null
    },

    files: {
        value: null
    },

    dependencies: {
        value: null
    },

    // The groups of library items available to this package
    libraryGroups: {
        value: null
    },

    loadProject: {
        value: function (url) {
            var self = this;

            this._extensionPromise.then(function () {
                return self.environmentBridge.projectInfo(url);
            }).then(function (projectInfo) {
                self.openProject(projectInfo);
            }).done();
        }
    },

    // TODO define projectInfo contract
    openProject: {
        enumerable: false,
        value: function (projectInfo) {
            var self = this;

            this._fileUrlEditorMap = {};
            this._fileUrlDocumentMap = {};

            this.dispatchEventNamed("willOpenPackage", true, false, {
                packageUrl: projectInfo.packageUrl
            });

            this.packageUrl = projectInfo.packageUrl;
            this.dependencies = projectInfo.dependencies;

            // Add in components from the package being edited itself
            this.dependencies.unshift({dependency: "", url: this.environmentBridge.convertBackendUrlToPath(this.packageUrl)});

            this.watchForFileChanges();

            Promise.all([this.populateFiles(), this.populateLibrary()])
                .then(function () {
                    self.dispatchEventNamed("didOpenPackage", true, false, {
                        packageUrl: self.packageUrl
                    });

                    //TODO only do this if we have an index.html
                    self.environmentBridge.registerPreview(self.packageUrl, self.packageUrl + "/index.html").then(function (previewId) {
                        self.previewId = previewId;
                        self.dispatchEventNamed("didRegisterPreview", true, false);
                        //TODO not launch this automatically
                        return self.launchPreview();
                    }).done();

                }).done();
        }
    },

    willCloseProject: {
        value: function () {
            //TODO only if we're registered
            this.unregisterPreview().done();
        }
    },

    launchPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.launchPreview(this.previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchEventNamed("didLaunchPreview", true, false);
            });
        }
    },

    refreshPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.refreshPreview(this.previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchEventNamed("didRefreshPreview", true, false);
            });
        }
    },

    unregisterPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.unregisterPreview(this.previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchEventNamed("didUnregisterPreview", true, false);
            });
        }
    },

    _fileUrlEditorMap: {
        value: null
    },

    _fileUrlDocumentMap: {
        value: null
    },

    openFileUrlInEditor: {
        value: function (fileUrl, editor) {
            var editingDocuments,
                docIndex,
                self = this,
                promisedDocument;

            if (this.currentDocument && fileUrl === this.currentDocument.fileUrl) {
                promisedDocument = Promise.resolve(this.currentDocument);
            } else {

                if (this.currentDocument) {
                    this.dispatchEventNamed("willExitDocument", true, false, this.currentDocument);
                }

                editingDocuments = this.openDocumentsController.organizedObjects;
                docIndex = editingDocuments.map(function (doc) {
                    return doc.fileUrl;
                }).indexOf(fileUrl);

                if (docIndex > -1) {

                    promisedDocument = editor.load(fileUrl, this.packageUrl).then(function (editingDocument) {
                        self.currentDocument = editingDocument;
                        self.openDocumentsController.selectedObjects = [editingDocument];
                        self.dispatchEventNamed("didEnterDocument", true, false, editingDocument);
                        return editingDocument;
                    });

                } else {

                    this._fileUrlEditorMap[fileUrl] = editor;

                    promisedDocument = editor.load(fileUrl, this.packageUrl).then(function (editingDocument) {
                        self.currentDocument = editingDocument;
                        self.openDocumentsController.addObjects(editingDocument);
                        self.openDocumentsController.selectedObjects = [editingDocument];
                        self._fileUrlDocumentMap[fileUrl] = editingDocument;

                        self.dispatchEventNamed("didLoadDocument", true, false, editingDocument);
                        self.dispatchEventNamed("didEnterDocument", true, false, editingDocument);

                        return editingDocument;
                    });
                }

            }

            return promisedDocument;
        }
    },

    closeFileUrlInEditor: {
        value: function (fileUrl, editor) {
            var self = this,
                openNextDocPromise,
                editingDocument = this._fileUrlDocumentMap[fileUrl],
                editingDocuments = this.openDocumentsController.organizedObjects,
                docIndex,
                nextDocIndex,
                nextDoc,
                nextEditor,
                editor;

            if (this.currentDocument && fileUrl === this.currentDocument.fileUrl) {


                if (1 === editingDocuments.length) {
                    this.dispatchEventNamed("willExitDocument", true, false, this.currentDocument);
                    this.currentDocument = null;
                    openNextDocPromise = Promise.resolve(true);
                } else {
                    //Switch to the "next" tab, however we want to define that
                    docIndex = editingDocuments.indexOf(editingDocument);
                    nextDocIndex = docIndex + 1;

                    if (nextDocIndex > editingDocuments.length - 1) {
                        nextDocIndex = docIndex - 1;
                    }

                    nextDoc = editingDocuments[nextDocIndex];
                    nextEditor = this._fileUrlEditorMap[nextDoc.fileUrl];

                    //TODO I want to call openDocument, or openFileUrl here without knowing the editor
                    // I think we should centralize that knowledge here if possible and out of main

                    openNextDocPromise = this.openFileUrlInEditor(nextDoc.fileUrl, nextEditor);
                }
            } else {
                openNextDocPromise = Promise.resolve(true);
            }

            self.dispatchEventNamed("willCloseDocument", true, false, editingDocument);

            return openNextDocPromise.then(function () {
                return editor.close(fileUrl).then(function (document) {
                    self.openDocumentsController.removeObjects(document);
                    delete self._fileUrlEditorMap[fileUrl];
                    delete self._fileUrlDocumentMap[fileUrl];
                    return document;
                });
            });
        }
    },

    handleChange: {
        value: function (notification) {

            var currentPropertyPath = notification.currentPropertyPath;

            if (notification.target === this.openDocumentsController && "selectedObjects" === currentPropertyPath) {
                if (this.openDocumentsController.selectedObjects && this.openDocumentsController.selectedObjects.length > 0) {
                    var fileUrl = this.openDocumentsController.selectedObjects[0].fileUrl,
                        editor = this._fileUrlEditorMap[fileUrl];
                    this.openFileUrlInEditor(fileUrl, editor).done();
                }
            } else if ("currentDocument.undoManager.undoLabel" === currentPropertyPath ||
                       "currentDocument.undoManager.redoLabel" === currentPropertyPath) {
                this.updateUndoMenus();
            } else if ("currentDocument.undoManager.undoCount" === currentPropertyPath) {
                var undoCount = this.getProperty(currentPropertyPath);
                //Dirty if we have a document and there things to undo
                this.environmentBridge.setDocumentDirtyState(null != undoCount && undoCount > 0);
            }

        }
    },

    updateUndoMenus: {
        enumerable: false,
        value: function () {

            if (this.getProperty("currentDocument.undoManager.undoCount")) {
                this.environmentBridge.setUndoState(true, this.getProperty("currentDocument.undoManager.undoLabel"));
            } else {
                this.environmentBridge.setUndoState(false);
            }

            if (this.getProperty("currentDocument.undoManager.redoCount")) {
                this.environmentBridge.setRedoState(true, this.getProperty("currentDocument.undoManager.redoLabel"));
            } else {
                this.environmentBridge.setRedoState(false);
            }
        }
    },

    openDocumentsController: {
        value: null
    },

    _objectNameFromModuleId: {
        value: function (moduleId) {
            //TODO this utility should live somewhere else (/baz/foo-bar.reel to FooBar)
            Deserializer._findObjectNameRegExp.test(moduleId);
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
                        offeredLibraryItems = self.packageNameLibraryItemsMap[dependency.dependency];
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
        enumerable: false,
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

    packageNameLibraryItemsMap: {
        enumerable: false,
        value: null
    },

    registerLibraryItemForPackageName: {
        value: function (libraryItem, packageName) {
            var addedLibraryItems = this.packageNameLibraryItemsMap[packageName];

            if (!addedLibraryItems) {
                addedLibraryItems = this.packageNameLibraryItemsMap[packageName] = [];
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
            var addedLibraryItems = this.packageNameLibraryItemsMap[packageName],
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

    currentDocument: {
        value: null
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

    documents: {
        value: null
    },

    save: {
        value: function () {

            if (!this.currentDocument) {
                return;
            }

            if (!this.environmentBridge) {
                throw new Error("Cannot save without an environment bridge");
            }

            this.dispatchEventNamed("willSave", true, false);

            //TODO use either the url specified (save as), or the currentDoc's fileUrl
            //TODO improve this, we're reaching deeper than I'd like to find the fileUrl
            var self = this;
            return this.environmentBridge.save(this.currentDocument, this.currentDocument.fileUrl).then(function () {
                self.environmentBridge.setDocumentDirtyState(false);
                self.refreshPreview().done();
                return self.currentDocument.fileUrl;
            });
        }
    },

    installDependencies: {
        value: function () {
            var self = this,
                config = {
                    prefix : this.environmentBridge.convertBackendUrlToPath(this.packageUrl)
                };

            this._isInstallingDependencies = true;
            this.environmentBridge.installDependencies(config).then(function () {
                //TODO update this.dependencies, they've possibly changed
                self._isInstallingDependencies = false;
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
                    packageHome = destination.substring(0, destinationDividerIndex).replace("file://localhost", "");

                var promise = self.environmentBridge.createApplication(appName, packageHome);

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
                },
                self = this;

            return this.environmentBridge.promptForSave(options)
            .then(function (destination) {
                if (!destination) {
                    return null;
                }
                // remove traling slash
                destination = destination.replace(/\/$/, "");
                var destinationDividerIndex = destination.lastIndexOf("/"),
                    name = destination.substring(destinationDividerIndex + 1),
                    //TODO complain if packageHome does not match this.packageUrl?
                    packageHome = destination.substring(0, destinationDividerIndex).replace("file://localhost", ""),
                    relativeDestination = destination.substring(0, destinationDividerIndex).replace(packageHome, "").replace(/^\//, "");

                var promise = fn(name, packageHome, relativeDestination);

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
                this.environmentBridge.createComponent.bind(this.environmentBridge)
            );
        }
    },

    createModule: {
        value: function () {
            return this._create("module", "core",
                this.environmentBridge.createModule.bind(this.environmentBridge)
            );
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

    canEdit: {
        dependencies: ["_windowIsKey", "packageUrl"],
        get: function () {
            return !!(this._windowIsKey && this.packageUrl);
        }
    },

    setupMenuItems: {
        enumerable: false,
        value: function () {

            var newComponentMenuItem,
                self = this;

            this.environmentBridge.mainMenu.then(function (mainMenu) {

                Object.defineBinding(mainMenu.menuItemForIdentifier("newComponent"), "enabled", {
                    boundObject: self,
                    boundObjectPropertyPath: "canEdit",
                    oneway: true
                });

                Object.defineBinding(mainMenu.menuItemForIdentifier("newModule"), "enabled", {
                    boundObject: self,
                    boundObjectPropertyPath: "canEdit",
                    oneway: true
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

    populateFiles: {
        enumerable: false,
        value: function () {
            var self = this,
                packagePath = this.environmentBridge.convertBackendUrlToPath(this.packageUrl);

            return this.environmentBridge.listTreeAtUrl(packagePath).then(function (fileDescriptors) {
                self.files = fileDescriptors;
            });
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
