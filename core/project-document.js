var Document = require("palette/core/document").Document,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application,
    Build = require("core/build").Build;

var PROJECT_MENU = "project";
var MENU_IDENTIFIER_PREFIX = "build-";

/**
 * The ProjectDocument represents the editing interface for the project itself.
 * This means operations of interest throughout the project are consolidated
 * here for use throughout.
 *
 * API for editing the project itself in particular make this their home.
 * For example, operations for adding, removing, and renaming files are likely
 * candidates for inclusion here. Much like other documents, the ProjectDocument
 * provides undoability for these project-level operations, as possible.
 *
 * Prior to the creation of this object, the ProjectController assumed most of the
 * responsibilities listed. Now, the ProjectController can focus on bootstrapping
 * the editor given a project package to open. Filament specific concerns such as
 * the libraryItems offered by the project are still to be handled there. The actual
 * list of dependencies, however, should be handled here.
 *
 * In this particular example, there is some chance for overlap with the
 * PackageManager's PackageDocument, which is responsible for editing/undoability
 * of editing the project's package.json. This is a responsibility we could
 * adopt here, but there would need to be a separate undo stack for the different
 * editing context.
 *
 * For now, it might be best to think of this as managing the project's files on
 * disks.
 *
 * @type {ProjectDocument}
 */
exports.ProjectDocument = Document.specialize({

    constructor: {
        value: function ProjectDocument() {
            this.super();
            this._dirtyDocuments = [];
            this.defineBinding("dirtyDocuments", {"<-": "_documentController.documents.filter{isDirty}"});
            this.defineBinding("isProjectDirty", {"<-": "dirtyDocuments.length != 0"});
        }
    },

    /**
     * The require used by this package
     */
    _packageRequire: {
        value: null
    },

    /**
     * The backend service provider
     */
    _environmentBridge: {
        value: null
    },

    /**
     * The documentController that manages the documents in the project
     */
    _documentController: {
        value: null
    },

    /**
     * Initializes a packageDocument object for editing the data about
     * a package and all that that represents.
     *
     * @param {Function} packageRequire The require used by this package
     * @param {Object} environmentBridge The backend service provider used to manipulate the package
     */
    init: {
        value: function (documentController, environmentBridge) {
            var self = this.super();

            self._environmentBridge = environmentBridge;
            self._documentController = documentController;

            this._initBuild();
            window.pd = self;

            return self;
        }
    },

    _initBuild: {
        value: function() {
            var self = this,
                projectMenu,
                build,
                buildMenu;

            buildMenu = new this._environmentBridge.MenuItem();
            buildMenu.title = "Build"; // This should be localized
            buildMenu.identifier = "build";
            this._buildMenu = buildMenu;

            this.build = this._environmentBridge.mainMenu.then(function(mainMenu) {
                projectMenu = mainMenu.menuItemForIdentifier(PROJECT_MENU);

                if (projectMenu) {
                    projectMenu.insertItem(buildMenu, 2).done();
                    application.addEventListener("menuAction", self, false);
                }

                build = new Build();
                build.delegate = self;
                build.init(self._environmentBridge);

                return build;
            });
            this.build.done();
        }
    },

    didAddBuildChain: {
        value: function(chain) {
            if (this._buildMenu) {
                var menuItem = new this._environmentBridge.MenuItem();

                menuItem.title = chain.name;
                menuItem.identifier = MENU_IDENTIFIER_PREFIX + chain.identifier;
                this._buildMenu.insertItem(menuItem).done();
            }
        }
    },

    didRemoveBuildChain: {
        value: function(chain) {
            if (this._buildMenu) {
                var menuItem = this._buildMenu.menuItemForIdentifier(MENU_IDENTIFIER_PREFIX + chain.identifier);
                this._buildMenu.removeItem(menuItem).done();
            }
        }
    },

    handleMenuAction: {
        value: function(event) {
            var identifier = event.detail.identifier;
            var chainIdentifier;

            if (identifier.indexOf(MENU_IDENTIFIER_PREFIX) === 0) {
                chainIdentifier = identifier.slice(MENU_IDENTIFIER_PREFIX.length);
                this.build.then(function(build) {
                    return build.buildFor(chainIdentifier);
                }).done();
            }
        }
    },

    handleRemoteChange: {
        value: function() {
            this.updateRefs().done();
        }
    },

    handleRepositoryFlushed: {
        value: function(event) {
            if (event.detail.success) {
                this._updateShadowDelta().done();
            } else {
                this.updateRefs().done();
            }
        }
    },

    /**
     * Add the specified file to the project
     *
     * @param {string} data is base64 encoded
     * @param {string} url such as file://localhost/path/to/project/assets/images/why not zoidberg.png
     * @return {Promise} A promise for success
     */
    add: {
        value: function(data, url) {
            var deferredUndoOperation = Promise.defer(),
                self = this;

            this.undoManager.register("Add File", deferredUndoOperation.promise);

            return this._environmentBridge.writeFile(url, data)
                .then(function (result) {
                    return self._updateShadowDelta().thenResolve(result);
                })
                .then(function (success) {
                    deferredUndoOperation.resolve([self.remove, self, url]);
                    return success;
                });
        }
    },

    /**
     * Remove the specified file from the project
     *
     * @param {string} url such as file://localhost/path/to/project/assets/images/why not zoidberg.png
     * @return {Promise} A promise for success
     */
    remove: {
        value: function (url) {
            var deferredUndoOperation = Promise.defer(),
                self = this;

            this.undoManager.register("Remove File", deferredUndoOperation.promise);

            //TODO not go to the backend directly
            return this._environmentBridge.backend
                .get("file-service")
                .invoke("read", url)
                .then(function (data) {
                    return self._environmentBridge.remove(url)
                        .then(function (result) {
                            return self._updateShadowDelta().thenResolve(result);
                        })
                        .then(function (success) {
                            deferredUndoOperation.resolve([self.add, self, btoa(data), url]);
                            return success;
                        });
                });
        }
    },

    /**
     * Create a component
     */
    createComponent: {
        value: function (name, packageHome, relativeDestination) {
            var self = this;

            return this._environmentBridge.createComponent(name, packageHome, relativeDestination)
                .then(function (result) {
                    return self._updateShadowDelta().thenResolve(result);
                });
        }
    },

    /**
     * Create a module
     */
    createModule: {
        value: function (name, packageHome, relativeDestination) {
            var self = this;

            return this._environmentBridge.createModule(name, packageHome, relativeDestination)
                .then(function (result) {
                    return self._updateShadowDelta().thenResolve(result);
                });
        }
    },

    /**
     * Create the specified tree from the project
     *
     * @param {string} url such as file://localhost/path/to/project/assets/images/why not zoidberg.png
     * @return {Promise} A promise for success
     */
    makeTree:{
        value: function (path) {
            return this._environmentBridge.makeTree(path);
        }
    },

    /**
     * Remove the specified tree from the project
     *
     * @param {string} url such as file://localhost/path/to/project/assets/images/why not zoidberg.png
     * @return {Promise} A promise for success
     */
    removeTree:{
        value: function (path) {
            var self = this;

            return this._environmentBridge.removeTree(path)
                .then(function() {
                    var message = path.slice(-1) === "/" ? "Remove directory " : "Remove file ",
                        commitBatch = self._environmentBridge.openCommitBatch(message);

                    return self._environmentBridge.stageFilesForDeletion(commitBatch, path).then(function() {
                        return self._environmentBridge.closeCommitBatch(commitBatch);
                    }).finally(function() {
                        self._environmentBridge.releaseCommitBatch(commitBatch);
                    });
                });
        }
    },

    /**
     * The collection of documents that have unsaved changes
     */
    dirtyDocuments: {
        value: null
    },

    isProjectDirty: {
        value: false
    },

    isBusy:{
        value: false
    },

    updateRefs: {
        value: function () {
            var bridge = this._environmentBridge,
                self = this,
                updatePromise;

            if (bridge && typeof bridge.listRepositoryBranches === "function") {
                this.isBusy = true;

                updatePromise = bridge.listRepositoryBranches()
                    .then(function (response) {
                        var branches = self.branches = response.branches;

                        if (branches) {
                            //jshint -W106
                            self.currentBranch = branches.__local__[response.current];
                            //jshint +W106
                        }

                        return self._updateProjectRefs()
                            .then(function() {
                                return true;
                            }, function() {
                                return false;
                            }).then(function(response) {
                                return self._updateShadowDelta().thenResolve(response);
                            });
                    })
                    .finally(function () {
                        self.isBusy = false;
                    });
            }

            return Promise(updatePromise);
        }
    },

    _updateShadowDelta: {
        value: function (forceFetch) {
            var self = this,
                bridge = this._environmentBridge,
                result;

            if (bridge && bridge.shadowBranchStatus && typeof bridge.shadowBranchStatus === "function") {
                result = this._environmentBridge.shadowBranchStatus(this.currentBranch.name, forceFetch)
                    .then(function(shadowStatus) {
                        self.aheadCount = shadowStatus.localParent.ahead;
                        self.behindCount = shadowStatus.localParent.behind;
                        return shadowStatus;
                    });
            }

            return Promise(result);
        }
    },

    _updateProjectRefs: {
        value: function(resolution, reference) {
            var self = this,
                bridge = this._environmentBridge,
                applicationDelegate = application.delegate,
                currentPanelKey,
                retVal;

            if (bridge && bridge.updateProjectRefs && typeof bridge.updateProjectRefs === "function") {
                var previousProgressMessage = applicationDelegate.progressPanel.message;
                applicationDelegate.progressPanel.message = reference ? "Resolving conflict…" : "Updating repository…";

                retVal = bridge.updateProjectRefs(resolution, reference)
                .then(function(result) {
                    var resolutionStrategy = result.resolutionStrategy;

                    if (result.success === false && resolutionStrategy.indexOf("rebase") !== -1) {
                        currentPanelKey = applicationDelegate.showModal === true ? applicationDelegate.currentPanelKey : null;
                        applicationDelegate.showModal = true;
                        applicationDelegate.currentPanelKey = "confirm";

                        return applicationDelegate.confirmPanel.getResponse("We have detected remote changes. Would you like to update?", "rebase", "Update", "Cancel").then(function(response) {
                            if (response === "rebase") {
                                applicationDelegate.showModal = true;
                                applicationDelegate.currentPanelKey = "progress";
                                return self._updateProjectRefs("rebase", result.reference);
                            } else {
                                return {success: true}; // update has been aborted by the user, let's bailout by returning success=true
                            }
                        }).finally(function() {
                            if (currentPanelKey) {
                                applicationDelegate.currentPanelKey = currentPanelKey;
                            } else {
                                applicationDelegate.showModal = false;
                                applicationDelegate.currentPanelKey = null;
                            }
                        });
                    } else {
                        return result;
                    }
                })
                .then(function(result) {
                    if (result.success !== true) {
                        // Local shadow has diverged from remote shadow (not a rebase case)
                        currentPanelKey = applicationDelegate.showModal === true ? applicationDelegate.currentPanelKey : null;
                        applicationDelegate.showModal = true;
                        applicationDelegate.currentPanelKey = "conflict";

                        if (result.remote.indexOf("/__mb__") !== -1) {
                            // Let's cleanup the branch name we show to the user
                            result.remote = "work";
                        }
                        return applicationDelegate.mergeConflictPanel.getResponse("Updating Project", "work", result.remote, result.ahead, result.behind, result.resolutionStrategy)
                            .then(function(response) {
                            if (response && typeof response.resolution) {
                                applicationDelegate.showModal = true;
                                applicationDelegate.currentPanelKey = "progress";
                                return self._updateProjectRefs(response.resolution, result.reference);
                            } else {
                                return {success: true}; // update has been aborted by the user, let's bailout by returning success=true
                            }
                        }).finally(function() {
                            if (currentPanelKey) {
                                applicationDelegate.currentPanelKey = currentPanelKey;
                            } else {
                                applicationDelegate.showModal = false;
                                applicationDelegate.currentPanelKey = null;
                            }
                        });
                    } else {
                        return result;
                    }
                })
                .finally(function() {
                    applicationDelegate.progressPanel.message = previousProgressMessage;
                });
            }

            return Promise(retVal);
        }
    },

    branches: {
        value: null
    },

    currentBranch: {
        value: null
    },

    aheadCount: {
        value: 0
    },

    behindCount: {
        value: 0
    },

    /**
     * Override default implementation
     */
    save: {
        value: function (url) {
            return this.saveAll();
        }
    },

    /**
     * Saves all unsaved documents.
     *
     * For environments that propagate edits to a backend, this will happen at this point as well
     * TODO this strategy should be provided by the environment
     * @returns {Promise} A promise for the completed save and remote push of the files with progress
     */
    saveAll: {
        value: function (message, amend) {
            var self = this,
                savedPromises,
                components = {},
                otherFiles = [],
                commitBatch = null;

            this.isBusy = true;

            savedPromises = this.dirtyDocuments.map(function (doc) {
                var url = doc.url;

                commitBatch = commitBatch || self._environmentBridge.openCommitBatch(message);

                if (!message) {
                    var index = url.indexOf("/", url.indexOf("//") + 2),    // simplified url parsing
                        filePath = decodeURIComponent(url.substring(index + 1)),
                        componentExt = ".reel";

                    index = filePath.indexOf(componentExt);
                    if (index !== -1) {
                        components[filePath] = filePath.substring(0, index + componentExt.length);
                    } else {
                        otherFiles.push(filePath);
                    }
                }

                return self._environmentBridge.save(doc, url)
                    .then(function(result) {
                        return self._environmentBridge.stageFiles(commitBatch, url).thenResolve(result);
                    });
            });

            if (!message) {
                message = "Update";
                components = Object.keys(components);

                var componentCount = components.length,
                    nbrFiles = otherFiles.length;

                if (componentCount) {
                    if (componentCount === 1) {
                        message += " component " + components[0];
                    } else {
                        message += " components";
                    }

                }
                if (nbrFiles) {
                    if (componentCount) {
                        message += " and";
                        if (nbrFiles > 1) {
                            message += " other";
                        }
                    }
                    if (nbrFiles === 1) {
                        message += " file " + otherFiles[0];
                    } else {
                        message += " files";
                    }
                }
            }

            return Promise.all(savedPromises)
                .then(function(result) {
                    return self._environmentBridge.closeCommitBatch(commitBatch, message).thenResolve(result);
                })
                .finally(function () {
                    self._environmentBridge.releaseCommitBatch(commitBatch);
                    self.isBusy = false;
                });
        }
    },

    /**
     * Discard all unsaved changes
     * @returns {Promise} A promise for the completion
     */
    discard: {
        value: function () {
        }
    },

    /**
     * Discard all unsaved changes and all draft commits
     * by resetting the shadow branch to point to it's actual
     * branch.
     *
     * @returns {Promise} A promise for the completion
     */
    reset: {
        value: function () {
            var self = this;

            this.isBusy = true;

            return this._environmentBridge.resetShadowBranch(this.currentBranch.name)
                .finally(function (result) {
                    self.isBusy = false;
                    return result;
                });
        }
    },

    /**
     * Merges the shadow branch changes into its actual branch.
     *
     * While typically not an operation that should be offered
     * while there are unsaved changes, doing so should perform
     * the merge as expected without committing those unsaved changes
     * or discarding them. If desired, accepting or discarding unsaved changes
     * should be done prior to calling merge.
     *
     *
     * @returns {Promise} A promise for the completion
     * @see accept
     * @see discard
     */
    merge: {
        value: function (message, squash) {
            var bridge = this._environmentBridge,
                self = this,
                retValue,
                result;

            if (bridge && bridge.mergeShadowBranch && typeof bridge.mergeShadowBranch === "function") {
                this.isBusy = true;

                result = this._updateProjectRefs()
                    .then(function(updateResult) {
                        if (updateResult.success === true) {
                            return bridge.mergeShadowBranch(self.currentBranch.name, message, squash)
                                .then(function(mergeResult) {
                                    // jshint noempty:false
                                    if (mergeResult !== true) {
                                        // cannot merge, try to update the project refs one more time
                                        // TODO: call _updateProjectRefs and ask user what to do or just cancel the merge
                                    }
                                    retValue = {success: mergeResult};
                                    // jshint noempty:true
                                })
                                .then(function() {
                                    return self._updateShadowDelta().then(function() {
                                        return retValue;
                                    });
                                });
                        } else {
                            // repo not up-to-date, need to update first
                            //TODO: ask user to update local branches first
                            retValue = updateResult;
                        }
                    })
                    .finally(function () {
                        self.isBusy = false;
                        return retValue;
                    });
            }

            return Promise(result);
        }
    }
},
// Constructor Properties
{
    load: {
        value: function (documentController, environmentBridge) {
            var self = this,
                projectDocument;

            projectDocument = new self().init(documentController, environmentBridge);

            if (environmentBridge && typeof environmentBridge.listRepositoryBranches === "function") {
                return environmentBridge.listRepositoryBranches()
                    .then(function (response) {
                        var currentBranchName = response.current,
                            branches = self.branches = response.branches;

                        self.currentBranch = branches[currentBranchName];
                        if (!response.currentIsShadow) {
                            return environmentBridge.checkoutShadowBranch(currentBranchName);
                        }
                    })
                    .then(function () {
                        application.addEventListener("remoteChange", self, false);
                        application.addEventListener("repositoryFlushed", self, false);
                        return projectDocument.updateRefs();
                    })
                    .thenResolve(projectDocument);
            }

            return Promise.resolve(projectDocument);
        }
    },

    editorType: {
        get: function () {
            return null;
        }
    }

});
