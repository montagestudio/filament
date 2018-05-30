var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    track = require("track"),
    application = require("montage/core/application").application,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    ViewController = require("core/view-controller").ViewController,
    PreviewController = require("core/preview-controller").PreviewController,
    ExtensionController = require("core/extension-controller").ExtensionController,
    ProjectController = require("core/project-controller").ProjectController,
    ReelDocument = require("core/reel-document").ReelDocument,
    Document = require("palette/core/document").Document,
    repositoriesController = require("core/repositories-controller").repositoriesController;

// Browser Compatibility
require("core/compatibility");

exports.Workbench = Component.specialize({

    extensionController: {
        value: null
    },

    previewController: {
        value: null
    },

    projectController: {
        value: null
    },

    viewController: {
        value: null
    },

    editorSlot: {
        value: null
    },

    preloadSlot: {
        value: null
    },

    constructor: {
        value: function Workbench() {
            this._editorsToInsert = [];
            this._openEditors = [];

            this.addPathChangeListener("projectController.currentDocument.title", this, "handleTitleWillChange", true);
            this.addPathChangeListener("projectController.currentDocument.title", this, "handleTitleChange");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var self = this,
                preloadDocument;

            if (firstTime) {
                this._initializeListeners();
                // Ensure that the currentEditor is considered the nextTarget before the application
                //TODO should probably be the document
                self.defineBinding("nextTarget", {"<-": "projectController.currentEditor", source: self});
            }

            this.environmentBridge = new EnvironmentBridge(this.application, this);
            if (typeof this.environmentBridge.setEnableFileDrop === "function") {
                this.environmentBridge.setEnableFileDrop(true);
            }
            return this.environmentBridge.userController.getUser()
                .then(function (user) {
                    track.setUsername(user.login);
                    return self.environmentBridge.mainMenu;
                }).then(function(mainMenu) {
                    self.application.mainMenu = mainMenu;
                    return self.willLoadProject();
                }).then(function () {
                    // TODO: Clean up relationship between extension controller and project controller
                    self.previewController = new PreviewController().init(self.environmentBridge);
                    self.viewController = new ViewController();
                    self.projectController = new ProjectController();
                    self.extensionController = new ExtensionController().init(self.application, self.environmentBridge, self.projectController, self.viewController);
                    self.projectController.init(self.environmentBridge, self.viewController, self, self.extensionController, self.previewController);

                    self.projectController.registerUrlMatcherForDocumentType(function (fileUrl) {
                        return (/\.reel\/?$/).test(fileUrl);
                    }, ReelDocument);

                    return self.extensionController.loadExtensions().catch(function (error) {
                        console.log("Failed loading extensions, proceeding with none");
                        return [];
                    }).then(function(extensions) {
                        //TODO not activate all extensions by default
                        return Promise.all(extensions.map(function (extension) {
                            return self.extensionController.activateExtension(extension);
                        }));
                    });
                }).then(function () {
                    preloadDocument = new Document().init("ui/component.reel");
                    self.projectController.documents.push(preloadDocument);
                    self.projectController.selectDocument(preloadDocument);

                    return self.environmentBridge.projectUrl
                        .then(function (projectUrl) {
                            return projectUrl || self.projectController.createApplication();
                        }).then(function (projectUrl) {
                            // With extensions now loaded and activated, load a project
                            return self.loadProject(projectUrl).then(function () {
                                var ix = self.projectController.documents.indexOf(preloadDocument);
                                self.projectController.documents.splice(ix, 1);

                                //TODO only do this if we have an index.html
                                return self.previewController.registerPreview(projectUrl, projectUrl + "/index.html");
                            });
                        }).then(function () {
                            //TODO not launch the preview automatically?
                            return self.previewController.launchPreview();
                        });
                }).then(function () {
                    self.showModal = false;
                    self.isProjectLoaded = true;
                    self.currentPanelKey = null;
                }).catch(function (error) {
                    console.error(error);
                    return error;
                }).done();
        }
    },

    exitDocument: {
        value: function () {
            //TODO only if we're registered
            this.previewController.unregisterPreview().done();
            this.isProjectLoaded = false;
        }
    },

    _initializeListeners: {
        value: function () {
            application.addEventListener("asyncActivity", this, false);
            application.addEventListener("addFile", this);
            application.addEventListener("newFile", this);
            application.addEventListener("addModule", this);
            application.addEventListener("addDirectory", this);
            application.addEventListener("removeTree", this);
            application.addEventListener("expandTree", this);
            application.addEventListener("menuAction", this);
            window.onbeforeunload = this.handleBeforeunload.bind(this);
            window.addEventListener("beforeUnload", this, false);
            document.addEventListener("contextmenu", this, false);
            document.body.addEventListener("dragover", stop, false);
            document.body.addEventListener("drop", stop, false);
            function stop(evt) {
                // Prevent "loading" dropped files as a browser is wont to do
                if (evt.dataTransfer.types && evt.dataTransfer.types.indexOf("Files") > -1) {
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            }

            //prevent navigating backwards with backspace
            window.addEventListener("keydown", function (event) {
                if(event.keyCode === 8 && (document.activeElement !== event.target || event.target === document.body)) {
                    event.preventDefault();
                }
            });

            // TODO this is a temporary workaround to redirect keyEquivalents to the
            // toolbar as a last resort if they make it up here
            application.addEventListener("keyPress", this);
            application.addEventListener("menuAction", this, false);
        }
    },

    /**
     * Template method available for subclasses to implement their own logic
     * ahead of loading the project as directed by the environment.
     *
     * @return {Promise} A promise to continue the loading sequence
     */
    willLoadProject: {
        value: function () {
            var self = this,
                bridge = this.environmentBridge;

            this.showModal = true;
            this.currentPanelKey = "progress";
            this.progressPanel.message = "Verifying project…";

            return bridge.repositoryExists()
                .then(function (exists) {
                    self.progressPanel.message = "Verifying repository…";

                    return Promise.all([
                        Promise.resolve(exists),
                        (exists ? bridge.isProjectEmpty().then(function (empty) { return !empty; })
                            : Promise.resolve(false)),
                        bridge.workspaceExists()
                    ]);
                })
                .spread(function (repositoryExists, repositoryPopulated, workspaceStatus) {
                    var readyWorkspacePromise;

                    if (!repositoryExists) {

                        if (workspaceStatus === "initializing") {
                            throw new Error("Initializing a project for a repository that no longer exists");
                        } else if (workspaceStatus) {
                            // Workspace exists, repository has gone missing
                            // TODO offer to discard workspace or create repo from workspace
                            throw new Error("Repository no longer exists for project.");
                        } else {
                            // No repo and no workspace
                            self.currentPanelKey = "unknown";
                            readyWorkspacePromise = self.unknownRepositoryPanel.getResponse()
                                .then(function (response) {
                                    if (response) {
                                        return self._createRepository(response.name, response.description);
                                    } else {
                                        window.location = "/";
                                    }
                                });
                        }
                    } else {
                        // The repository exists…
                        if (repositoryPopulated) {
                            if (workspaceStatus === "initializing" || !workspaceStatus) {
                                // Project exists and is currently building the container workspace
                                // or
                                // Project is populated with content, no workspace exists
                                // TODO check if we should bother creating a workspace for this repo
                                // Hopefully it's not about to run minit to try and reinitialize the project
                                readyWorkspacePromise = self._initializeProject();
                            }
                        } else {
                            // The repository exists but is empty…
                            if (workspaceStatus === "initializing") {
                                // Busy initializing
                                readyWorkspacePromise = self._initializeProject();
                            } else if (workspaceStatus) {
                                // Must have just wrapped up workspace will be pushed soon
                                readyWorkspacePromise = self._initializeProject();
                            } else {
                                // Repository exists, is empty, and we have no workspace
                                self.currentPanelKey = "initialize";
                                readyWorkspacePromise = self.initializeRepositoryPanel.getResponse()
                                    .then(function (response) {
                                        if (response) {
                                            return self._initializeProject();
                                        } else {
                                            window.location = "/";
                                        }
                                    });
                            }
                        }
                    }

                    return readyWorkspacePromise;
                })
                .catch(function(err) {
                    var message = err.message || "Internal Server Error";

                    self.currentPanelKey = "confirm";
                    track.error(new Error("Error setting up the project: " + message));

                    return self.confirmPanel.getResponse("Error setting up the project: " + message, true, "Retry", "Close")
                        .then(function (response) {
                            self.showModal = false;
                            if (response === true) {
                                return self.willLoadProject();
                            } else {
                                window.location = "/";
                                return Promise.resolve(false);
                            }
                        });
                });
        }
    },

    loadProject: {
        value: function(projectUrl) {
            var self = this;
            return new Promise(function(resolve) {
                var loadProject = function() {
                    self.currentPanelKey = "progress";
                    self.progressPanel.message = "Loading project…";
                    self.showModal = true;
                    track.message("loading project");
                    self.projectController.loadProject(projectUrl)
                        .then(resolve, loadProjectFail);
                };

                var loadProjectFail = function(reason) {
                    var message = reason.message || "Internal Server Error";
                    console.error(reason);
                    self.currentPanelKey = "confirm";
                    track.error("Couldn't load project: " + message);

                    self.confirmPanel.getResponse("Error loading the project", true, "Retry", "Close")
                        .then(function (response) {
                            self.showModal = false;
                            if (response === true) {
                                loadProject();
                            } else {
                                window.location = "/";
                            }
                        });
                };

                loadProject();
            });
        }
    },

    _createRepository: {
        value: function (name, description) {
            var self = this;

            this.currentPanelKey = "progress";
            this.progressPanel.message = "Creating repository…";

            return repositoriesController.createRepository(name, description)
                .then(function () {
                    return self._initializeProject();
                });
        }
    },

    _initializeProject: {
        value: function () {
            this.currentPanelKey = "progress";
            this.progressPanel.message = "Initializing project and installing dependencies…";

            var promise = this.environmentBridge.repositoryController.initializeRepositoryWorkspace();
            this.progressPanel.activityPromise = promise;
            return promise;
        }
    },

    updateStatusMessage: {
        value: function(message) {
            this.progressPanel.message = message;
        }
    },

    handleBeforeunload: {
        value: function(evt) {
            if (!this.projectController || this.projectController.canCloseAllDocuments()) {
                return;
            }
            // From https://developer.mozilla.org/en-US/docs/Web/Reference/Events/beforeunload
            var confirmationMessage = "You have unsaved changes, leaving now will lose these changes."; // TODO localisation
            evt.preventDefault();
            (evt || window.event).returnValue = confirmationMessage;    //Gecko + IE
            return confirmationMessage;                                 //Webkit, Safari, Chrome etc.
        }
    },

    // Display a contextual menu on right click anywhere in the app if the active target has a contextual menu
    handleContextmenu: {
        value: function (evt) {
            evt.stopImmediatePropagation();
            evt.stop();

            this.templateObjects.contextualMenu.show({top: evt.clientY, left: evt.clientX});
        }
    },

    handleKeyPress: {
        value: function (evt) {
            if ("menuAction" === evt.identifier) {
                var component = evt.keyComposer.component;
                if (typeof component.handleKeyPress === "function") {
                    component.handleKeyPress(evt);
                }
            }
        }
    },

    handleMenuAction: {
        value: function (evt) {
            switch (evt.detail.identifier) {
            case "documentation":
                window.open("http://docs.montagestudio.com/montage-studio/");
                break;
            case "forum":
                window.open("http://forum.montagestudio.com/");
                break;
            case "report":
                window.location = "mailto:feedback@montagestudio.com";
                break;
            case "api":
                window.open("http://docs.montagestudio.com/api/AbstractButton.html");
                break;
            case "framework":
                window.open("http://docs.montagestudio.com/montagejs/");
                break;
            case "licenses":
                var self = this;
                this.showModal = true;
                this.currentPanelKey = "info";
                this.getResponse(LICENSES, "Close")
                .then(function() {
                    self.showModal = false;
                    self.currentPanelKey = null;
                }).done();
                break;
            }
        }
    },

    handleAddComponent: {
        value: function (evt) {
            var editor,
                currentFileUrl = this.projectController.getPath("currentDocument.fileUrl");

            if (currentFileUrl && (editor = this.componentEditorMap[currentFileUrl])) {
                editor.addComponent(evt.detail.prototypeObject);
            }
        }
    },

    // Expand a tree according to a given path, will fail if the tree has not been pre-loaded
    handleExpandTree: {
        value: function (evt) {
            var path = evt.detail.replace(this.projectController.packageUrl, ""),
                dir,
                node = null,
                directories = path.replace(/\/$/, "").replace(/^\//, "").split("/"),
                nodes = this.packageExplorer.fileList.getIterations(),
                currentPath = this.projectController.packageUrl;

            while (dir = directories.shift()) {
                var directoryPath = currentPath + dir + "/";
                for (var i = 0; (node = nodes[i]) && node.data.fileUrl !== directoryPath; ++i) {
                    continue;
                }
                if (!node || (node.data.name !== dir)) {
                    // Directory not found, either not loaded or wrong path
                    return;
                }
                node.isExpanded = true;
                currentPath += dir + "/";
            }
        }
    },

    _frontEditor: {
        value: null
    },

    bringEditorToFront: {
        value: function (editor) {
            if (!editor.element || editor.element.parentElement !== this.editorSlot) {
                this._editorsToInsert.push(editor);
                this._openEditors.push(editor);
            }

            this._frontEditor = editor;
            this.needsDraw = true;
        }
    },

    hideEditors: {
        value: function () {
            this._frontEditor = null;
            this.needsDraw = true;
        }
    },

    _openEditors: {
        value: null
    },

    handleAsyncActivity: {
        value: function(event) {
            this.templateObjects.tasksInfobar.addActivity(
                event.detail.promise,
                event.detail.title,
                event.detail.status
            );
        }
    },

    handleAddFile: {
        enumerable: false,
        value: function (evt) {
            var path = (evt.detail && evt.detail.path)? evt.detail.path : undefined;
            //TODO don't call addComponent until we know it's a component we want
            this.projectController.createComponent(path).done();
        }
    },

    handleNewFile: {
        value: function (evt) {
            var path = (evt.detail && evt.detail.path)? evt.detail.path : undefined;
            this.projectController.newFile(path).done();
        }
    },

    handleAddModule: {
        value: function (evt) {
            var path = (evt.detail && evt.detail.path)? evt.detail.path : undefined;
            if (this.projectController.canCreateModule) {
                this.projectController.createModule(path).done();
            }
        }
    },

    handleAddDirectory: {
        value: function (evt) {
            var path = (evt.detail && evt.detail.path)? evt.detail.path : undefined;
            this.projectController.addDirectory(path).done();
        }
    },

    handleRemoveTree: {
        value: function (evt) {
            var path = evt.detail.path;
            this.projectController.removeTree(path).done();
        }
    },

    handleSave: {
        enumerable: false,
        value: function (evt) {
            evt.preventDefault();
            this.projectController.save(evt.detail.url).then(function () {
                evt.detail.operationCallback();
            }).done();
        }
    },

    handleMenuAction: {
        enumerable: false,
        value: function (evt) {
            switch (evt.detail.identifier) {
            case "save":
                evt.stop();

                this.projectController.save(evt.detail.url).done();
                break;

            case "preview":
                evt.stop();

                //TODO not simply toggle this
                this.isShowingPreviewPanel = !this.isShowingPreviewPanel;
                break;

            case "goto":
                evt.stop();

                this._showGotoFileDialog(false);
                break;

            case "gotoAgain":
                evt.stop();

                this._showGotoFileDialog(true);
                break;
            }
        }
    },

    handleTitleWillChange: {
        value: function () {
            this.dispatchBeforeOwnPropertyChange("windowTitle", this.windowTitle);
        }
    },

    handleTitleChange: {
        value: function () {
            this.dispatchOwnPropertyChange("windowTitle", this.windowTitle);
            this.needsDraw = true;
        }
    },

    windowTitle: {
        get: function () {
            var projectTitle = [],
                currentDocument = this.projectController ? this.projectController.currentDocument : null;

            if (currentDocument) {
                projectTitle.push(currentDocument.title);
            }

            if (this.projectController && this.projectController.packageDescription && this.projectController.packageDescription.name) {
                projectTitle.push(this.projectController.packageDescription.name);
            }

            projectTitle.push("Montage Studio");

            return projectTitle.join(" – ");
        }
    },

    injectMainMenu: {
        value: function (menuConstructor) {
            var menuComponent = new menuConstructor();
            this._menuContentComponent = menuComponent;
        }
    },

    retractMainMenu: {
        value: function () {
            this._menuContentComponent = null;
        }
    },

    handleCloseDocumentKeyPress: {
        value: function (event) {
            var document = this.projectController.currentDocument;
            if (document) {
                event.preventDefault();
                this.dispatchEventNamed("closeDocument", true, true, document);
            } else {
                window.close();
            }
        }
    },

    _showGotoFileDialog: {
        value: function (preserveText) {
            var self = this;

            this.templateObjects.goToFile.show(preserveText);
            if (!this.templateObjects.goToFile.filesMap) {
                this.projectController.getFilesMap()
                    .then(function(filesMap) {
                        self.templateObjects.goToFile.filesMap = filesMap;
                    }).done();
            }
        }
    },

    isShowingPreviewPanel: {
        value: false
    },

    draw: {
        value: function () {
            if (this.windowTitle) {
                document.title = this.windowTitle;
            }

            var editorArea,
                editorElement,
                frontEditor = this._frontEditor;

            if (this._editorsToInsert.length) {
                editorArea = this.editorSlot;

                this._editorsToInsert.forEach(function (editor) {
                    if (!editor.element) {
                        editor.element = document.createElement("div");
                    }
                    editorArea.appendChild(editor.element);
                    editor.attachToParentComponent();
                    editor.needsDraw = true;
                });
                this._editorsToInsert = [];
            }

            this._openEditors.forEach(function (editor) {
                editorElement = editor.element;
                if (editor === frontEditor) {
                    editorElement.classList.remove("standby");
                } else {
                    editorElement.classList.add("standby");
                }
            });

        }
    },

    preloadEditor: {
        value: function(editor) {
            this.templateObjects.preloadEditorSlot.content = editor;
        }
    }
});
