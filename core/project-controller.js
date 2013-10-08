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
    Template = require("montage/core/template").Template,
    URL = require("core/url");

exports.ProjectController = ProjectController = DocumentController.specialize({

    constructor: {
        value: function ProjectController() {
            this.super();
            this._fileChangesHead = { next: null };
            this._lastFileChangeForDocumentMap = new WeakMap();
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

    _extensionController: {
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

    _fileChangesHead: {
        value: null
    },

    _lastFileChangeForDocumentMap: {
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
        value: function (bridge, viewController, editorController, extensionController) {
            bridge.setDocumentDirtyState(false);

            var self = this;

            this._environmentBridge = bridge;
            this._viewController = viewController;
            this._editorController = editorController;
            this._extensionController = extensionController;

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
            application.addEventListener("openModuleId", this);
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

            var packagePromise = require.loadPackage(this.packageUrl).then(function (packageRequire) {
                var packageDescription = packageRequire.packageDescription;
                self.loadProjectIcon(self.packageUrl);
                self.packageDescription = packageDescription;

                // Add a dependency entry for this package so that the
                // we pick up its extensions and components later
                self.dependencies.unshift({
                    dependency: packageDescription.name,
                    url: self.packageUrl
                });
            });

            // Do these operations sequentially because populateLibrary and
            // watchForFileChanges send a lot of data across the websocket,
            // preventing the file list from appearing in a timely manner.
            return Promise.all([this.populateFiles(), packagePromise])
                .then(function () {
                    // don't need to wait for this to complete
                    self.watchForFileChanges();
                    // need these before getting the library items
                    return self.loadExtensions();
                }).then(function () {
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

    icon: {
        value: null
    },

    loadProjectIcon: {
        value: function(projectUrl) {
            var self = this;
            var url = projectUrl + "/index.html";
            this.icon = this.icon || "/assets/icons/app-icon.png";

            var req = new XMLHttpRequest();
            req.open("GET", url);
            req.addEventListener("load", function() {
                if (req.status === 200) {
                    var touchIconLink,
                        touchIcon,
                        doc,
                        template;

                    template = Template.create();
                    doc = template.createHtmlDocumentWithHtml(req.responseText);

                    // Use Apple touch or Android shortcut icon as the project icon, if present
                    touchIconLink = doc.querySelector('link[rel="apple-touch-icon-precomposed"]')
                        || doc.querySelector('link[rel="apple-touch-icon"]')
                        || doc.querySelector('link[rel="shortcut icon"]');

                    if (touchIconLink && touchIconLink.getAttribute("href")) {
                        self.icon = projectUrl + "/" + touchIconLink.getAttribute("href");
                    }
                }
            }, false);

            req.send();
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

    handleOpenModuleId: {
        value: function (evt) {
            var moduleId = evt.detail.moduleId;
            var fileUrl = URL.resolve(this.projectUrl + "/", moduleId + (/\.reel$/.test(moduleId) ? "/" : ""));
            this.openUrlForEditing(fileUrl).done();
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

    addDocument: {
        value: function (document) {
            var result = this.super(document);
            this.dispatchFileChanges(document);
            return result;
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
            this.dispatchFileChanges(this.currentDocument);
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

                closedPromise = Promise(document);

                if (nextDocument) {
                    closedPromise = self.openUrlForEditing(nextDocument.url);
                } else if (self.documents.length === 1) {
                    // If this is the last remaining document then hide all
                    // the editors
                    self._editorController.hideEditors();
                }

                return closedPromise.then(function () {
                    editor.close(document);
                    self.removeDocument(document);

                    self.dispatchEventNamed("didCloseDocument", true, false, {
                        document: document,
                        wasCurrentDocument: document === self.currentDocument
                    });
                    return document;
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
                                var moduleId,
                                    objectName;
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
                    throw new Error("Application creation cancelled, closing window");
                }

                // remove trailing slash
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
                var treeExpanded = function (evt) {
                    application.removeEventListener("treeExpanded", treeExpanded, false);
                    var file = self.fileInTreeAtUrl("ui/main.reel");
                    file.associatedDocument = self.currentDocument;
                };

                var openMainReel = function (evt) {
                    self.removeEventListener("didOpenPackage", openMainReel, false);
                    application.addEventListener("treeExpanded", treeExpanded, false);
                    application.dispatchEventNamed("expandTree", true, true, "ui/");
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
                        throw new Error(thing + " creation cancelled");
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

    /**
     * Triggers the creation of a component in the project's `ui` directory
     * It's up to the environment to facilitate this creation
     *
     * @returns {Promise} A Promise for the url of the created component
     */
    createComponent: {
        value: function () {
            var self = this;
            return this._create("component", "ui",
                this.environmentBridge.createComponent.bind(this.environmentBridge)).then(function (componentUrl) {
                    return self.openUrlForEditing(componentUrl).thenResolve(componentUrl);
                });
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
                changeHandler = function (changeType, fileUrl, currentStat, previousStat) {
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
                    if (self.documents && self.documents.length) {
                        self._fileChangesHead = self._fileChangesHead.next = {
                            change: changeType,
                            fileUrl: fileUrl,
                            currentStat: currentStat,
                            previousStat: previousStat,
                            next: null
                        };
                        self.dispatchFileChanges(self.currentDocument);
                    }
                },
                errorHandler = function (err) {
                    throw err;
                };

            this.environmentBridge.watch(this.packageUrl, ["builds/"], changeHandler, errorHandler).done();
        }
    },

    dispatchFileChanges: {
        value: function (document) {
            if (!document || !document.filesDidChange) {
                return;
            }

            var changes = this._lastFileChangeForDocumentMap.get(document, this._fileChangesHead);
            var changeList = [];
            // skip first change as that has already been dispatched to the
            // document
            while (changes = changes.next) {
                changeList.push(changes);
            }
            this._lastFileChangeForDocumentMap.set(document, this._fileChangesHead);
            if (changeList.length) {
                document.filesDidChange(changeList);
            }
        }
    },

    handleFileSystemCreate: {
        value: function (fileUrl, currentStat, previousStat) {
            var parentUrl = fileUrl.substring(0, fileUrl.replace(/\/$/, "").lastIndexOf("/")),
                parent = this.fileInTreeAtUrl(parentUrl),
                newFile;

            if (parent && parent.expanded) {
                newFile = FileDescriptor.create().initWithUrlAndStat(fileUrl, currentStat);
                //TODO account for some sort of sorting at this point?
                parent.children.add(newFile);
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
                child = this.fileInTreeAtUrl(fileUrl);

            parent.children.delete(child);

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
                var descriptor = new FileDescriptor().initWithUrlAndStat(self.packageUrl + "/", {mode: FileDescriptor.S_IFDIR});
                descriptor.root = true;
                descriptor.expanded = true;
                descriptor.children.addEach(fileDescriptors);
                self.files = descriptor;
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
            // Remove any trailing slash
            fileUrl = fileUrl.replace(/\/$/, "");

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

            while (segmentIndex < segmentCount && root.children) {
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

    loadExtensions: {
        value: function () {
            var self = this;
            return Promise.all(this.dependencies.map(function (dependency) {
                return self.environmentBridge.getExtensionsAt(dependency.url);
            }))
            .then(function (extensions) {
                return Promise.all(extensions.flatten().map(function (extensionDetails) {
                    // TODO only load if name is the same as dependency?
                    return self._extensionController.loadExtension(extensionDetails.url)
                    .then(function (extension) {
                        self._extensionController.activateExtension(extension);
                    })
                    .catch(function (error) {
                        console.error("Could not load extension at", extensionDetails.url, "because", error.message);
                    });
                }));
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
