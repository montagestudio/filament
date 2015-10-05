var DocumentController = require("palette/core/document-controller").DocumentController,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application,
    LibraryItem = require("filament-extension/core/library-item").LibraryItem,
    RangeController = require("montage/core/range-controller").RangeController,
    WeakMap = require("montage/collections/weak-map"),
    Map = require("montage/collections/map"),
    SortedSet = require("montage/collections/sorted-set"),
    Confirm = require("matte/ui/popup/confirm.reel").Confirm,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    ProjectController,
    AssetsManager = require("./assets-management/assets-manager").AssetsManager,
    FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    Template = require("montage/core/template").Template,
    Url = require("core/url"),
    ProjectDocument = require("core/project-document").ProjectDocument,
    DocumentDataSource = require("core/document-data-source").DocumentDataSource,
    sandboxMontageApp = require("palette/core/sandbox-montage-app"),
    FileSyncService = require("services/file-sync").FileSyncService,
    semver = require('semver');

var DIRECTORY_STAT = {mode: FileDescriptor.S_IFDIR};
var EMPTY_OBJECT = {};

exports.ProjectController = ProjectController = DocumentController.specialize({

    constructor: {
        value: function ProjectController() {
            this.super();
            this._fileChangesHead = { next: null };
            this._lastFileChangeForDocumentMap = new WeakMap();
            this._filesMap = new Map();
            this._recentDocumentUrls = [];
            this._fileSyncService = new FileSyncService();
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

    previewController: {
        value: null
    },

    _applicationDelegate: {
        value: null
    },

    _projectUrl: {
        value: null
    },

    _filesWatchInstalled: {
        value: false
    },

    /**
     * The document representing this project and its file contents
     * This is the place to push most of the knowledge about the project
     * itself and any API that contents of the project.
     *
     * The projectController currently houses much of this responsibility
     * but should really be focused primarily on bootstrapping an
     * instance of filament with a package, and fetching filament specific
     * content for editing the project.
     */
    projectDocument: {
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

    _packageRequirePromise: {
        value: null
    },

    /**
     * The require used by the package being edited
     */
    _packageRequire: {
        value: null
    },

    /**
     * The controller managing the collection of openDocuments
     */
    openDocumentsController: {
        value: null
    },

    // The tree list of files to present in the package explorer
    files: {
        value: null
    },

    // A map with all files loaded (fileUrl -> file)
    //TODO move into the projectDocument
    _filesMap: {
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

    // A map of documents that are being closed and a promise for them to be closed
    // When the document itself is closed, it is removed from this map
    _documentClosePromiseMap: {
        value: null
    },

    _fileSyncService: {
        value: null
    },

    // INITIALIZATION

    /**
     * Initialize a ProjectController
     *
     * @param {EnvironmentBridge} bridge An environment bridge that normalizes different environment features
     * @param {Object} viewController A controller that manages registration of views that can appear through filament
     * @param {Object} editorController A controller that manages the visible editor stack
     * @param {Object} previewController A controller that manages the preview
     * @return {ProjectController} An initialized instance of a ProjectController
     */
    init: {
        value: function (bridge, viewController, editorController, extensionController, previewController, applicationDelegate) {
            bridge.setDocumentDirtyState(false);

            this._environmentBridge = bridge;
            this._viewController = viewController;
            this._editorController = editorController;
            this._extensionController = extensionController;
            this.previewController = previewController;
            this._applicationDelegate = applicationDelegate;

            this._documentDataSource = new DocumentDataSource(bridge);

            this._moduleIdIconUrlMap = new Map();
            this._moduleIdLibraryItemMap = new Map();
            this._packageNameLibraryItemsMap = new Map();

            this._documentClosePromiseMap = new WeakMap();
            this._documentTypeUrlMatchers = [];
            this._urlMatcherDocumentTypeMap = new WeakMap();
            this._editorTypeInstanceMap = new WeakMap();
            this._editorTypeDocumentTypeMap = new WeakMap(); // TODO: another to many map, they must be a better way

            this.openDocumentsController = RangeController.create().initWithContent(this.documents);
            this.assetsManager = new AssetsManager(this);

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

    _packageRequires: {
        value: {}
    },
    getPackageRequire: {
        value: function(packageUrl) {
            if (!this._packageRequires[packageUrl]) {
                this._packageRequires[packageUrl] = sandboxMontageApp(packageUrl)
                .spread(function (packageRequire) {
                    return packageRequire;
                });
            }

            return this._packageRequires[packageUrl];
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
            this.assetsManager.projectUrl = url;

            return self.environmentBridge.projectInfo(url).then(function (projectInfo) {
                return self._openProject(projectInfo.packageUrl, projectInfo.dependencies);
            })
            .then(function() {
                self._applicationDelegate.updateStatusMessage("Loading package…");
                return self._packageRequirePromise;
            });
        }
    },

    _openProject: {
        value: function (packageUrl, dependencies) {
            var self = this;

            if (packageUrl[packageUrl.length - 1] !== '/') {
                packageUrl += '/';
            }

            this.dispatchEventNamed("willOpenPackage", true, false, {
                packageUrl: packageUrl
            });

            this._packageRequirePromise = this.getPackageRequire(packageUrl)
            .then(function(packageRequire) {
                self._packageRequire = packageRequire;

                application.addEventListener("dependencyInstalled", self);
                application.addEventListener("dependencyRemoved", self);

                return packageRequire;
            });
            this.packageUrl = packageUrl;
            this.dependencies = dependencies;

            var packagePromise = this.environmentBridge.read(this.packageUrl + "package.json").then(function (content) {
                var packageDescription = JSON.parse(content);

                self.loadProjectIcon(self.packageUrl);
                self.packageDescription = packageDescription;

                // Add a dependency entry for this package so that the
                // we pick up its extensions and components later
                self.dependencies.unshift({
                    dependency: packageDescription.name,
                    url: self.packageUrl
                });
                return ProjectDocument.load(self, self.environmentBridge)
                    .then(function(projectDocument) {
                        self.projectDocument = projectDocument;
                    });
            });

            // Do these operations sequentially because populateLibrary and
            // watchForFileChanges send a lot of data across the websocket,
            // preventing the file list from appearing in a timely manner.
            return Promise.all([this.populateFiles(), packagePromise])
                .then(function () {

                    // Expand the ui directory by default, it;'s usually the first thing we open
                    application.dispatchEventNamed("expandTree", true, true, "ui/");

                    //likewise while it's nice to know the type, that can come in shortly,
                    // we can rely on heuristics until the mimetype is known
                    // TODO if it's fast enough in practice though we might want to wait for this
                    var immediateChildren = self.files.children;
                    immediateChildren.forEach(function (fd) {
                        self.environmentBridge.detectMimeTypeAtUrl(fd.fileUrl).then(function (mimeType) {
                            fd.mimeType = mimeType;
                        }).done();
                    });

                    // need these before getting the library items
                    return self.loadExtensionsFromDependencies();
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

            // Use a default icon
            this.icon = this.icon || "/assets/img/app-icon.png";

            require.read(projectUrl + "index.html").then(function(indexHtml) {
                var sizes = [],
                    icons,
                    doc,
                    template;

                template = Template.create();
                doc = template.createHtmlDocumentWithHtml(indexHtml);

                // Use Apple touch or Android shortcut icon as the project icon, if present
                icons = Array.prototype.slice.call(doc.querySelectorAll('link[rel="apple-touch-icon-precomposed"]'))
                    .concat(Array.prototype.slice.call(doc.querySelectorAll('link[rel="apple-touch-icon"]')))
                    .concat(Array.prototype.slice.call(doc.querySelectorAll('link[rel="shortcut icon"]')));
                for (var icon in icons) {
                    if (icons.hasOwnProperty(icon)) {
                        var href = icons[icon].getAttribute("href");
                        if (!href) {
                            continue;
                        }
                        var size = icons[icon].getAttribute("sizes") || "9999x9999";
                        sizes.push({
                            size: parseInt(size.split("x")[0], 10),
                            href: href
                        });
                    }
                }
                if (sizes.length > 0) {
                    /* sort to have the smallest which is larger than 56px in position 0 */
                    sizes.sort(function(a, b) {
                        if (!a.href || a.size < 56) {
                            return false;
                        }
                        return (a.size - b.size);
                    });
                    self.icon = projectUrl + sizes[0].href;
                } else {
                    /* if no touch icons are present, but a favicon is, use it */
                    require.read(projectUrl + "favicon.ico").then(function() {
                        self.icon = projectUrl + "favicon.ico";
                    });
                }

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

    _editorTypeDocumentTypeMap: {
        value: null
    },

    registerUrlMatcherForDocumentType: {
        value: function (urlMatcher, documentType) {
            var editorType,
                editor;

            if (!(documentType && urlMatcher)) {
                throw new Error("Both a document type and a url matcher are needed to register");
            }

            if (this._urlMatcherDocumentTypeMap.has(urlMatcher)) {
                throw new Error("Already has this url matcher registered for a document type");
            }
            editorType = documentType.editorType;
            //TODO use one data structure for both of these
            this._documentTypeUrlMatchers.push(urlMatcher);
            this._urlMatcherDocumentTypeMap.set(urlMatcher, documentType);
            this._editorTypeDocumentTypeMap.set(editorType, documentType);

            if (editorType.requestsPreload) {
                editor = this._getEditor(editorType);
                this._applicationDelegate.updateStatusMessage("Loading editor…");
                editor.preload().done();
                this._editorController.preloadEditor(editor);
            }
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
            var documentTypes = this.documentTypesForUrl(url);

            return documentTypes[documentTypes.length - 1];
        }
    },

    /**
     * The document prototypes possible to use for the specified url
     * @override
     */
    documentTypesForUrl: {
        value: function (url) {
            var self = this,
                matchResults = this._documentTypeUrlMatchers.filter(function (matcher) {
                    return matcher(url) ? matcher : false;
                });

            return matchResults.map(function (match) {
                return self._urlMatcherDocumentTypeMap.get(match);
            });
        }
    },

    _getEditor: {
        value: function(editorType) {
            var editor = this._editorTypeInstanceMap.get(editorType);

            if (!editor) {
                editor = new editorType();
                //TODO formalize exactly what we pass along to the editors
                // Most of this right here is simply for the componentEditor
                editor.projectController = this;
                editor.viewController = this._viewController;
                this._editorTypeInstanceMap.set(editorType, editor);
            }

            return editor;
        }
    },

    createDocumentWithTypeAndUrl: {
        value: function (documentType, url) {
            return new documentType().init(url, this._documentDataSource, this._packageRequire);
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
            var fileUrl = Url.resolve(this.projectUrl + "/", moduleId + (/\.reel$/.test(moduleId) ? "/" : ""));
            this.openUrlForEditing(fileUrl).done();
        }
    },

    _recentDocumentUrls: {
        value: null
    },

    /**
     * The list of urls we have opened in within the editor recently
     * There may or may not be a document currently open or available
     * for these urls
     * TODO maintain a maximum length
     */
    recentDocumentUrls: {
        get: function () {
            return this._recentDocumentUrls;
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
        value: function (fileUrl, editorType) {
            var self = this,
                editor,
                alreadyOpenedDoc,
                documentType,
                lastDocument = this.currentDocument,
                recentUrlIndex;

            // Document is the current document and is being edited by the same editor
            if (    lastDocument &&
                    fileUrl === lastDocument.url &&
                    !editorType &&
                    lastDocument.editor.constructor === editorType ) {
                return Promise.resolve(lastDocument);
            }

            // Find editor to make frontmost
            alreadyOpenedDoc = this.documentForUrl(fileUrl);

            if (alreadyOpenedDoc) {
                if (editorType && alreadyOpenedDoc.editor.constructor !== editorType) {
                    // Close the document before opening it in a different editor
                    return this.closeDocument(alreadyOpenedDoc)
                        .then(function (closeAccepted) {
                            if (closeAccepted) {
                                return self.openUrlForEditing(fileUrl, editorType);
                            } else {
                                return Promise.resolve(lastDocument);
                            }
                        });
                } else {
                    editorType = alreadyOpenedDoc.constructor.editorType;
                }
            } else if (editorType) {
                // Use the documentType associated with the given editorType
                documentType = this._editorTypeDocumentTypeMap.get(editorType);
            } else {
                documentType = this.documentTypeForUrl(fileUrl);
                editorType = documentType ? documentType.editorType : null;
            }

            if (editorType) {
                editor = this._getEditor(editorType);

                this._editorController.bringEditorToFront(editor);
                this.currentEditor = editor;

                this.dispatchEventNamed("willOpenDocument", true, false, {
                    url: fileUrl,
                    alreadyOpened: !!alreadyOpenedDoc,
                    editor: editor
                });

                // Track the urls we've tried to open for history browsing;
                // we don't necessarily acknowledge opening documents as that can take a while
                // and can be interrupted, so the list is of urls in the order we asked to open them
                this.dispatchBeforeOwnPropertyChange("recentDocumentUrls", self.recentDocumentUrls);
                recentUrlIndex = this._recentDocumentUrls.indexOf(fileUrl);
                if (recentUrlIndex > -1) {
                    this._recentDocumentUrls.splice(recentUrlIndex, 1);
                }
                this._recentDocumentUrls.unshift(fileUrl);
                this.dispatchOwnPropertyChange("recentDocumentUrls", self.recentDocumentUrls);

                return this.openUrl(fileUrl, documentType).then(function (doc) {
                    self.dispatchEventNamed("didOpenDocument", true, false, {
                        document: doc,
                        isCurrentDocument: doc === self.currentDocument,
                        alreadyOpened: !!alreadyOpenedDoc
                    });
                    if (doc.codeMirrorDocument) {
                        doc.codeMirrorDocument.on("change", function() {
                            self.codeMirrorDocumentDidChange();
                        });
                    }
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

    selectDocument: {
        value: function(document) {
            this.openDocumentsController.selection = [document];
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
        value: function (editingDocument) {
            if (!this._urlDocumentMap.get(editingDocument.url)) {
                return Promise.reject(new Error("Cannot close a document that is not open"));
            }

            var closePromise = this._documentClosePromiseMap.get(editingDocument),
                self = this,
                deferredClosedDocument,
                canCloseMessage,
                deferredAcceptClose,
                confirmCloseDialogOptions;

            if (!closePromise) {

                // We're not already closing this document; flag it as such
                // and then start trying to close it
                deferredClosedDocument = Promise.defer();
                closePromise = deferredClosedDocument.promise;
                this._documentClosePromiseMap.set(editingDocument, deferredClosedDocument.promise);

                canCloseMessage = this.canCloseDocument(editingDocument, editingDocument.url);
                deferredAcceptClose = Promise.defer();

                if (canCloseMessage) {
                    // TODO PJYF This needs to be localized.
                    confirmCloseDialogOptions = {
                        message: canCloseMessage + " Are you sure you want to close that document?",
                        okLabel: "Close",
                        cancelLabel: "Cancel"
                    };

                    Confirm.show(confirmCloseDialogOptions, function () {
                        deferredAcceptClose.resolve(true);
                    }, function () {
                        deferredAcceptClose.resolve(false);
                    });

                } else {
                    deferredAcceptClose.resolve(true);
                }

                deferredAcceptClose.promise.then(function (closeAccepted) {
                    var editorType = editingDocument.constructor.editorType,
                        editor = self._editorTypeInstanceMap.get(editorType),
                        nextDocument = null,
                        readyToClosePromise,
                        wasCurrentDocument = editingDocument === self.currentDocument;

                    if (!closeAccepted) {
                        readyToClosePromise = Promise(null);
                    } else {

                        if (wasCurrentDocument) {
                            nextDocument = self._nextDocument(editingDocument);
                        }

                        self.dispatchEventNamed("willCloseDocument", true, false, {
                            document: editingDocument,
                            isCurrentDocument: wasCurrentDocument
                        });

                        readyToClosePromise = Promise(editor);
                        if (nextDocument) {
                            readyToClosePromise = self.openUrlForEditing(nextDocument.url)
                                .thenResolve(editor);

                        } else if (self.documents.length === 1) {
                            // If this is the last remaining document then hide all
                            // the editors
                            self._editorController.hideEditors();
                        }
                    }
                    return readyToClosePromise;
                })
                .then(function (editor) {
                    if (editor && editingDocument) {
                        editor.close(editingDocument);
                        self.removeDocument(editingDocument);
                        editingDocument.destroy();

                        self.dispatchEventNamed("didCloseDocument", true, false, {
                            document: editingDocument,
                            wasCurrentDocument: editingDocument === self.currentDocument
                        });

                        deferredClosedDocument.resolve(editingDocument);
                    } else {
                        deferredClosedDocument.resolve(null);
                    }
                })
                .fail(function (error) {
                    deferredClosedDocument.reject(error);
                })
                .then(function () {
                    //Either we closed, cancelled, or failed: we're not still closing though
                    self._documentClosePromiseMap.delete(editingDocument);
                })
                .done();
            }

            return closePromise;

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

    _getDocumentPlus: {
        value: function (n) {
            var editingDocuments = this.openDocumentsController.organizedContent,
                docIndex = editingDocuments.indexOf(this.currentDocument),
                nextDocIndex = docIndex + n;

            if (nextDocIndex > editingDocuments.length - 1) {
                nextDocIndex = 0;
            } else if (nextDocIndex < 0) {
                nextDocIndex = editingDocuments.length - 1;
            }

            return editingDocuments[nextDocIndex];
        }
    },

    canCloseAllDocuments: {
        value: function () {
            return this.documents.every(function (document) {
                return !document.isDirty;
            });
        }
    },

    handlePathChange: {
        value: function (value, path, object) {
            switch (path) {
            case "currentDocument.undoManager.undoCount":
                this.environmentBridge.setDocumentDirtyState(null != value && value > 0);
                break;
            }
        }
    },

    canLaunchPreview: {
        value: true
    },

    handleMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail;

            switch (menuItem.identifier) {
            case "newComponent":
                evt.stop();

                menuItem.enabled = this.canCreateComponent;
                break;
            case "newModule":
                evt.stop();

                menuItem.enabled = this.canCreateModule;
                break;
            case "launchPreview":
                evt.stop();

                menuItem.enabled = this.canLaunchPreview;
                break;
            case "save":
                evt.stop();
                menuItem.enabled = this.projectDocument.isProjectDirty;
                break;
            case "closeFile":
                evt.stop();

                menuItem.enabled = !!this.currentDocument;
                break;
            }
        }
    },

    /* jshint -W074 */
    handleMenuAction: {
        enumerable: false,
        value: function (evt) {
            switch (evt.detail.identifier) {
            case "newComponent":
                evt.stop();

                if (this.canCreateComponent) {
                    this.createComponent().done();
                }
                break;
            case "newModule":
                evt.stop();

                if (this.canCreateModule) {
                    this.createModule().done();
                }
                break;
            case "launchPreview":
                evt.stop();

                if (this.canLaunchPreview) {
                    this.openPreview();
                }
                break;
            case "closeProject":
                evt.stop();

                this.closeProject();
                break;
            case "selectNextDocument":
                evt.stop();

                this.openUrlForEditing(this._getDocumentPlus(1).url).done();
                break;
            case "selectPreviousDocument":
                evt.stop();

                this.openUrlForEditing(this._getDocumentPlus(-1).url).done();
                break;
            case "closeFile" :
                evt.stop();

                if (this.currentDocument) {
                    this.closeDocument(this.currentDocument).done();
                }
                break;
            }
        }
    },
    /* jshint +W074 */

    openPreview: {
        value: function () {
            this.environmentBridge.openHttpUrl(this.previewController.previewUrl).done();
        }
    },

    _isLibraryItemValidForDependencyVersion: {
        value: function (libraryItem, dependencyVersion) {
            var isValid;
            var libraryItemRange = this._buildVersionsRangeString(libraryItem);
            var dependencyRange = semver.validRange(dependencyVersion);
            if (dependencyRange === null) {
                isValid = true;
            } else if (semver.valid(dependencyVersion) !== null) {
                isValid = semver.satisfies(dependencyVersion, libraryItemRange);
            } else {
                var dependencyConstraints = dependencyRange.split(' ');
                var matchedConstraints = dependencyConstraints.filter(function (constraint) {
                    var equalPosition = constraint.indexOf('=');
                    if (equalPosition !== -1) {
                        return semver.satisfies(constraint.substr(equalPosition + 1).split('-')[0], libraryItemRange);
                    } else {
                        if (constraint.charAt(0) === '<') {
                            return libraryItem.minVersion ? semver.gt(constraint.substr(1), libraryItem.minVersion) : true;
                        } else if (constraint.charAt(0) === '>') {
                            return libraryItem.maxVersion ? semver.lt(constraint.substr(1), libraryItem.maxVersion) : true;
                        }
                        return true;
                    }
                });
                isValid = matchedConstraints.length == dependencyConstraints.length;
            }
            return isValid;
        }
    },

    //TODO cache this promise, clear cache when we detect a change?
    findLibraryItems: {
        enumerable: false,
        value: function (dependencies) {
            var self = this;

            // library is either being created for the first time or updated due to changes.
            // for each dependency we need to collect library items by way of:
            // a) make a best guess at creating library items on the fly
            // b) using the library items provided by an extension
            // c) some mix of both

            // Right now we're using both A and B, not C

            // TODO improve this to react better to filesystem changes, extension activation/deactivation etc.
            // TODO rename most of this to simply refer to "package" not necessarily dependencies

            return Promise.all(dependencies.map(function (dependencyInfo) {
                var packageUrl = (/\/$/.test(dependencyInfo.url))? dependencyInfo.url : dependencyInfo.url + "/",
                    packageName = dependencyInfo.dependency,
                    isProjectPackage = !/\/node_modules\//.test(packageUrl),
                    packageLibraryItems = self._packageNameLibraryItemsMap.get(packageName),
                    promisedLibraryItems;

                var dependencyLibraryEntry = {
                    dependency: packageName
                };

                if (isProjectPackage) {
                    // Finds Library items inside the project UI folder
                    promisedLibraryItems = self._findAndAddLibraryItemsForPackageUrl(packageUrl, packageName);
                } else if (!packageLibraryItems) {
                    // Finds Library items within the node_module folder either through extensions or not
                    promisedLibraryItems = self.environmentBridge.getExtensionsAt(packageUrl).then(function (extensions) {
                        if (extensions && extensions.length) {
                            // Finds Library items in extensions
                            return self.loadExtensionsFromDependency(extensions);
                        } else {
                            // Finds Library items inside the package's UI folder
                            return self._findAndAddLibraryItemsForPackageUrl(packageUrl, packageName);
                        }
                    });
                } else {
                    //TODO is there a reason we didn't share the same array before?
                    promisedLibraryItems = Promise.resolve(packageLibraryItems);
                }

                self._applicationDelegate.updateStatusMessage("Loading library…");
                return promisedLibraryItems.then(function (libraryItems) {
                    dependencyLibraryEntry.libraryItems = libraryItems.filter(function(libraryItem) {
                        var dependencyVersion = dependencyInfo.version;
                        return self._isLibraryItemValidForDependencyVersion(libraryItem, dependencyVersion);
                    });
                    return dependencyLibraryEntry;
                });
            }));
        }
    },

    _buildVersionsRangeString: {
        value: function(libraryItem) {
            var range;
            var minVersion = libraryItem.minVersion,
                maxVersion = libraryItem.maxVersion;
            if (minVersion || maxVersion) {
                var lowerBound = minVersion ? '>=' + minVersion : '';
                var upperBound = maxVersion ? '<' + maxVersion : '';
                range = (lowerBound + ' ' + upperBound).trim();
            } else {
                range = '*';
            }
            return range;
        }
    },

    /**
     * Factorise search and addition of Library items from a package
     */
    _findAndAddLibraryItemsForPackageUrl: {
        value: function (packageUrl, packageName) {
            var self = this;

            return this._findLibraryItemsForPackageUrl(packageUrl, packageName)
                .then(function (libraryItems) {
                    // Add entry for ths package we previously had no entries for, if we find any
                    libraryItems.forEach(function (item) {
                        self.addLibraryItemToPackage(item, packageName);
                    });

                    return libraryItems;
                });
        }
    },

    /**
     * Intended for use only when libraryItems were not found for the specified package,
     * this will explore the package and build libraryItems on the fly for each component
     * found in the UI directory.
     *
     * Eventually we should improve the heuristic on what we're willing to build libraryItems
     * for, and additionally, provide some way to vary how they're built.
     *
     * Typically, this is used to expose the components inside the package being edited
     * as no extensions is providing the libraryItems. In the future though, we might do
     * this exploration and construction elsewhere, ahead of time, in keeping more with
     * how we find libraryItems provided by extensions earlier; I'm not crazy about the
     * projectController doing all this. We'll likely need a libraryController eventually.
     */
    _findLibraryItemsForPackageUrl: {
        value: function (packageUrl, packageName) {
            var self = this,
                promisedLibraryItems;

            return this.environmentBridge.componentsInPackage(packageUrl).then(function (componentUrls) {
                if (componentUrls) {
                    promisedLibraryItems = Promise.all(componentUrls.map(function (componentUrl) {

                        var moduleId,
                            objectName;

                        if (/\/node_modules\//.test(componentUrl)) {
                            // It's a module inside a node_modules dependency
                            //TODO be able to handle dependencies from mappings?
                            moduleId = packageName + "/" + Url.toModuleId(componentUrl, packageUrl);
                        } else {
                            // It's a module that's part of the current package being edited
                            moduleId = Url.toModuleId(componentUrl, packageUrl);
                        }
                        objectName = MontageReviver.parseObjectLocationId(moduleId).objectName;
                        return self._libraryItemForModuleId(moduleId, objectName);
                    })).then(function (libraryItems) {
                        // Remove falsey libraryItems
                        return libraryItems.filter(function (libraryItem) {
                            return libraryItem;
                        });
                    });
                } else {
                    promisedLibraryItems = Promise.resolve([]);
                }

                return promisedLibraryItems;
            });
        }
    },

    _moduleIdLibraryItemMap: {
        enumerable: false,
        value: null
    },

    /**
     * This currently finds libraryItems if they've been created to represent the
     * specified moduleId, or creates one if we don't have one already.
     *
     * This is usually only invoked for modules inside packages that we have no
     * libraryItems for already.
     * @see _findLibraryItemsForPackageUrl
     */
    _libraryItemForModuleId: {
        value: function (moduleId, objectName) {

            var libraryItem = this._moduleIdLibraryItemMap.get(moduleId),
                promisedLibraryItem,
                montageId,
                serializationFragment,
                htmlFragment;

            if (!libraryItem && (/ui\//).test(moduleId)) {
                // TODO this regex is not exactly how we'll want this done in the future but it keeps things from getting too cluttered

                montageId = objectName.replace(/(^.)/, function (_, firstChar) {
                    return firstChar.toLowerCase();
                });

                //TODO move fragment generation elsewhere so it can be varied
                serializationFragment = {
                    prototype: moduleId,
                    properties: {
                        element: {"#": montageId}
                    }
                };

                htmlFragment = '<div data-montage-id="' + montageId + '"></div>';

                return this._buildLibraryItemTemplate(montageId, serializationFragment, htmlFragment).then(function (template) {
                    libraryItem = new LibraryItem();
                    libraryItem.templateContent = template.html;
                    libraryItem.name = objectName;
                    //TODO well this can't be hardcoded
                    libraryItem.iconUrl = document.baseURI + "/assets/img/library-icon.png";
                    return libraryItem;
                });
            } else {
                promisedLibraryItem = Promise.resolve(libraryItem);
            }

            return promisedLibraryItem;
        }
    },

    //TODO the division of labor between this and _libraryItemForModuleId needs to be sorted out
    _buildLibraryItemTemplate: {
        value: function (label, serializationFragment, htmlFragment) {

            var templateBasePromise = require.async("core/base-template.html"),
                templateSerialization = {},
                serializationElement,
                self = this;

            templateSerialization[label] = serializationFragment;

            return templateBasePromise.then(function (result) {

                var doc = document.implementation.createHTMLDocument("");
                doc.documentElement.innerHTML = result.content;

                serializationElement = doc.querySelector("script[type='text/montage-serialization']");
                serializationElement.appendChild(document.createTextNode(JSON.stringify(templateSerialization)));

                if (htmlFragment) {
                    doc.body.innerHTML = htmlFragment;
                }

                return Template.create().initWithDocument(doc, self._packageRequire);
            });
        }
    },

    _packageNameLibraryItemsMap: {
        value: null
    },

    addLibraryItemToPackage: {
        value: function (libraryItem, packageName) {

            var libraryItems = this._packageNameLibraryItemsMap.get(packageName);

            if (!libraryItems) {
                libraryItems = [];
                this._packageNameLibraryItemsMap.set(packageName, libraryItems);
            }

            libraryItems.push(libraryItem);
        }
    },

    // A map of moduleId to iconUrls
    // Each entry is a collection of iconUrls that have been offered for the moduleId
    _moduleIdIconUrlMap: {
        value: null
    },

    /**
     * Add the specified iconUrl as a valid icon to represent the
     * specified moduleId
     */
    addIconUrlForModuleId: {
        value: function (iconUrl, moduleId) {
            var registeredIconUrls = this._moduleIdIconUrlMap.get(moduleId);

            if (!registeredIconUrls) {
                registeredIconUrls = new SortedSet();
                this._moduleIdIconUrlMap.set(moduleId, registeredIconUrls);
            }

            registeredIconUrls.add(iconUrl);
        }
    },

    /**
     * Remove the specified iconUrl as a valid icon to represent the
     * specified moduleId
     */
    removeIconUrlForModuleId: {
        value: function (iconUrl, moduleId) {
            var registeredIconUrls = this._moduleIdIconUrlMap.get(moduleId);

            if (registeredIconUrls) {
                registeredIconUrls.delete(iconUrl);
            }
        }
    },

    iconUrlForModuleId: {
        value: function (moduleId) {
            var iconUrls = this._moduleIdIconUrlMap.get(moduleId),
                iconUrl;

            if (iconUrls && iconUrls.length > 0) {
                iconUrl = iconUrls.one();
            } else {
                iconUrl = document.baseURI + "/assets/img/library-icon.png";
            }

            return iconUrl;
        }
    },

    closeProject: {
        value: function () {
            document.location.href = "/";
        }
    },

    save: {
        value: function () {

            var self = this,
                bridge = this.environmentBridge,
                savePromise;

            if (this.projectDocument && this.projectDocument.isProjectDirty) {
                this.dispatchEventNamed("willSaveProject", true, false);

                savePromise = this.projectDocument.saveAll()
                    .then(function (result) {

                        if (bridge && typeof bridge.setDocumentDirtyState === "function") {
                            self.environmentBridge.setDocumentDirtyState(false);
                        }

                        self.dispatchEventNamed("didSaveProject", true, false);
                        return result;
                    });
            }

            return Promise(savePromise);
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
                    self.dispatchEventNamed("openUrl", true, true, self.packageUrl + "ui/main.reel/");
                };

                self.addEventListener("didOpenPackage", openMainReel, false);
                return applicationUrl;
            });
        }
    },

    _create: {
        value: function (thing, subdirectory, fn) {
            if (!this.canEdit) {
                throw new Error("Cannot create " + thing + " without an open project"); // TODO localize
            }

            var defaultDirectory = (subdirectory)? Url.resolve(this.packageUrl, subdirectory) : this.packageUrl,
                options = {
                    defaultDirectory: defaultDirectory.replace(/\/$/, ""),
                    defaultName: "my-" + thing, // TODO localize
                    prompt: "Create " + thing, //TODO localize
                    submitLabel: "Create"
                },
                self = this;

            return this.environmentBridge.promptForSave(options)
                .then(function (destination) {
                    if (!destination) {
                        return Promise.resolve(null);
                    }
                    // remove trailing slash
                    destination = destination.replace(/\/$/, "");
                    var destinationDividerIndex = destination.lastIndexOf("/"),
                        name = destination.substring(destinationDividerIndex + 1),
                    //TODO complain if packageHome does not match this.packageUrl?
                        packageHome = self.packageUrl,
                        relativeDestination = destination.substring(self.packageUrl.length, destinationDividerIndex),
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
        value: function (path) {
            var self = this,
                projectDocument = this.projectDocument;

            path = (path)? path.replace(/^\//, "").replace(/\/$/, "") : "ui";
            return this._create("component", path, projectDocument.createComponent.bind(projectDocument))
                .then(function (url) {
                    var result;
                    if (url) {
                        result = self.openUrlForEditing(url).thenResolve(url);
                    }
                    return Promise(result);
                });
        }
    },

    canCreateModule: {
        get: function () {
            return this.canEdit;
        }
    },

    createModule: {
        value: function (path) {
            var self = this,
                projectDocument = this.projectDocument;

            path = (path)? path.replace(/^\//, "").replace(/\/$/, "") : undefined;
            return this._create("module", path, projectDocument.createModule.bind(projectDocument))
                .then(function (url) {
                    var result;
                    if (url) {
                        result = self.openUrlForEditing(url).thenResolve(url);
                    }
                    return Promise(result);
                });
        }
    },

    canAddDirectory: {
        get: function () {
            return this.canEdit;
        }
    },

    addDirectory: {
        value: function (path) {
            var self = this,
                defaultDirectory = (path)? Url.resolve(this.packageUrl, path) : this.packageUrl,
                options = {
                    defaultDirectory: defaultDirectory,
                    defaultName: "Untitled Folder", // TODO localize
                    prompt: "Create Folder", // TODO localize
                    submitLabel: "Create"
                };

            return this.environmentBridge.promptForSave(options)
                .then(function (destination) {
                    if (!destination) {
                        return Promise.resolve(null);
                    }
                    destination += '/';
                    destination = self._cleanupDestination(destination);
                    return self.projectDocument.makeTree(destination)
                        .then(function() {
                            self.handleFileSystemCreate(destination, DIRECTORY_STAT);
                        });
                });
        }
    },

    newFile: {
        value: function (path) {
            var self = this,
                defaultDirectory = (path)? Url.resolve(this.packageUrl, path) : this.packageUrl,
                options = {
                    defaultDirectory: defaultDirectory,
                    defaultName: "untitled", // TODO localize
                    prompt: "Create file", // TODO localize
                    submitLabel: "Create"
                };

            return this.environmentBridge.promptForSave(options)
                .then(function (destination) {
                    if (!destination) {
                        return Promise.resolve(null);
                    }

                    destination = self._cleanupDestination(destination);
                    return self.projectDocument.touch(destination).then(function () {
                        self.handleFileSystemCreate(destination, EMPTY_OBJECT);
                        self.openUrlForEditing(destination).done();
                    });
                });
        }
    },


    _cleanupDestination: {
        value: function(destination) {
            var oldValue = '//',
                lastIndex = destination.lastIndexOf(oldValue),
                firstIndex = destination.indexOf(oldValue);
            while (lastIndex > firstIndex) {
                destination = destination.slice(0,lastIndex) + destination.slice(lastIndex+1);
                lastIndex = destination.lastIndexOf(oldValue);
            }
            return destination;
        }
    },

    canRemoveTree: {
        get: function () {
            return this.canEdit;
        }
    },

    removeTree: {
        value: function (path) {
            var self = this;
            return this.projectDocument.removeTree(path)
                .then(function() {
                    self.handleFileSystemDelete(Url.resolve(self.packageUrl, path), null, EMPTY_OBJECT);
                });
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

            var changes = this._lastFileChangeForDocumentMap.get(document);
            var changeList = [];
            if (changes) {
                // skip first change as that has already been dispatched to the
                // document
                while (changes = changes.next) {
                    changeList.push(changes);
                }
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
                parent = this.fileInTreeAtUrl(parentUrl) || this.files,
                newFile, oldFile;

            if (parent && parent.expanded) {
                newFile = FileDescriptor.create().initWithUrlAndStat(fileUrl, currentStat);
                if (parent.children.has(newFile)) {
                    oldFile = this.fileInTreeAtUrl(fileUrl);
                    parent.children.delete(oldFile);
                    this.dispatchEventNamed("fileSystemChange", true, false, {
                        change: "delete",
                        fileUrl: fileUrl,
                        currentStat: currentStat,
                        previousStat: previousStat
                    });
                }
                parent.children.add(newFile);
                this._storeFile(newFile);
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

            if (parent && parent.expanded) {
                parent.children.delete(child);
                this._evictFile(child);
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
                var descriptor = new FileDescriptor().initWithUrlAndStat(self.packageUrl + "/", {mode: FileDescriptor.S_IFDIR});
                descriptor.root = true;
                descriptor.expanded = true;
                descriptor.children.addEach(fileDescriptors);
                self.files = descriptor;
            }).then(function() {
                if (!self._filesWatchInstalled) {
                    self._filesWatchInstalled = true;
                    // don't need to wait for this to complete
                    self.watchForFileChanges();
                }
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

            while (segmentIndex < segmentCount && root && root.children) {
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
            var self = this,
                filesMap = this._filesMap;

            return this.environmentBridge.list(url)
            .then(function(files) {
                for (var i = 0, file; (file = files[i]); i++) {
                    if (!filesMap.has(file.fileUrl)) {
                        self._storeFile(file);
                    }
                }
                return files;
            });
        }
    },

    /**
     * Gets a map of all the files in the project.
     */
    getFilesMap: {
        value: function() {
            var self = this,
                filesMap = this._filesMap;

            return this.environmentBridge.listTreeAtUrl(this.projectUrl)
            .then(function(files) {
                for (var i = 0, file; (file = files[i]); i++) {
                    var fileUrl = file.fileUrl;
                    if (!filesMap.has(fileUrl)) {
                        self._storeFile(file);
                        // Wire the tree
                        var parentUrl = fileUrl.substring(0, fileUrl.replace(/\/$/, "").lastIndexOf("/") + 1);
                        var parent = filesMap.get(parentUrl);
                        if (parent) {
                            parent.expanded = true;
                            parent.children.add(file);
                        }
                    }
                }
                return filesMap;
            });
        }
    },

    /**
     * Stores the file in the files map.
     */
    _storeFile: {
        value: function(file) {
            file.filename = file.fileUrl.slice(this.projectUrl.length);
            this._filesMap.set(file.fileUrl, file);
        }
    },

    /**
     * Evicts the file from the files map.
     */
    _evictFile: {
        value: function(file) {
            this._filesMap.delete(file.fileUrl);
        }
    },

    loadExtensionsFromDependency: {
        value: function (extensions) {
            var self = this;
            return Promise.all(extensions.map(function (extensionUrl) {
                // TODO only load if name is the same as dependency?
                return self._extensionController.loadExtension(extensionUrl)
                .then(function (extension) {
                    return self._extensionController.activateExtension(extension);
                })
                .catch(function (error) {
                    console.error("Could not load extension at", extensionUrl, "because", error.message);
                });
            }));
        }
    },

    /**
     * Load extensions provided by dependencies
     * @returns {Promise} A promise for the extensions to have been activated
     */
    loadExtensionsFromDependencies: {
        value: function () {
            var self = this;
            return Promise.all(this.dependencies.map(function (dependency) {
                return self.environmentBridge.getExtensionsAt(dependency.url);
            }))
            .then(function (extensions) {
                return self.loadExtensionsFromDependency(extensions.flatten());
            });
        }
    },

    handleDependencyInstalled: {
        value: function (evt) {
            // TODO It seems like it might be safer to make sure this is coordinated
            // with the setting of the dependencies that triggers adding to the library
            this._packageRequire.injectDependency(evt.detail.installed.requestedName);
        }
    },

    handleDependencyRemoved: {
        value: function(evt) {
            // TODO remove the dependency
        }
    },

    populateLibrary: {
        enumerable: false,
        value: function () {
            var self = this;

            // Make sure this package is in the dependencies
            var packageDependency = this.dependencies.filter(function (e) {
                return e.dependency === self.packageDescription.name;
            });
            if (packageDependency && !packageDependency.length) {
                this.dependencies.unshift({
                    dependency: this.packageDescription.name,
                    url: this.packageUrl
                });
            }

            //TODO I'm not quite sure why this method exists, though it does divide finding from populating...
            return this.findLibraryItems(this.dependencies).then(function (dependencyLibraryEntries) {
                self.libraryGroups = dependencyLibraryEntries;
            });
        }
    },

    _ensureFileIsSynced: {
        value: function() {
            if (!this._fileSyncService.isInSync(this.currentDocument)) {
                this.currentDocument.isDirty = true;
            }
        }
    },

    codeMirrorDocumentDidChange: {
        value: function() {
            this._ensureFileIsSynced();
        }
    }
});
