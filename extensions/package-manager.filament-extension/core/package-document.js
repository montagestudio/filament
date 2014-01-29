var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("../ui/package-editor.reel").PackageEditor,
    DependencyManager = require('./dependency-manager').DependencyManager,
    Promise = require("montage/core/promise").Promise,
    Dependency = require('./dependency').Dependency,
    Tools = require('./package-tools'),
    semver = require('semver'),
    PackageTools = Tools.ToolsBox,
    DependencyNames = Tools.DependencyNames,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,

    DEFAULT_TIME_AUTO_SAVE = 400,
    DEPENDENCY_TIME_AUTO_SAVE = 100,
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

exports.PackageDocument = EditingDocument.specialize( {

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this,
                projectController = this.sharedProjectController;

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return projectController.environmentBridge.listDependenciesAtUrl(fileUrl).then(function(dependencyTree) {
                    return self.create().init(fileUrl, packageRequire, projectController, dependencyTree);
                });
            });
        }
    },

    init: {
        value: function (fileUrl, packageRequire, projectController, dependencyTree) {
            this.super(fileUrl, packageRequire);

            this._livePackage = packageRequire.packageDescription;
            this.sharedProjectController = projectController;
            this.editor = projectController.currentEditor;
            this.environmentBridge = projectController.environmentBridge;
            this._package = dependencyTree.fileJsonRaw || {};
            this.dependencyCollection = dependencyTree;

            var author = PackageTools.getValidPerson(this._package.author);

            this._package.author = author ? author : {
                name: "",
                email: "",
                url: ""
            };

            this._dependencyManager = DependencyManager.create().initWithEnvironmentBridge(this.environmentBridge);

            this._getOutDatedDependencies();

            return this;
        }
    },

    editorType: {
        get: function () {
            return PackageEditor;
        }
    },

    sharedProjectController: {
        value: null
    },

    _livePackage: {
        value: null
    },

    _package: {
        value: null
    },

    _dependencyManager: {
        value: null
    },

    setProperty: {
        value: function (key, value) {
            var response = false;

            if (typeof key === 'string' && PACKAGE_PROPERTIES_ALLOWED_MODIFY.hasOwnProperty(key)) {
                response = true; // Could be the same value.

                switch (key) {

                    case PACKAGE_PROPERTIES_ALLOWED_MODIFY.author:
                        if (!PackageTools.isPersonEqual(this[key], value)) { // Different values.
                            this[key] = value; // Try to set the new value.
                            // Check if the modification has been accepted.
                            response = PackageTools.isPersonEqual(this[key], value);

                            if (response && this.undoManager) {
                                this.undoManager.register("Set Property", Promise.resolve([this.setProperty, this, key, value]));
                            }
                        }
                        break;

                    default:
                        if(this[key] !== value) { // Different values.
                            this[key] = value; // Try to set the new value.
                            response = this[key] === value;// Check if the modification has been accepted.

                            if (response && this.undoManager) {
                                this.undoManager.register("Set Property", Promise.resolve([this.setProperty, this, key, value]));
                            }
                        }
                        break;
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
                this._livePackage.name = this._package.name = name;
                this._modificationsAccepted();
            }
        },
        get: function () {
            return this._package.name;
        }
    },

    version: {
        set: function (version) {
            if (PackageTools.isVersionValid(version)) {
                this._livePackage.version = this._package.version = version;
                this._modificationsAccepted();
            }
        },
        get: function () {
            return this._package.version;
        }
    },

    description: {
        set: function (description) {
            if (typeof description === 'string') {
                this._package.description = description;
                this._modificationsAccepted();
            }
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
                this._modificationsAccepted();
            }
        },
        get: function () {
            return this._package.author;
        }
    },

    license: {
        set: function (license) {
            if (typeof license === 'string') {
                this._package.license = license;
                this._modificationsAccepted();
            }
        },
        get: function () {
            return this._package.license;
        }
    },

    private: {
        set: function (privacy) {
            if (typeof privacy === "boolean") {
                this._package.private = privacy;
                this._modificationsAccepted();
            }
        },
        get: function () {
            return this._package.private;
        }
    },

    homepage: {
        set: function (homepage) {
            this._package.homepage = PackageTools.isUrlValid(homepage) ? homepage : '';
            this._modificationsAccepted();
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
        value: function (maintainer, saveModification) {
            maintainer = PackageTools.getValidPerson(maintainer);

            if (maintainer) {
                if (this._findMaintainerIndex(maintainer) < 0) { // Already exists. Must be unique.
                    this.maintainers.push(maintainer);
                }

                if (saveModification) {
                    this.saveModification().done();
                }

                return true;
            }
            return false;
        }
    },

    removeMaintainer: {
        value: function (maintainer, saveModification) {
            if (maintainer && typeof maintainer === 'object') {
                var maintainerIndex = this._findMaintainerIndex(maintainer);

                if (maintainerIndex >= 0) {
                    this.maintainers.splice(maintainerIndex, 1);

                    if (saveModification) {
                        this.saveModification().done();
                    }

                    return true;
                }
            }

            return false;
        }
    },

    replaceMaintainer: {
        value: function (oldMaintainer, newMaintainer) {
            var maintainerIndex = this._findMaintainerIndex(oldMaintainer);

            if (maintainerIndex >= 0 && this.removeMaintainer(maintainerIndex, false) && this.addMaintainer(newMaintainer, false)) {
                this.saveModification().done();

                return true;
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
            var dependenciesCategories = dependencyTree.children;

            if (!this._dependencyCollection) {
                this._dependencyCollection = {};
            }

            if (dependenciesCategories && typeof dependenciesCategories === "object") {
                this._dependencyCollection.dependencies = dependenciesCategories.regular || [];
                this._dependencyCollection.devDependencies = dependenciesCategories.dev || [];
                this._dependencyCollection.optionalDependencies = dependenciesCategories.optional || [];
            }
        },
        get : function () {
            return this._dependencyCollection;
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

    _updateDependenciesList: {
        value: function () {
            var self = this;
            this.isReloadingList = true;

            // invoke list in order to find eventual errors after this removing.
            return self.environmentBridge.listDependenciesAtUrl(this.url).then(function (dependencyTree) {
                self.dependencyCollection = dependencyTree;
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
        value: function (name, version, type) {
            return this.installDependency(name, version, type, "Updating dependency").then(function () {
                return 'The dependency ' + name + ' has been updated';
            });
        }
    },

    installDependency: {
        value: function (name, version, type, messageStatus) {
            var self = this,
                dependency = new Dependency(name, version, type);

            this._addDependencyToCollection(dependency, true);
            this.editor.notifyDependenciesListChange(dependency.name, Dependency.INSTALLING_DEPENDENCY_ACTION);

            var promise = this._dependencyManager.installDependency(dependency.name, dependency.version).then(function (dependencyInstalled) {

                if (PackageTools.isDependency(dependencyInstalled)) {

                    // If names are different or version missing
                    if (dependencyInstalled.name !== dependency.name || !dependency.version) {
                        self._removeDependencyFromCollection(dependency);

                        dependency.name = dependencyInstalled.name;
                        dependency.versionInstalled = dependencyInstalled.version;

                        dependency.version = PackageTools.isGitUrl(dependency.version) ?
                            dependency.version : dependency.versionInstalled;

                        self._addDependencyToCollection(dependency);
                    }

                    dependency.missing = false;
                    self.editor.notifyDependenciesListChange(dependency.name, Dependency.INSTALL_DEPENDENCY_ACTION);

                    return 'The dependency ' + dependencyInstalled.name + ' has been installed';
                }

                self.editor.notifyDependenciesListChange(dependency.name, Dependency.ERROR_INSTALL_DEPENDENCY_ACTION);

                throw new Error('An error has occurred while installing the dependency ' + dependency.name);

            }).finally(function () {
                dependency.isBusy = false;
                self._handleDependencyActionDone();
            });

            this.dispatchAsyncActivity(promise, messageStatus || "Installing dependency");

            return promise;
        }
    },

    uninstallDependency: {
        value: function (dependency, messageStatus) {
            dependency = typeof dependency === 'string' ? this.findDependency(dependency) : dependency;

            if (PackageTools.isDependency(dependency)) {
                var name = dependency.name,
                    deferred = Promise.defer(),
                    message = 'The dependency ' + name + ' has been removed',
                    self = this;

                if (DEPENDENCIES_REQUIRED.indexOf(name.toLowerCase()) >= 0) {
                    deferred.reject(new Error('Can not uninstall the dependency ' + name + ', required by Lumieres'));
                }

                dependency.isBusy = true;

                if (!dependency.missing) {
                    this._dependencyManager.removeDependency(name).then(function () {
                        self._removeDependencyFromCollection(name);
                        deferred.resolve(message);
                    }, deferred.reject).finally(function () {
                            self._handleDependencyActionDone();
                        }).done();
                } else {
                    this._removeDependencyFromCollection(name);
                    deferred.resolve(message);
                    this._handleDependencyActionDone();
                }

                self.editor.notifyDependenciesListChange(name, Dependency.REMOVE_DEPENDENCY_ACTION);

                this.dispatchAsyncActivity(deferred.promise, messageStatus || "Removing dependency");

                return deferred.promise;
            }

            return Promise.reject(new Error('An error has occurred while removing a dependency'));
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

                    dependency.type = type;

                    this._addDependencyToCollection(dependency);
                    this._handleDependencyActionDone();

                    return Promise.resolve(true);
                }
            }

            return Promise.reject(new Error ('An error has occurred while switching dependency type'));
        }
    },

    _addDependencyToCollection: {
        value: function (dependency, isBusy) {
            if (PackageTools.isDependency(dependency) && dependency.hasOwnProperty('version')) {
                var self = this;

                this.findDependency(dependency.name, null, function (index, dependencyFound) {
                    if (index >= 0) { // already within the dependencies list.
                        self._dependencyCollection[dependencyFound.type].splice(index, 1); // Remove dependency found
                    }

                    dependency.type = dependency.type || DependencyNames.regular;
                    dependency.isBusy = !!isBusy;

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

    _handleDependencyActionDone: {
        value: function () {
            if (!this._dependencyManager.isBusy) {
                this._saveDependencyCollectionToPackageJson();
                this._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE, true);
            }
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

                    if (typeof dependencyName === "string") {
                        ObjectContainer[dependencyName] = dependency.version;
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
            return !!semver.validRange(range) || PackageTools.isGitUrl(range);
        }
    },

    updateDependencyRange: {
        value: function (dependency, range) {
            if (typeof dependency === "string" && PackageTools.isNameValid(dependency)) {
                dependency = this.findDependency(dependency); // try to find the dependency related to the name
            }

            if (PackageTools.isDependency(dependency) && !dependency.extraneous && dependency.hasOwnProperty("type") &&
                (this.isRangeValid(range) || PackageTools.isGitUrl(range))) {

                var dependencyCategory = this._package[dependency.type];

                if (dependencyCategory && dependencyCategory[dependency.name]) {
                    dependencyCategory[dependency.name] = range.trim();
                    this._modificationsAccepted(DEFAULT_TIME_AUTO_SAVE, true);

                    return true;
                }
            }

            return false;
        }
    },

    _packageFileChangeByAppCount: {
        value: 0
    },

    filesDidChange: {
        value: function (files) {
            // Update the PackageManager when the Package.json file has not been changed by the app,
            // except when the PackageQueueManager is performing some actions, it will reload the list
            // once it will be done.

            var self = this;

            files.forEach(function (file) {
                if (self.url === file.fileUrl) { // Package.json file has been modified.
                    if (self._packageFileChangeByAppCount === 0) {
                        if (!this._dependencyManager.isBusy || !self.isReloadingList) {
                            self._updateDependenciesList().done();
                        }
                    } else {
                        self._packageFileChangeByAppCount--;
                    }
                }
            });
        }
    },

    _saveTimer: {
        value: null
    },

    _modificationsAccepted: {
        value: function (time, updateDependencies) {
            var self = this;
            time = (typeof time === "number") ? time : DEFAULT_TIME_AUTO_SAVE;

            if (this._saveTimer) {
                clearTimeout(this._saveTimer);
            }

            this._saveTimer = setTimeout(function () {
                self.saveModification(updateDependencies).then(function () {
                    self._saveTimer = null;
                }).done();
            }, time);
        }
    },

    saveModification: {
        value: function (updateDependencies) {
            var self = this;

            return this.environmentBridge.save(this, this.url).then(function () {
                if (!!updateDependencies) {
                    return self._updateDependenciesAfterSaving();
                }
            });
        }
    },

    _censorPackageJsonField: {
        value: function (key, value) {
            if ((!value && PACKAGE_PROPERTIES_ALLOWED_MODIFY[key]) ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === "object" && (Object.keys(value).length === 0 ||
                    (key === PACKAGE_PROPERTIES_ALLOWED_MODIFY.author && PackageTools.isPersonObjectEmpty(value))))) {

                return void 0;
            }

            return value;
        }
    },

    save: {
        value: function (url, dataWriter) {
            var self = this,
                jsonPackage = JSON.stringify(this._package, this._censorPackageJsonField, 4);

            return Promise.when(dataWriter(jsonPackage, url)).then(function (value) {
                self._changeCount = 0;
                self._packageFileChangeByAppCount++;

                return value;
            });
        }
    }

});
