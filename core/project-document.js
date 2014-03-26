var Document = require("palette/core/document").Document,
    Promise = require("montage/core/promise").Promise;

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
        value: function (packageRequire, documentController, environmentBridge) {
            var self = this.super(),
                bridge;

            self._packageRequire = packageRequire;
            self._documentController = documentController;
            bridge = self._environmentBridge = environmentBridge;

            if (bridge && typeof bridge.listRepositoryBranches === "function") {
                bridge.listRepositoryBranches()
                    .then(function (response) {
                        var currentBranchName = response.current,
                            branches = self.branches = response.branches;

                        self.currentBranch = branches[currentBranchName];

                        if (!response.currentIsShadow) {
                            return bridge.checkoutShadowBranch(currentBranchName);
                        }
                    })
                    .then(function () {
                        return self.updateRefs();
                    })
                    .catch(Function.noop)
                    .done();
            }

            window.pd = self;

            return self;
        }
    },

    /**
     * Returns a promise for the blueprint of the specified moduleId within the
     * project's own package.
     */
    getBlueprintWithModuleId: {
        value: function (moduleId) {

            var packageRequire = this._packageRequire,
                blueprintModuleId;

            // TODO replace meta module naming with a more robust method; this may not be comprehensive enough
            // It would be nice if montage itself offered an API that accounted for this
            if (/\.reel$/.test(moduleId)) {
                blueprintModuleId = moduleId.replace(/([\w-]+)\.reel$/, "$1.reel/$1.meta");
            } else {
                blueprintModuleId = moduleId.replace(/\.js$/, "");
                blueprintModuleId += ".meta";
            }

            return packageRequire.async("montage/core/meta/module-blueprint")
                .get("ModuleBlueprint")
                .then(function (ModuleBlueprint) {
                    return ModuleBlueprint.getBlueprintWithModuleId(blueprintModuleId, packageRequire);
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
            return this._environmentBridge.removeTree(path);
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

                        return self._updateShadowDelta()
                        .then(function(shadowStatus) {
                            var refs = [shadowStatus.localParent, shadowStatus.remoteParent, shadowStatus.remoteShadow],
                                needSync = false;

                            refs.some(function(status) {
                                if (status.ahead > 0 || status.behind > 0) {
                                    needSync = true;
                                    return true;
                                }
                            });

                            if (needSync) {
                                return self._updateProjectRefs();
                            }
                        }).thenResolve(response);
                    })
                    .finally(function (result) {
                        self.isBusy = false;
                        return result;
                    });
            }

            return Promise(updatePromise);
        }
    },

    _updateShadowDelta: {
        value: function () {
            var self = this,
                bridge = this._environmentBridge,
                result;

            if (bridge && bridge.shadowBranchStatus && typeof bridge.shadowBranchStatus === "function") {

                result = this._environmentBridge.shadowBranchStatus(this.currentBranch.name)
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
        value: function(resolution) {
            var bridge = this._environmentBridge,
                result;

            if (bridge && bridge.updateProjectRefs && typeof bridge.updateProjectRefs === "function") {
                result = bridge.updateProjectRefs(resolution)
                .then(function(result) {
                    var notifications = result.notifications,
                        nbrNotification = notifications ? notifications.length : 0,
                        resolutionStrategy = result.resolutionStrategy;

                    if (result.success === false && nbrNotification && resolutionStrategy.indexOf("rebase") !== -1) {
                        // Automatically sync the shadow branch with its remote counter part or parent
                        return bridge.updateProjectRefs("rebase");
                    }
                    return result;
                })
                .then(function(result) {
                    var notifications = result.notifications,
                       nbrNotification = notifications ? notifications.length : 0,
                       lastNotification = notifications[nbrNotification - 1];

                    // jshint noempty:false
                    if (result.success !== true) {
                        if (lastNotification.type === "shadowsOutOfSync") {
                            // Local shadow has diverged from remote shadow (not a rebase case)
                            // TODO: ask user what to do in case of conflict
                            /* TODO: Possible options to propose to user
                                1. Discard remote changes  --> updateRefs("revert")
                                2. Discard Local changes   --> updateRefs("discard")
                                3. Cancel
                            */
                        }
                    }
                    // jshint noempty:true
                    return result;
                });
            }

            return Promise(result);
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
        value: function (url, dataWriter) {
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
                savedPromises;

            this.isBusy = true;

            savedPromises = this.dirtyDocuments.map(function (doc) {
                return self._environmentBridge.save(doc, doc.url);
            });

            return Promise.all(savedPromises)
                .finally(function(result) {
                    return self._updateShadowDelta().thenResolve(result);
                })
                .finally(function (result) {
                    self.isBusy = false;
                    return result;
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
                result;

            // jshint noempty:false
            if (bridge && bridge.mergeShadowBranch && typeof bridge.mergeShadowBranch === "function") {
                this.isBusy = true;

                result = this._updateProjectRefs()
                    .then(function(result) {
                        if (result.success === true) {
                            return bridge.mergeShadowBranch(self.currentBranch.name, message, squash)
                                .then(function(result) {
                                    if (result.success !== true) {
                                        // cannot merge, check resolution and try again...
                                        // TODO: ask user what to do or just cancel the merge
                                    }
                                })
                                .then(function() {
                                    self._updateShadowDelta();
                                });
                        } else {
                            // repo not up-to-date, need sync
                            //TODO: ask user to update local branches first
                        }
                    })
                    .finally(function (result) {
                        self.isBusy = false;
                        return result;
                    });
            }
            // jshint noempty:true

            return Promise(result);
        }
    }
},
// Constructor Properties
{
    load: {
        value: function (packageRequire, environmentBridge) {
            var self = this;
            return Promise.resolve((new self()).init(packageRequire, environmentBridge));
        }
    },

    editorType: {
        get: function () {
            return null;
        }
    }

});
