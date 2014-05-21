var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("../ui/package-editor.reel").PackageEditor,
    DependencyManager = require('./dependency-manager').DependencyManager,
    PackageSavingManager = require('./package-saving-manager').PackageSavingManager,
    application = require("montage/core/application").application,
    Confirm = require("matte/ui/popup/confirm.reel").Confirm,
    Promise = require("montage/core/promise").Promise,
    Dependency = require('./dependency').Dependency,
    DependencyState = require('./dependency').DependencyState,
    Tools = require('./package-tools'),
    semver = require('semver'),
    PackageTools = Tools.ToolsBox,
    DependencyNames = Tools.DependencyNames,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,

    TIME_BEFORE_REFRESHING = 350,
    DEPENDENCIES_REQUIRED = ['montage'],
    PACKAGE_PROPERTIES_ALLOWED_MODIFY = {
        name: "name",
        version: "version",
        private: "private",
        homepage: "homepage",
        maintainers: "maintainers",
        license: "license",
        description: "description",
        author: "author"
    };

var PackageDocument = exports.PackageDocument = EditingDocument.specialize( {
    constructor: {
        value: function PackageDocument() {
            this.super();
        }
    },

    load: {
        value: function () {
            var self = this,
                fileUrl = this.url,
                projectController = this.sharedProjectController;

            return projectController.environmentBridge.listDependenciesAtUrl(fileUrl).then(function(dependencyTree) {
                self._package = dependencyTree.fileJsonRaw || {};
                self.dependencyCollection = dependencyTree; // setter will get correct information
                self._dependencyManager = DependencyManager.create().initWithPackageDocument(self);
                self._packageSavingManager = PackageSavingManager.create().initWithPackageDocument(self);
                self._changeCount = 0;

                var author = PackageTools.getValidPerson(self._package.author);
                self._package.author = author ? author : {
                    name: "",
                    email: "",
                    url: ""
                };

                self._getOutDatedDependencies();
            });
        }
    },

    init: {
        value: function (fileUrl, dataSource, packageRequire) {
            this.super(fileUrl, dataSource, packageRequire);

            var projectController = PackageDocument.sharedProjectController;

            this.sharedProjectController = projectController;
            this.editor = projectController.currentEditor;
            this.environmentBridge = projectController.environmentBridge;

            application.addEventListener("dependencyInstalled", this);
            application.addEventListener("dependencyRemoved", this);

            this.editor.addEventListener("menuValidate", this);
            this.editor.addEventListener("menuAction", this);

            return this;
        }
    },

    sharedProjectController: {
        value: null
    },

    _package: {
        value: null
    },

    _dependencyManager: {
        value: null
    },

    _packageSavingManager: {
        value: null
    },

    _dependencyTree: {
        value: null
    },

    canUndo: {
        get: function () {
            return this.getPath("undoManager.undoCount > 0") && !this.isReloadingList && !this._dependencyManager.isBusy;
        }
    },

    canRedo: {
        get: function () {
            return this.getPath("undoManager.redoCount > 0") && !this.isReloadingList && !this._dependencyManager.isBusy;
        }
    },

    setProperty: {
        value: function (key, value) {
            var response = false;

            if (typeof key === 'string' && PACKAGE_PROPERTIES_ALLOWED_MODIFY.hasOwnProperty(key)) {
                response = true; // Could be the same value.
                var oldValue = this[key];

                if(oldValue !== value) { // Different values.
                    this[key] = value; // Try to set the new value.

                    response = this[key] === value;// Check if the modification has been accepted.

                    if (response && this.undoManager) {
                        var undoArgs = [this.setProperty, this, key, oldValue];

                        this.undoManager.register("Set Package Property", Promise.resolve(undoArgs));

                        this.dispatchEventNamed("packageDocumentDidSetOwnProperty", true, false, {
                            key: key,
                            value: value
                        });
                    }
                }
            }

            return response;
        }
    },

    setAuthorProperty: {
        value: function (key, value) {
            var response = false;

            if (this.author && this.author[key] !== value) {
                var oldValue = this.author[key];

                this.author[key] = value; // Try to set the new value.

                // Check if the modification has been accepted.
                response = this.author[key] === value;

                if (response && this.undoManager) {
                    var undoArgs = [this.setAuthorProperty, this, key, oldValue];

                    this.undoManager.register("Set Author Property", Promise.resolve(undoArgs));

                    this.dispatchEventNamed("packageDocumentDidSetAuthorProperty", true, false, {
                        key: key,
                        value: value
                    });
                }
            }

            return response;
        }
    },

    /*
     * Properties which can be set by the 'setProperty' function
     *
     */

    name: {
        set: function (name) {
            if (PackageTools.isNameValid(name)) {
                this._package.name = name;
            }
        },
        get: function () {
            return this._package.name;
        }
    },

    version: {
        set: function (version) {
            if (PackageTools.isVersionValid(version)) {
                this._package.version = version;
            }
        },
        get: function () {
            return this._package.version;
        }
    },

    description: {
        set: function (description) {
            this._package.description = typeof description === 'string' ? description : '';
        },
        get: function () {
            return this._package.description;
        }
    },

    author: {
        set: function (author) {
            author = PackageTools.getValidPerson(author);

            if (author){
                this._package.author = author;
            }
        },
        get: function () {
            return this._package.author;
        }
    },

    license: {
        set: function (license) {
            this._package.license = typeof license === 'string' ? license : '';
        },
        get: function () {
            return this._package.license;
        }
    },

    private: {
        set: function (privacy) {
            this._package.private = !!privacy;
        },
        get: function () {
            return this._package.private || false;
        }
    },

    homepage: {
        set: function (homepage) {
            this._package.homepage = PackageTools.isUrlValid(homepage) ? homepage : '';
        },
        get: function () {
            return this._package.homepage;
        }
    },

    maintainers: {
        get: function () {
            if (!this._package.maintainers) {
                this._package.maintainers = [];
            }

            return this._package.maintainers;
        }
    },

    _findMaintainerIndex: {
        value: function (person) {
            var maintainers = this.maintainers,
                indexFound = -1;

            if (maintainers && person && typeof person === 'object') {
                maintainers.some(function (maintainer, index) {
                    if (maintainer.name === person.name && maintainer.url === person.url &&
                        maintainer.email === person.email) {

                        indexFound = index;
                    }

                    return indexFound >= 0;
                });
            }

            return indexFound;
        }
    },

    addMaintainer: {
        value: function (maintainer, maintainerIndex) {
            maintainer = PackageTools.getValidPerson(maintainer);

            if (maintainer && typeof maintainer === 'object') {
                if (this._findMaintainerIndex(maintainer) < 0) { // Maintainer Object does not exist.
                    if (typeof maintainerIndex === "number" && maintainerIndex < this.maintainers.length) {
                        this.maintainers.splice(maintainerIndex, 0, maintainer);
                    } else {
                        this.maintainers.push(maintainer);
                        maintainerIndex = this.maintainers.length - 1;
                    }

                    if (this.undoManager) {
                        this.undoManager.register("Add Maintainer", Promise.resolve([this.removeMaintainer, this, maintainer, maintainerIndex]));
                    }
                }

                return true;
            }

            return false;
        }
    },

    removeMaintainer: {
        value: function (maintainer, maintainerIndex) {
            if (maintainer && typeof maintainer === 'object') {
                if (typeof maintainerIndex !== "number" || maintainerIndex >= this.maintainers.length) {
                    maintainerIndex = this._findMaintainerIndex(maintainer);
                }

                if (maintainerIndex >= 0) {
                    if (this.undoManager) {
                        this.undoManager.register("Remove Maintainer", Promise.resolve([this.addMaintainer, this, maintainer, maintainerIndex]));
                    }

                    this.maintainers.splice(maintainerIndex, 1);

                    return true;
                }
            }

            return false;
        }
    },

    replaceMaintainer: {
        value: function (oldMaintainer, newMaintainer, maintainerIndex) {
            if (oldMaintainer && typeof oldMaintainer === 'object' && newMaintainer && typeof newMaintainer === 'object') {
                if (typeof maintainerIndex !== "number" || maintainerIndex >= this.maintainers.length) {
                    maintainerIndex = this._findMaintainerIndex(oldMaintainer);
                }

                if (maintainerIndex >= 0) {
                    if (!PackageTools.isPersonEqual(oldMaintainer, newMaintainer)) {
                        if (this.undoManager) {
                            this.undoManager.register("Modify Maintainer", Promise.resolve([this.replaceMaintainer, this, newMaintainer, oldMaintainer, maintainerIndex]));
                        }

                        this.maintainers.splice(maintainerIndex, 1, newMaintainer);
                    }

                    return true;
                }
            }

            return false;
        }
    },

    /*
     * Dependencies
     *
     */

    _dependencyCollection: {
        value: null
    },

    dependencyCollection: {
        set: function (dependencyTree) {
            if (dependencyTree && typeof dependencyTree === "object") {
                var dependenciesCategories = dependencyTree.children;

                if (!this._dependencyCollection) {
                    this._dependencyCollection = {};
                }

                if (dependenciesCategories && typeof dependenciesCategories === "object") {
                    this._dependencyCollection.dependencies = this._formatDependencyList(dependenciesCategories.regular);
                    this._dependencyCollection.devDependencies = this._formatDependencyList(dependenciesCategories.dev);
                    this._dependencyCollection.optionalDependencies = this._formatDependencyList(dependenciesCategories.optional);
                }

                this._dependencyTree = dependencyTree;
            }
        },
        get : function () {
            return this._dependencyCollection;
        }
    },

    _formatDependencyList: {
        value: function (dependencyList) {
            if (Array.isArray(dependencyList)) {
                dependencyList.forEach(function (dependency) {
                    dependency.state = new DependencyState(dependency);
                });

                return dependencyList;
            }

            return [];
        }
    },

    _isPackageFileHasDependency: {
        value: function (dependencyName, category) {
            if (category) {
                var dependencyList = this._package[category];

                if (dependencyList) {
                    var dependencyListKeys = Object.keys(dependencyList);

                    return dependencyListKeys.some(function (dependencyKey) {
                        return dependencyKey === dependencyName;
                    });
                }

                return false;
            }

            var categoryKeys = Object.keys(DependencyNames),
                self = this;

            return categoryKeys.some(function (categoryKey) {
                return self._isPackageFileHasDependency(dependencyName, DependencyNames[categoryKey]);
            });
        }
    },

    getDependencyInformation: {
        value: function (dependency) {
            if (PackageTools.isDependency(dependency)) {
                if (!dependency.private && !dependency.information) {
                    this.editor.loadingDependency(true); // Display the spinner

                    var self = this,
                        searchRequest = dependency.versionInstalled ?
                            dependency.name + "@" + dependency.versionInstalled : dependency.name;

                    return this.environmentBridge.gatherPackageInformation(searchRequest).then(function (module) {
                        dependency.information = module || {}; // Can be undefined if the version doesn't exists.
                        return dependency;

                    }).fin(function () {
                            self.editor.loadingDependency(false); // Stop the spinner
                        });
                }

                return Promise.resolve(dependency); // The dependency node has already got its information.
            }

            return Promise.reject(new Error("Encountered an error while getting dependency information"));
        }
    },

    dispatchAsyncActivity: {
        value: function (promise, title) {
            this.dispatchEventNamed("asyncActivity", true, false, {
                promise: promise,
                title: title
            });
        }
    },

    _timeoutRefreshID: {
        value: null
    },

    _needRefresh: {
        value: null
    },

    needRefresh: {
        set: function (bool) {
            if (!!bool) {
                if (this._timeoutRefreshID) {
                    clearTimeout(this._timeoutRefreshID);
                    this._timeoutRefreshID = null;
                }

                var self = this;
                this._needRefresh = true;

                this._timeoutRefreshID = setTimeout(function () {
                    if (self._dependencyManager.isBusy) {
                        self._timeoutRefreshID = null;
                        self.needRefresh = true;

                    } else if (self._needRefresh) {
                        self._updateDependenciesList().then(function () {
                            self._needRefresh = false;
                        }).done();
                    }
                }, TIME_BEFORE_REFRESHING);
            } else {
                if (this._timeoutRefreshID) {
                    clearTimeout(this._timeoutRefreshID);
                    this._timeoutRefreshID = null;
                }

                this._needRefresh = false;
            }
        },
        get: function () {
            return this._needRefresh;
        }
    },

    _updateDependenciesList: {
        value: function () {
            var self = this;
            this.isReloadingList = true;

            // invoke list in order to find eventual errors after this removing.
            return self.environmentBridge.listDependenciesAtUrl(this.url).then(function (dependencyTree) {
                self.dependencyCollection = dependencyTree;
                self._dependencyManager.reset();
                self._notifyOutDatedDependencies();
                self._package = dependencyTree.fileJsonRaw || self._package;
                self.dispatchPackagePropertiesChange();
                self.isReloadingList = false;
                self.editor.updateSelectionDependencyList();
            });
        }
    },

    dispatchPackagePropertiesChange: {
        value: function () {
            var keys = Object.keys(PACKAGE_PROPERTIES_ALLOWED_MODIFY),
                self = this;

            keys.forEach(function (key) {
                self.dispatchOwnPropertyChange(key, self._package[key]);
            });
        }
    },

    isReloadingList: {
        value: false
    },

    _updateDependenciesAfterSaving: {
        value: function () {
            var self = this;

            return this._updateDependenciesList().then(function () {
                return self._updateLibraryGroups();
            });
        }
    },

    _updateLibraryGroups: {
        value: function () {
            var self = this;

            return this.environmentBridge.projectInfo(this.environmentBridge.projectUrl).then(function (projectInfo) {
                self.sharedProjectController.dependencies = projectInfo.dependencies;
                return self.sharedProjectController.populateLibrary();
            });
        }
    },

    _findDependency: {
        value: function (name, type) {
            if (!type) { // if type not specified, search inside any
                var keys = Object.keys(this._dependencyCollection);

                for (var i = 0, length = keys.length; i < length; i++) {
                    var response = this._findDependency(name, keys[i]);
                    if (typeof response !== 'undefined') {
                        return response;
                    }
                }
            } else if (this._dependencyCollection.hasOwnProperty(type)) {
                var dependencies = this._dependencyCollection[type];
                for (var k = 0, len = this._dependencyCollection[type].length; k < len; k++) {
                    if (dependencies[k].name === name) {
                        return {
                            key: k,
                            dependency: dependencies[k]
                        };
                    }
                }
            }
        }
    },

    findDependency: {
        value: function (name, type, index) {
            var response = this._findDependency(name, type);

            if (typeof index === 'function') {
                var args = (response) ? [response.key, response.dependency] : [];
                index(args[0], args[1]);
            } else {
                if (!!index) {
                    return response ? response.key : -1;
                }
                return response ? response.dependency : null;
            }
        }
    },

    updateDependency: {
        value: function (name, version) {
            var dependency = this.findDependency(name);

            if (dependency) {
                var promise = null;

                if (semver.satisfies(version, dependency.version)) {
                    promise = this._dependencyManager.updateDependency(name, version);

                    this.dispatchAsyncActivity(promise, "Updating Dependency");

                } else {
                    var confirmCloseDialogOptions = {
                            message: "This selected version will change the dependency range",
                            okLabel: "Ok",
                            cancelLabel: "Cancel"
                        },

                        self = this,
                        deferred = Promise.defer();

                    Confirm.show(confirmCloseDialogOptions, function () {
                        self.dispatchAsyncActivity(promise, "Updating Dependency");

                        self.updateDependencyRange(name, version); // update the dependency range

                        // save package.json and install new dependency version.
                        self._dependencyManager.updateDependency(name, version).then(function (message) {
                            return self.environmentBridge.save(self, self.url).then(function () {
                                deferred.resolve(message);
                            });
                        }, deferred.reject);
                    });

                    promise = deferred.promise;
                }

                return promise;
            }

            return Promise.reject(new Error ("dependency does not exist"));
        }
    },

    repairDependency: {
        value: function (name) {
            var promise = this._dependencyManager.repairDependency(name);
            this.dispatchAsyncActivity(promise, "Repairing Dependency");

            return promise;
        }
    },

    installDependency: {
        value: function (name, version, type) {
            var undoArgs = [this.uninstallDependency, this, name];

            if (!this._findDependency(name)) {
                var dependency = new Dependency(name, version, type);

                this._addDependencyToCollection(dependency);
            }

            this._dependencyManager.installDependency(name, version);
            this.undoManager.register("Install Dependency", Promise.resolve(undoArgs));
        }
    },

    handleDependencyInstalled: {
        value: function (event) {
            //If names are different or version missing
            var dependencyInstalled = event.detail.installed,
                dependency = this.findDependency(dependencyInstalled.requestedName);

            if (dependency) {
                if (dependencyInstalled.name !== dependency.name || !dependency.version) {
                    this._removeDependencyFromCollection(dependency);

                    dependency.name = dependencyInstalled.name;
                    dependency.versionInstalled = dependencyInstalled.version;

                    dependency.version = PackageTools.isNpmCompatibleGitUrl(dependency.version) ?
                        dependency.version : dependency.versionInstalled;

                    this._addDependencyToCollection(dependency);
                }

                dependency.missing = false;
                dependency.isBusy = false;
                dependency.state.pendingInstall = false;
            }
        }
    },

    handleDependencyRemoved: {
        value: function (event) {
            var dependencyRemoved = event.detail.removed,
                dependency = this.findDependency(dependencyRemoved.name);

            if (dependency) {
                this._removeDependencyFromCollection(dependency);
            }
        }
    },

    uninstallDependency: {
        value: function (dependency) {
            dependency = typeof dependency === 'string' ? this.findDependency(dependency) : dependency;

            if (PackageTools.isDependency(dependency)) {
                var name = dependency.name;

                if (this.isDependencyRequired(name)) {
                    throw new Error('Can not uninstall the dependency ' + name + ', required by the App');
                }

                var undoArgs = [this.installDependency, this, dependency.name, dependency.version, dependency.type];

                this._dependencyManager.removeDependency(name);
                this.undoManager.register("Uninstall Dependency", Promise.resolve(undoArgs));

                return true;
            }

            return false;
        }
    },

    switchDependencyType: {
        value: function (dependency, type) {
            if (PackageTools.isDependency(dependency) && type) {
                if (dependency.type === type) {
                    return Promise.resolve(true);
                }

                if (dependency.extraneous || dependency.isBusy || this.isReloadingList) {
                    var promise = Promise.reject(new Error ('Can not change a dependency type either the dependency is ' +
                        'extraneous or an action is performing'));

                    this.dispatchAsyncActivity(promise, "Package Manager");
                } else {
                    this._removeDependencyFromCollection(dependency);

                    var undoArgs = [this.switchDependencyType, this, dependency, dependency.type];
                    dependency.type = type;

                    this._addDependencyToCollection(dependency);
                    this.editor.updateSelectionDependencyList();
                    this.undoManager.register("Switch Dependency", Promise.resolve(undoArgs));

                    return Promise.resolve(true);
                }
            }

            return Promise.reject(new Error ('An error has occurred while switching dependency type'));
        }
    },

    _addDependencyToCollection: {
        value: function (dependency, isBusy) {
            if (PackageTools.isDependency(dependency)) {
                var self = this;

                this.findDependency(dependency.name, null, function (index, dependencyFound) {
                    var version = PackageTools.isVersionValid(dependency.versionInstalled) ? dependency.versionInstalled : null;

                    if (!version) {
                        version = PackageTools.isVersionValid(dependency.version) ? dependency.version : '';
                    }

                    dependency.versionInstalled = version;
                    dependency.type = dependency.type || DependencyNames.regular;
                    dependency.isBusy = !!isBusy;

                    if (index >= 0) { // already within the dependencies list.
                        var oldDependency = self._dependencyCollection[dependencyFound.type].splice(index, 1),
                            versionInstalled = dependency.versionInstalled;

                        if (!dependencyFound.missing && versionInstalled.length > 0 &&
                            versionInstalled === oldDependency[0].versionInstalled) {

                            dependency.missing = false;
                        }
                    }

                    self._dependencyCollection[dependency.type].push(dependency);
                });
            }
        }
    },

    _removeDependencyFromCollection: {
        value: function (dependency) {
            var self = this;

            this.findDependency(dependency.name || dependency, null, function (index, dependencyFound) {
                if (index >= 0) { // already within the dependencies list.
                    self._dependencyCollection[dependencyFound.type].splice(index, 1); // Remove dependency found
                }
            });
        }
    },

    _saveDependencyCollectionToPackageJson: {
        value: function () {
            var dependencyCategoryKeys = Object.keys(this._dependencyCollection),
                self = this;

            dependencyCategoryKeys.forEach(function (key) {
                self._package[key] = self._dependencyCollectionToObject(self._dependencyCollection[key]);
            });
        }
    },

    _dependencyCollectionToObject: {
        value: function (dependencyCollection) {
            var ObjectContainer = {};

            if (Array.isArray(dependencyCollection)) {
                dependencyCollection.forEach(function (dependency) {
                    var dependencyName = dependency.name;

                    if (typeof dependencyName === "string" && !dependency.state.pendingRemoval) {
                        ObjectContainer[dependencyName] = dependency.version || "";
                    }
                });
            }

            return ObjectContainer;
        }
    },

    _outDatedDependencies: {
        value: null
    },

    _notifyOutDatedDependencies: {
        value: function () {
            var outDatedDependencies = this._outDatedDependencies;

            if (outDatedDependencies) {
                var keys = Object.keys(outDatedDependencies);

                for (var i = 0, length = keys.length; i < length; i++) {
                    var key = keys[i],
                        dependency = this.findDependency(key);

                    if (dependency) {
                        var update = outDatedDependencies[key];

                        if (dependency.versionInstalled  !== update.available &&
                            semver.satisfies(update.available, dependency.version)) {

                            dependency.update = update;
                        }
                    }
                }
            }
        }
    },

    _getOutDatedDependencies: {
        value: function () {
            var self = this,
                promise = this.environmentBridge.findOutdatedDependency().then(function (updates) {
                    var keys = Object.keys(updates);

                    for (var i = 0, length = keys.length; i < length; i++) { // temporary fix because npm outdated is buggy.
                        var dependency = self.findDependency(keys[i], null, false);
                        if (!dependency || dependency.private || dependency.problems) {
                            delete updates[keys[i]];
                        }
                    }

                    self._outDatedDependencies = updates;
                    self._notifyOutDatedDependencies();

                    return defaultLocalizer.localize("num_updates").then(function (messageFn) {
                        return messageFn({updates:Object.keys(updates).length});
                    });
                });

            this.dispatchAsyncActivity(promise, "Searching for updates");
        }
    },

    isRangeValid: {
        value: function (range) {
            return !!semver.validRange(range) || PackageTools.isNpmCompatibleGitUrl(range);
        }
    },

    isDependencyRequired: {
        value: function (dependency) {
            var name = null;

            if (dependency) {
                if (typeof dependency === "string") {
                    name = dependency;
                } else if (typeof dependency.name === "string") {
                    name = dependency.name;
                }
            }

            return name ? DEPENDENCIES_REQUIRED.indexOf(name.toLowerCase()) >= 0 : false;
        }
    },

    updateDependencyRange: {
        value: function (dependencyName, range) {
            var dependency = null;

            if (typeof dependencyName === "string" && PackageTools.isNameValid(dependencyName)) {
                dependency = this.findDependency(dependencyName); // try to find the dependency related to the name
            } else if (dependencyName && typeof dependencyName === "object") {
                dependency = dependencyName;
            }

            if (dependency && !dependency.extraneous && (this.isRangeValid(range) || PackageTools.isNpmCompatibleGitUrl(range))) {
                var undoArgs = [this.updateDependencyRange, this, dependencyName, dependency.version];
                dependency.version = range.trim();

                this.undoManager.register("Change Dependency's Range", Promise.resolve(undoArgs));

                return true;
            }

            return false;
        }
    },

    handleMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = evt.detail.identifier;

            if ("undo" === identifier) {
                menuItem.enabled = this.canUndo;
                menuItem.title = this.canUndo ? "Undo " + this.undoManager.undoLabel : "Undo";
                evt.stop();
            } else if ("redo" === identifier) {
                menuItem.enabled = this.canRedo;
                menuItem.title = this.canRedo ? "Redo " + this.undoManager.redoLabel : "Redo";
                evt.stop();
            }
        }
    },

    handleMenuAction: {
        value: function (evt) {
            var identifier = evt.detail.identifier;

            if ("undo" === identifier) {
                if (this.canUndo) {
                    this.undo().done();
                }
                evt.stop();
            } else if ("redo" === identifier) {
                if (this.canRedo) {
                    this.redo().done();
                }
                evt.stop();
            }
        }
    },

    _packageFileChangeByAppCount: {
        value: 0
    },

    filesDidChange: {
        value: function (files) {
            // Refresh the PackageManager when the Package.json file has not been modified by the app,
            // Or when a module has been added manually.
            // Refreshing will be not apply if the DependencyManager is performing some actions

            if (this._dependencyManager && !this._dependencyManager.isBusy && this.sharedProjectController && files) {
                var self = this;

                files.forEach(function (file) {
                    var fileUrl = file.fileUrl,
                        pattern = "^" + self.sharedProjectController.projectUrl + "/node_modules/(.*)/$",
                        isModuleChanged = new RegExp(pattern).test(fileUrl);

                    if (isModuleChanged) {
                        self.needRefresh = true;
                    } else if (self.url === fileUrl) { // Package.json file has not been modified by the app.
                        if (self._packageFileChangeByAppCount === 0) {
                            self.needRefresh = true;
                        } else {
                            self._packageFileChangeByAppCount--;
                        }
                    }
                });
            }
        }
    },

    toJSON: {
        value: function () {
            this._saveDependencyCollectionToPackageJson();

            var packageJson = null,
                endLine = this._dependencyTree.endLine ? "\n" : "";

            try {
                packageJson = JSON.stringify(this._package, function (key, value) {

                    if ((!value && PACKAGE_PROPERTIES_ALLOWED_MODIFY[key]) ||
                        (Array.isArray(value) && value.length === 0) ||
                        (value && typeof value === "object" && (Object.keys(value).length === 0 ||
                            (key === PACKAGE_PROPERTIES_ALLOWED_MODIFY.author && PackageTools.isPersonObjectEmpty(value))))) {

                        return void 0;
                    }

                    return value;

                }, 4) + endLine;

            } catch (exception) {

                throw exception;
            }

            return packageJson;
        }
    },

    _writePackageJson: {
        value: function (packageJson, url, dataSource) {
            var self = this;

            return Promise.when(dataSource.write(url, packageJson)).then(function (value) {
                self._changeCount = 0;
                self._packageFileChangeByAppCount++;

                return value;
            });
        }
    },

    save: {
        value: function (url) {
            return this._packageSavingManager.scheduleSaving(url, this._dataSource);
        }
    }

}, {
    editorType: {
        get: function () {
            return PackageEditor;
        }
    }
});
