var Document = require("palette/core/document").Document,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application,
    Build = require("core/build").Build,
    track = require("track");

var PROJECT_MENU = "project";
var MERGE_MENU_IDENTIFIER = "merge";
var BUILD_MENU_IDENTIFIER_PREFIX = "build-";

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
        value: function (documentController, environmentBridge, workbench) {
            Document.prototype.init.call(this);
            this._environmentBridge = environmentBridge;
            this._documentController = documentController;
            this._workbench = workbench;

            this._menuValidateRegistered = false;
            this._menuActionRegistered = false;
            this._initMerge();
            this._initBuild();
            window.pd = this;

            return this;
        }
    },

    _initMerge: {
        value: function() {
            var self = this;

            var mergeMenu = new this._environmentBridge.MenuItem();

            mergeMenu.title = "Push…"; //TODO: This should be localized
            mergeMenu.identifier = MERGE_MENU_IDENTIFIER;

            this._environmentBridge.mainMenu.then(function(mainMenu) {
                var projectMenu = mainMenu.menuItemForIdentifier(PROJECT_MENU);
                if (projectMenu) {
                    // Let's figure out where to insert the build menu
                    var itemsMap = {},
                        insertAfter;

                    projectMenu.items.forEach(function(item, index) {
                        itemsMap[item.identifier] = index + 1;
                    });
                    insertAfter = itemsMap.save || itemsMap.new;
                    projectMenu.insertItem(mergeMenu, insertAfter).done();
                    if (!self._menuValidateRegistered) {
                        application.addEventListener("menuValidate", self, false);
                        self._menuValidateRegistered = true;
                    }
                    if (!self._menuActionRegistered) {
                        application.addEventListener("menuAction", self, false);
                        self._menuActionRegistered = true;
                    }

                }
            });
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
                    // Let's figure out where to insert the build menu
                    var itemsMap = {},
                        insertAfter;

                    projectMenu.items.forEach(function(item, index) {
                        itemsMap[item.identifier] = index + 1;
                    });
                    insertAfter = itemsMap.merge || itemsMap.save || itemsMap.new;
                    projectMenu.insertItem(buildMenu, insertAfter).done();
                    if (!self._menuActionRegistered) {
                        application.addEventListener("menuAction", self, false);
                        self._menuActionRegistered = true;
                    }
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
                menuItem.identifier = BUILD_MENU_IDENTIFIER_PREFIX + chain.identifier;
                this._buildMenu.insertItem(menuItem).done();
            }
        }
    },

    didRemoveBuildChain: {
        value: function(chain) {
            if (this._buildMenu) {
                var menuItem = this._buildMenu.menuItemForIdentifier(BUILD_MENU_IDENTIFIER_PREFIX + chain.identifier);
                this._buildMenu.removeItem(menuItem).done();
            }
        }
    },

    handleMenuValidate: {
        value: function(event) {
            var menuItem = event.detail,
                identifier = menuItem.identifier;

            if (identifier === MERGE_MENU_IDENTIFIER) {
                event.preventDefault();
                event.stopPropagation();

                menuItem.enabled = !this._mergePromise && this.aheadCount > 0;
                if (this.currentBranch.name && this.currentBranch.name.length) {
                    menuItem.title = "Push to " + this.currentBranch.name + "…"; //TODO: This should be localized
                } else {
                    menuItem.title = "Push…"; //TODO: This should be localized
                }
            }
        }
    },

    handleMenuAction: {
        value: function(event) {
            var identifier = event.detail.identifier,
                chainIdentifier;

            if (identifier === MERGE_MENU_IDENTIFIER) {
                this.doMerge();
                return;
            }
            else if (identifier.indexOf(BUILD_MENU_IDENTIFIER_PREFIX) === 0) {
                chainIdentifier = identifier.slice(BUILD_MENU_IDENTIFIER_PREFIX.length);
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

    documentsForUrl: {
        value: function(url) {
            var projectController = this._documentController;

            return projectController.documents.filter(function (doc) {
                return doc.url.indexOf(url) !== -1;
            });
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
        value: function(data, url, makeSubDirectories) {
            var deferredUndoOperation = Promise.defer(),
                makeFileMethod = (makeSubDirectories)? this._environmentBridge.makeTreeWriteFile : this._environmentBridge.writeFile,
                self = this;

            this.undoManager.register("Add File", deferredUndoOperation.promise);
            return makeFileMethod.call(this._environmentBridge, url, data)
                .then(function (result) {
                    return self._updateShadowDelta().then(function() { return result; });
                })
                .then(function (success) {
                    deferredUndoOperation.resolve([self.remove, self, url]);
                    return success;
                });
        }
    },

    touch: {
        value: function(url) {
            var self = this,
                deferredUndoOperation = Promise.defer();

            this.undoManager.register("Create File", deferredUndoOperation.promise);

            return this._environmentBridge.touch(url).then(function (success) {
                deferredUndoOperation.resolve([self.remove, self, url]);
                return success;
            });
        }
    },

    _closeDocumentsBeforeRemoval: {
        value : function (url) {
            var projectController = this._documentController,
                openDocuments = this.documentsForUrl(url);

            return Promise.all(openDocuments.map(function (doc) {
                return projectController.closeDocument(doc);
            }));
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

            return this._closeDocumentsBeforeRemoval(url).then(function (documents) {
                if (documents.some(function (doc) { return doc === null;})) {
                    return Promise.resolve(null);
                }

                this.undoManager.register("Remove File", deferredUndoOperation.promise);

                //TODO not go to the backend directly
                return this._environmentBridge.backend
                    .get("file-service")
                    .invoke("read", url)
                    .then(function (data) {
                        return self._environmentBridge.remove(url)
                            .then(function (result) {
                                return self._updateShadowDelta().then(function() { return result; });
                            })
                            .then(function (success) {
                                deferredUndoOperation.resolve([self.add, self, btoa(data), url]);
                                return success;
                            });
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

            return this._environmentBridge.createComponent(name, relativeDestination)
                .then(function (result) {
                    return self._updateShadowDelta().then(function() { return result; });
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
                    return self._updateShadowDelta().then(function() { return result; });
                });
        }
    },

    /**
     * Create the specified tree from the project
     *
     * @param {string} url such as file://localhost/path/to/project/assets/images/thumbnails
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
     * @param {string} path such as file://localhost/path/to/project/assets/images/
     * @return {Promise} A promise for success
     */
    removeTree:{
        value: function (path) {
            var self = this;

            return this._closeDocumentsBeforeRemoval(path).then(function (documents) {
                if (documents.some(function (doc) { return doc === null;})) {
                    return Promise.resolve(null);
                }
                return self._environmentBridge.removeTree(path)
                    .then(function() {
                        var message = path.slice(-1) === "/" ? "Remove directory " : "Remove file ",
                            commitBatch = self._environmentBridge.openCommitBatch(message);

                        return self._environmentBridge.stageFilesForDeletion(commitBatch, path).then(function() {
                            return self._environmentBridge.closeCommitBatch(commitBatch);
                        }).finally(function() {
                            self._environmentBridge.releaseCommitBatch(commitBatch);
                        });
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

                        return self._updateProjectRefs("update")
                            .then(function() {
                                return true;
                            }, function() {
                                return false;
                            }).then(function(response) {
                                return self._updateShadowDelta().then(function() { return response; });
                            });
                    })
                    .finally(function () {
                        self.isBusy = false;
                    });
            }

            return Promise.resolve(updatePromise);
        }
    },

    _updateShadowDelta: {
        value: function (forceFetch) {
            var self = this,
                bridge = this._environmentBridge,
                result;

            if (bridge && typeof bridge.shadowBranchStatus === "function") {
                result = this._environmentBridge.shadowBranchStatus(this.currentBranch.name, forceFetch)
                    .then(function(shadowStatus) {
                        self.aheadCount = shadowStatus.localParent.ahead;
                        self.behindCount = shadowStatus.localParent.behind;
                        return shadowStatus;
                    });
            }

            return Promise.resolve(result);
        }
    },

    _updateProjectRefs: {
        value: function(updateType, resolution, reference) {
            var self = this,
                bridge = this._environmentBridge,
                currentPanelKey,
                operationAborted = false,
                retVal;

            if (bridge && typeof bridge.updateProjectRefs === "function") {
                var previousProgressMessage = this._workbench.progressPanel.message;
                if (updateType !== "merge") {
                    this._workbench.progressPanel.message =
                        reference && resolution !== "rebase" ? "Resolving conflict…" : "Updating repository…";
                }

                retVal = bridge.updateProjectRefs(resolution, reference)
                .then(function(result) {
                    var resolutionStrategy = result.resolutionStrategy,
                        message;

                    if (result.success === false && resolutionStrategy.indexOf("rebase") !== -1) {
                        currentPanelKey = self._workbench.showModal === true ? self._workbench.currentPanelKey : null;
                        self._workbench.showModal = true;
                        self._workbench.currentPanelKey = "confirm";

                        if (updateType === "merge") {
                            message = "We have detected remote changes. Before being able to push your work, you must update your project";
                        } else {
                            message = "We have detected remote changes. Would you like to update?";
                        }
                        return self._workbench.confirmPanel.getResponse(message, "rebase", "Update", "Cancel")
                            .then(function(response) {
                                if (response === "rebase") {
                                    self._workbench.showModal = true;
                                    self._workbench.currentPanelKey = "progress";
                                    return self._updateProjectRefs(updateType, "rebase", result.reference);
                                } else {
                                     // update has been aborted by the user
                                    operationAborted = true;
                                    return {success: false};
                                }
                            }).finally(function() {
                                if (currentPanelKey) {
                                    self._workbench.currentPanelKey = currentPanelKey;
                                } else {
                                    self._workbench.showModal = false;
                                    self._workbench.currentPanelKey = null;
                                }
                            });
                    } else {
                        return result;
                    }
                })
                .then(function(result) {
                    if (!operationAborted && result.success !== true) {
                        /*
                            conflict could be either between the local branch and the remote shadow branch or between
                            the local branch and the remote parent (master) branch.
                            We always check the local vs shadow branch first.
                         */
                        var comparedToParentBranch = true;

                        // Local shadow has diverged from remote branch (not a rebase case)
                        currentPanelKey = self._workbench.showModal === true ? self._workbench.currentPanelKey : null;
                        self._workbench.showModal = true;
                        self._workbench.currentPanelKey = "conflict";

                        if (result.remote.indexOf("/montagestudio/") !== -1) {
                            // Let's cleanup the branch name we show to the user
                            result.remote = "work";
                            comparedToParentBranch = false;
                        }

                        return self._environmentBridge.getRepositoryInfo(self.currentBranch.name)
                            .then(function(info) {
                                var localUrl = info.repositoryUrl + "/compare/",
                                    remoteUrl = localUrl;
                                /*
                                    we cannot compare against the local branch has we haven't obviously pushed to github,
                                    however we can compare against a previous reference pushed to github)
                                 */

                                if (comparedToParentBranch) {
                                    //  in that case, the remote shadow branch should be in sync with the local branch
                                    localUrl += info.shadowBranch + "~" + result.ahead + "..." + info.shadowBranch;
                                    remoteUrl += info.branch + "~" + result.behind + "..." + info.branch;
                                } else {
                                    // TODO: The local changes are not accessible from github, should we push it to a temp branch
                                    localUrl = null;
                                    remoteUrl += info.shadowBranch + "~" + result.behind + "..." + info.shadowBranch;
                                }
                                return self._workbench.mergeConflictPanel.getResponse("Updating Project", "work",
                                    result.remote, result.ahead, result.behind, localUrl, remoteUrl, result.resolutionStrategy);
                            })
                            .then(function(response) {
                            if (response && typeof response.resolution) {
                                self._workbench.showModal = true;
                                self._workbench.currentPanelKey = "progress";
                                return self._updateProjectRefs(updateType, response.resolution, result.reference);
                            } else {
                                return {success: true}; // update has been aborted by the user, let's bailout by returning success=true
                            }
                        }).finally(function() {
                            if (currentPanelKey) {
                                self._workbench.currentPanelKey = currentPanelKey;
                            } else {
                                self._workbench.showModal = false;
                                self._workbench.currentPanelKey = null;
                            }
                        });
                    } else {
                        return result;
                    }
                })
                .finally(function() {
                    self._workbench.progressPanel.message = previousProgressMessage;
                });
            }

            return Promise.resolve(retVal);
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

            // Make sure we actually have something to save
            if (this.dirtyDocuments.length === 0) {
                return Promise.resolve();
            }

            this.isBusy = true;
            savedPromises = this.dirtyDocuments.map(function (doc) {
                var moduleId = doc.moduleId;

                commitBatch = commitBatch || self._environmentBridge.openCommitBatch(message);

                if (!message) {
                    var componentExt = ".reel";
                    var index = moduleId.indexOf(componentExt);
                    if (index !== -1) {
                        components[moduleId] = moduleId.substring(0, index + componentExt.length);
                    } else {
                        otherFiles.push(doc.moduleId);
                    }
                }

                return self._environmentBridge.save(doc, doc.url)
                    .then(function(result) {
                        return self._environmentBridge.stageFiles(commitBatch, doc.moduleId).then(function() { return result;});
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
                    return self._environmentBridge.closeCommitBatch(commitBatch, message)
                        .then(function() { return result; });
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
    * handle merge request from user
    * @returns none
    */
    doMerge: {
        value: function() {
            var self = this,
                pushSuccessful = false;

            // Before we can merge, we need to make sure there wont be any conflict
            this._workbench.showModal = true;
            this._workbench.progressPanel.message = "Preparing to push…";
            this._workbench.currentPanelKey = "progress";

            this._updateProjectRefs("merge")
                .then(function(result) {
                    if (result.success) {
                        self._workbench.currentPanelKey = "merge";
                        self._workbench.showModal = true;

                        return self._environmentBridge.getRepositoryInfo(self.currentBranch.name)
                        .then(function(info) {
                            var commitUrl = info.repositoryUrl + "/compare/" + info.branch + "..." + info.shadowBranch;
                            return self._workbench.mergePanel.getResponse(self.currentBranch.name, self.aheadCount,
                                commitUrl, true, "Update files");
                        })
                        .then(function (response) {
                            if (typeof response === "object") {
                                self._workbench.currentPanelKey = "progress";
                                return self._mergePromise = self.merge(response.squash, response.message)
                                .then(function(result) {
                                    if (result.success === true) {
                                        pushSuccessful = true;
                                    }
                                })
                                .finally(function() {
                                    self._mergePromise = null;
                                });
                            } else {
                                pushSuccessful = true;
                            }
                        });
                    }
                })
                .finally(function() {
                    self._workbench.showModal = false;
                    self._workbench.currentPanelKey = null;

                    if (pushSuccessful !== true) {
                        self._workbench.currentPanelKey = "confirm";
                        self._workbench.showModal = true;
                        track.error("Couldn't push project: ");

                        self._workbench.confirmPanel.getResponse("Error pushing", true, "Retry", "Close")
                        .then(function (response) {
                            self._workbench.showModal = false;
                            if (response === true) {
                                self.doMerge();
                            }
                        });
                    }
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
        value: function (squash, message) {
            var bridge = this._environmentBridge,
                self = this,
                retValue,
                result;

            if (bridge && typeof bridge.mergeShadowBranch === "function") {
                this.isBusy = true;

                self._workbench.progressPanel.message = "Pushing to " + self.currentBranch.name + "…";
                result = bridge.mergeShadowBranch(self.currentBranch.name, message, squash)
                    .then(function(mergeResult) {
                        retValue = {success: mergeResult};
                    })
                    .then(function() {
                        return self._updateShadowDelta().then(function() {
                            return retValue;
                        });
                    })
                    .finally(function () {
                        self.isBusy = false;
                    });
            }

            return Promise.resolve(result);
        }
    }
},
// Constructor Properties
{
    load: {
        value: function (documentController, environmentBridge, workbench) {
            var self = this,
                projectDocument;

            projectDocument = new self().init(documentController, environmentBridge, workbench);

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
                        application.addEventListener("remoteChange", projectDocument, false);
                        application.addEventListener("repositoryFlushed", projectDocument, false);
                        return projectDocument.updateRefs();
                    })
                    .then(function() { return projectDocument; });
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
