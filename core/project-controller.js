var Montage = require("montage/core/core").Montage,
    DocumentController = require("palette/core/document-controller").DocumentController,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application,
    LibraryItem = require("filament-extension/core/library-item").LibraryItem,
    Deserializer = require("montage/core/serialization").Deserializer,
    findObjectNameRegExp = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver._findObjectNameRegExp,
    RangeController = require("montage/core/range-controller").RangeController,
    WeakMap = require("montage/collections/weak-map"),
    Map = require("montage/collections/map"),
    Confirm = require("matte/ui/popup/confirm.reel").Confirm,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    ProjectController,
    FileDescriptor = require("core/file-descriptor").FileDescriptor,
    URL = require("core/url");

exports.ProjectController = ProjectController = DocumentController.specialize({

    constructor: {
        value: function ProjectController() {
            this.super();
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
     * This is the url that was actually "opened"
     */
    projectUrl: {
        get: function () {
            return this._projectUrl;
        }
    },

    /**
     * The url of the package of the open project
     * This specifies the location of the project's package.json.
     */
    packageUrl: {
        value: null
    },

    /**
     * The package description of the open project as read from the
     * package.json
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

            this.addPathChangeListener("currentDocument.undoManager.undoLabel", this);
            this.addPathChangeListener("currentDocument.undoManager.redoLabel", this);
            this.addPathChangeListener("currentDocument.undoManager.undoCount", this);

            application.addEventListener("openUrl", this);
            application.addEventListener("closeDocument", this);
            application.addEventListener("menuValidate", this);
            application.addEventListener("menuAction", this);

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
            this.dependencies.unshift({dependency: "", url: this.packageUrl});

            // Do these operations sequentially because populateLibrary and
            // watchForFileChanges send a lot of data across the websocket,
            // preventing the file list from appearing in a timely manner.
            return this.populateFiles()
                .then(function () {
                    // don't need to wait for this to complete
                    self.watchForFileChanges();
                    // want to wait for the library though
                    return self.populateLibrary();
                }).then(function () {
                    self.dispatchEventNamed("didOpenPackage", true, false, {
                        packageUrl: self.packageUrl
                    });
                    return packageUrl;
                });
        }
    },

    // DOCUMENT HANDLING

    // The controller that facilittates bringing editors components
    // to the front as needed
    // Typically this is filament's mainComponent
    _editorController: {
        value: null
    },

    _editorTypeInstanceMap: {
        value: null
    },

    currentEditor: {
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
                editorType,
                lastDocument = this.currentDocument;

            if (lastDocument && fileUrl === lastDocument.url) {
                return Promise.resolve(lastDocument);
            }

            // Find editor to make frontmost
            alreadyOpenedDoc = this.documentForUrl(fileUrl);

            if (alreadyOpenedDoc) {
                editorType = alreadyOpenedDoc.constructor.editorType;
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
                this.currentEditor = editor;

                this.dispatchEventNamed("willOpenDocument", true, false, {
                    url: fileUrl,
                    alreadyOpened: !!alreadyOpenedDoc
                });

                return this.openUrl(fileUrl).then(function (doc) {
                    self.dispatchEventNamed("didOpenDocument", true, false, {
                        document: doc,
                        isCurrentDocument: doc === self.currentDocument,
                        alreadyOpened: !!alreadyOpenedDoc
                    });
                    return doc;
                }, function (error) {

                    self.dispatchEventNamed("asyncActivity", true, false, {
                        promise: Promise.reject(error),
                        title: "Open " + fileUrl // TODO localize
                    });

                    if (lastDocument) {
                        return self.openUrlForEditing(lastDocument.url);
                    }
                });
            } else {
                return this.environmentBridge.openFileWithDefaultApplication(fileUrl);
            }
        }
    },

    /**
     * @override
     */
    acceptedCurrentDocument: {
        value: function () {
            this.currentEditor.open(this.currentDocument);
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

            var canCloseMessage = this.canCloseDocument(document, document.url);
            var canCancelPromise = Promise.defer();
            if (canCloseMessage) {
                // TODO PJYF This needs to be localized.
                var options = {
                    message: canCloseMessage + " Are you sure you want to close that document?",
                    okLabel: "Close",
                    cancelLabel: "Cancel"
                };
                Confirm.show(options, function () {
                    canCancelPromise.resolve();
                }, function () {
                    canCancelPromise.reject(new Error("The document prevented the close"));
                });
            } else {
                canCancelPromise.resolve();
            }

            var self = this;
            return canCancelPromise.promise.then(function () {

                var editorType = document.constructor.editorType,
                    editor = self._editorTypeInstanceMap.get(editorType),
                    nextDocument = null,
                    closedPromise,
                    wasCurrentDocument = document === self.currentDocument;

                if (wasCurrentDocument) {
                    nextDocument = self._nextDocument(document);
                }

                self.dispatchEventNamed("willCloseDocument", true, false, {
                    document: document,
                    isCurrentDocument: wasCurrentDocument
                });

                if (nextDocument) {
                    closedPromise = self.openUrlForEditing(nextDocument.url).then(function () {
                        editor.close(document);
                        self.removeDocument(document);
                        return document;
                    });
                } else {
                    editor.close(document);
                    self.removeDocument(document);
                    closedPromise = Promise.resolve(document);
                }

                return closedPromise.then(function (doc) {
                    self.dispatchEventNamed("didCloseDocument", true, false, {
                        document: doc,
                        wasCurrentDocument: doc === self.currentDocument
                    });
                    return doc;
                });
            }, Function.noop);

        }
    },

    /*
     * Give the document an opportunity to decide if it can be closed.
     * @param {Document} document to be closed
     * @param {String} location of the document being saved
     * @return null if the document can be closed, a string withe reason it cannot close otherwise
     */
    canCloseDocument: {
        value: function (document, location) {
            return (document ? document.canClose(location) : null);
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

    handlePathChange: {
        value: function (value, property, object) {
            switch (property) {
            case "undoCount":
                this.environmentBridge.setDocumentDirtyState(null != value && value > 0);
                break;
            }
        }
    },

    handleMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail;

            switch (menuItem.identifier) {
            case "newComponent":
                evt.preventDefault();
                evt.stopPropagation();

                menuItem.enabled = this.canCreateComponent;
                break;
            case "newModule":
                evt.preventDefault();
                evt.stopPropagation();

                menuItem.enabled = this.canCreateModule;
                break;
            }

        }
    },

    handleMenuAction: {
        enumerable: false,
        value: function (evt) {
            switch (evt.detail.identifier) {
            case "newComponent":
                evt.preventDefault();
                evt.stopPropagation();

                if (this.canCreateComponent) {
                    this.createComponent().done();
                }
                break;
            case "newModule":
                evt.preventDefault();
                evt.stopPropagation();

                if (this.canCreateModule) {
                    this.createModule().done();
                }
                break;
            }
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
                                    moduleId = dependency.dependency + "/" + URL.toModuleId(componentUrl, dependency.url);
                                } else {
                                    // It's a module that's part of the current package being edited
                                    moduleId = URL.toModuleId(componentUrl, dependency.url);
                                }
                                objectName = MontageReviver.parseObjectLocationId(moduleId).objectName;
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

                            offeredLibraryItems.forEach(function (item) {
                                dependencyLibraryEntry.libraryItems.push(new item());
                            });
                        }

                        return dependencyLibraryEntry;
                    });
            });

            return Promise.all(dependencyLibraryPromises);
        }
    },

    moduleLibraryItemMap: {
        enumerable: false,
        value: null
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
                item = new libraryEntry();
            } else if (typeof libraryEntry === "undefined" && (/^ui\//).test(moduleId)) {
                // Only create default entries for component within the current package
                // TODO this regex is not exactly how we'll want this done in the future but it keeps things from getting too cluttered

                var montageId = objectName.replace(/(^.)/, function (_, firstChar) {
                    return firstChar.toLowerCase();
                });

                item = new LibraryItem();
                item.serialization = {
                    prototype: moduleId,
                    properties: {
                        element: {"#": montageId}
                    }
                };
                item.name = objectName;
                item.html = '<div data-montage-id="' + montageId + '"></div>';
                item.icon = "http://client/assets/img/library-icon.png";
            }

            return item;
        }
    },

    _packageNameLibraryItemsMap: {
        value: null
    },

    addLibraryItemWithModuleIdForPackage: {
        value: function (libraryItem, moduleId, packageName) {
            if (!libraryItem) {
                return;
            }
            var addedLibraryItems = this._packageNameLibraryItemsMap.get(packageName);

            if (!addedLibraryItems) {
                addedLibraryItems = [];
                this._packageNameLibraryItemsMap.set(packageName, addedLibraryItems);
            }

            this.registerLibraryItemForModuleId(libraryItem, moduleId);
            addedLibraryItems.push(libraryItem);
        }
    },

    removeLibraryItemWithModuleIdForPackage: {
        value: function (libraryItem, moduleId, packageName) {
            var addedLibraryItems = this._packageNameLibraryItemsMap.get(packageName),
                index;

            if (addedLibraryItems) {
                index = addedLibraryItems.indexOf(libraryItem);
                if (index >= 0) {
                    addedLibraryItems.splice(index, 1);
                    this.unregisterLibraryItemForModuleId(moduleId);
                }
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
                    prefix: this.environmentBridge.convertBackendUrlToPath(this.packageUrl)
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

                self.dispatchEventNamed("asyncActivity", true, false, {
                    promise: promise,
                    title: "Create application", // TODO localize
                    status: destination
                });

                return promise;
            }).then(function (applicationUrl) {
                // select main.reel
                var openMainReel = function (evt) {
                    self.removeEventListener("didOpenPackage", openMainReel, false);
                    self.dispatchEventNamed("openUrl", true, true, applicationUrl + "/ui/main.reel/");
                };
                self.addEventListener("didOpenPackage", openMainReel, false);

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
                },
                self = this;

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

                    self.dispatchEventNamed("asyncActivity", true, false, {
                        promise: promise,
                        title: "Create " + thing, // TODO localize
                        status: destination
                    });

                    return promise;
                });
        }
    },

    canCreateComponent: {
        get: function () {
            return this.canEdit;
        }
    },

    createComponent: {
        value: function () {
            return this._create("component", "ui",
                this.environmentBridge.createComponent.bind(this.environmentBridge));
        }
    },

    canCreateModule: {
        get: function () {
            return this.canEdit;
        }
    },

    createModule: {
        value: function () {
            return this._create("module", "core",
                this.environmentBridge.createModule.bind(this.environmentBridge));
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
            return !!this.packageUrl;
        }
    },

    watchForFileChanges: {
        enumerable: false,
        value: function () {
            var self = this,
                changeHandler = function (changeType) {
                    switch (changeType) {
                    case "update":
                        self.handleFileSystemUpdate.apply(self, Array.prototype.slice.call(arguments, 1));
                        break;
                    case "create":
                        self.handleFileSystemCreate.apply(self, Array.prototype.slice.call(arguments, 1));
                        break;
                    case "delete":
                        self.handleFileSystemDelete.apply(self, Array.prototype.slice.call(arguments, 1));
                        break;
                    }
                },
                errorHandler = function (err) {
                    throw err;
                };

            this.environmentBridge.watch(this.packageUrl, ["builds/"], changeHandler, errorHandler).done();
        }
    },

    handleFileSystemCreate: {
        value: function (fileUrl, currentStat, previousStat) {
            var parentUrl = fileUrl.substring(0, fileUrl.replace(/\/$/, "").lastIndexOf("/")),
                parent = this.fileInTreeAtUrl(parentUrl),
                newFile;

            if (parent && parent.children) {
                newFile = FileDescriptor.create().initWithUrlAndStat(fileUrl, currentStat);
                //TODO account for some sort of sorting at this point?
                parent.children.push(newFile);
            }

            //TODO try to be more focused about this based upon the file that was created
            this.populateLibrary().done();

            this.dispatchEventNamed("fileSystemChange", true, false, {
                change: "create",
                fileUrl: fileUrl,
                currentStat: currentStat,
                previousStat: previousStat
            });
        }
    },

    handleFileSystemDelete: {
        value: function (fileUrl, currentStat, previousStat) {
            var parentUrl = fileUrl.substring(0, fileUrl.replace(/\/$/, "").lastIndexOf("/")),
                parent = this.fileInTreeAtUrl(parentUrl),
                children,
                childrenByUrl,
                child;

            if (parent && (children = parent.children)) {
                // NOTE I'd capture the index while reducing, but I don't want to create
                // more objects, it's usually going to be fast enough to find it in the
                // collection again
                childrenByUrl = children.reduce(function (urlMap, child) {
                    urlMap[child.fileUrl] = child;
                    return urlMap;
                }, {});
                child = childrenByUrl[fileUrl];

                children.splice(children.indexOf(child), 1);
            }

            //TODO try to be more focused about this based upon the file that was deleted
            this.populateLibrary().done();

            this.dispatchEventNamed("fileSystemChange", true, false, {
                change: "delete",
                fileUrl: fileUrl,
                currentStat: currentStat,
                previousStat: previousStat
            });

        }
    },

    handleFileSystemUpdate: {
        value: function (fileUrl, currentStat, previousStat) {
            this.dispatchEventNamed("fileSystemChange", true, false, {
                change: "update",
                fileUrl: fileUrl,
                currentStat: currentStat,
                previousStat: previousStat
            });
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

    /**
     * Finds the file descriptor at the specified URL if it's known within
     * the explored tree of files within the project
     * @param {Url} fileUrl The URL of the file to find
     */
    fileInTreeAtUrl: {
        value: function (fileUrl) {
            if (fileUrl === this.projectUrl) {
                return this.files;
            }

            var relativePathInProject = fileUrl.replace(this.projectUrl + "/", "");
            var hierarchy = relativePathInProject.split("/");

            var root = this.files,
                foundFile = null,
                segmentCount = hierarchy.length,
                segmentIndex = 0,
                pathSegment,
                collectChildrenByName = function (nameMap, child) {
                    nameMap[child.name] = child;
                    return nameMap;
                },
                childrenByName;

            while (segmentIndex < segmentCount) {
                pathSegment = hierarchy[segmentIndex];
                childrenByName = root.children.reduce(collectChildrenByName, {});
                root = childrenByName[pathSegment];

                if (root) {
                    segmentIndex++;
                }

            }

            if (segmentIndex === segmentCount && root) {
                foundFile = root;
            }

            return foundFile;
        }
    },

    /**
     * The collection of immediate children within the specified url
     *
     * @param {url} url The URL to find children within
     */
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
