var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("../ui/package-editor.reel").PackageEditor,
    Tools = require('./package-tools'),
    PackageQueueManager = require('./packages-queue-manager').PackageQueueManager,
    Promise = require("montage/core/promise").Promise,
    Dependency = require('./dependency').Dependency,
    semver = require('semver'),
    PackageTools = Tools.ToolsBox,
    ErrorsCommands = Tools.Errors.commands,
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
            var self = this;

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return self.create().init(fileUrl, packageRequire, self.sharedProjectController);
            });
        }
    },

    init: {
        value: function (fileUrl, packageRequire, projectController) {
            var self = this.super.call(this, fileUrl, packageRequire);

            PackageQueueManager.load(this, '_handleDependenciesListChange');
            this._livePackage = packageRequire.packageDescription;
            this.sharedProjectController = projectController;
            this.editor = projectController.currentEditor;

            return this.getApplicationSupportUrl().then(function (url) {
                self.applicationSupportUrl = url;

                return self.packageManagerPlugin.invoke("loadPackageManager", self.projectUrl, url).then(function (loaded) {
                    if (!loaded) {
                        throw new Error("An error has occurred while PackageManager was loading");
                    }

                    return self.listDependencies().then(function(app) { // invoke the custom list command, which check every dependencies installed.
                        self._package = app.file || {};
                        self._classifyDependencies(app.dependencies, false); // classify dependencies

                        self._getOutDatedDependencies();
                        return self;
                    });
                });
            });
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

    _packageManagerPlugin: {
        value: null
    },

    packageManagerPlugin: {
        get: function () {
            if (!this._packageManagerPlugin && this.sharedProjectController) {
                this._packageManagerPlugin = this.sharedProjectController.environmentBridge.backend.get("package-manager");
            }
            return this._packageManagerPlugin;
        }
    },

    _projectUrl: {
        value: null
    },

    projectUrl: {
        get: function () {
            if (!this._projectUrl && this.sharedProjectController) {
                this._projectUrl = this.sharedProjectController.environmentBridge.convertBackendUrlToPath(this.sharedProjectController.projectUrl);
            }
            return this._projectUrl;
        }
    },

    applicationSupportUrl: {
        value: null
    },

    getApplicationSupportUrl: {
        value: function () {
            var self = this;

            return this.sharedProjectController.environmentBridge.backend.get("application")
                .invoke("specialFolderURL", "application-support").then(function(folder) {
                    return self.sharedProjectController.environmentBridge.convertBackendUrlToPath(folder.url.replace("%20", " "));
                });
        }
    },

    _livePackage: {
        value: null
    },

    _package: {
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
            if (PackageTools.isUrlValid(homepage)) {
                this._package.homepage = homepage;
                this._modificationsAccepted();
            }
        },
        get: function () {
            return this._package.homepage;
        }
    },

    addMaintainer: {
        value: function (maintainer) {
            maintainer = PackageTools.getValidPerson(maintainer);

            if (maintainer) {
                if (this._findMaintainerIndex(maintainer) >= 0) { // Already exists. Must be unique.
                    return true;
                }

                if (this._addMaintainer(maintainer)) {
                    this.saveModification();
                    return true;
                }
            }
            return false;
        }
    },

    _addMaintainer: {
        value: function (maintainer) {
            var maintainers = this.maintainers,
                length = maintainers.length;

            maintainers.push(maintainer);
            return maintainers.length > length;
        }
    },

    _findMaintainerIndex: {
        value: function (person) {
            var maintainers = this.maintainers;

            if (maintainers && person && typeof person === 'object') {
                for (var i = 0, length = maintainers.length; i < length; i++) {
                    var maintainer = maintainers[i];

                    if (maintainer.name === person.name &&
                        maintainer.url === person.url && maintainer.email === person.email) {

                        return i;
                    }
                }
            }
            return -1;
        }
    },

    replaceMaintainer: {
        value: function (old, person) {
            var index = this._findMaintainerIndex(old);

            if (index >= 0 && this._removeMaintainer(index) && this._addMaintainer(person)) {
                this.saveModification();
                return true;
            }
            return false;
        }
    },

    removeMaintainer: {
        value: function (maintainer) {
            if (maintainer && typeof maintainer === 'object') {
                if (this._removeMaintainer(this._findMaintainerIndex(maintainer))) {
                    this.saveModification();
                    return true;
                }
            }
            return false;
        }
    },

    _removeMaintainer: {
        value: function (index) {
            return index >= 0 && this.maintainers.splice(index, 1).length > 0;
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

    /*
     * Dependencies
     *
     */

    _dependencyCollection: {
        value: null
    },

    dependencyCollection: {
        get : function () {
            return this._dependencyCollection;
        }
    },

    listDependencies: {
        value: function () {
            return this.packageManagerPlugin.invoke("listDependencies", this.projectUrl);
        }
    },

    _updateDependenciesList: {
        value: function () {
            var self = this;
            this.isReloadingList = true;

            return self.listDependencies().then(function (app) { // invoke list in order to find eventual errors after this removing.
                self._classifyDependencies(app.dependencies, false); // classify dependencies
                self._notifyOutDatedDependencies();
                self._package = app.file || self._package;
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

    _resetDependencies: {
        value: function () {
            if (!this._dependencyCollection) {
                this._dependencyCollection = {};
            }

            this._dependencyCollection.dependencies = [];
            this._dependencyCollection.devDependencies = [];
            this._dependencyCollection.optionalDependencies = [];
        }
    },

    isReloadingList: {
        value: false
    },

    _handleDependenciesListChange: {
        value: function (modules) {
            if (Array.isArray(modules) && modules.length > 0) {
                if (this._saveTimer || this._savingInProgress) { // A saving request has been scheduled,
                    // need to save the package.json file before invoking the list command.

                    clearTimeout(this._saveTimer);
                    var self = this;

                    if (!this._savingInProgress) {
                        this._saveTimer = null;

                        this.saveModification().then(function () {
                            self._updateDependenciesAfterSaving();
                        });
                    } else {
                        this._savingInProgress.then(function () { // saving in progress, can take some time
                            self._updateDependenciesAfterSaving();
                        });
                    }
                } else {
                    this._updateDependenciesAfterSaving();
                }
            }
        }
    },

    _updateDependenciesAfterSaving: {
        value: function () {
            var self = this;

            this._updateDependenciesList().then(function () {
                self._updateLibraryGroups();
            }).done();
        }
    },

    _updateLibraryGroups: {
        value: function () {
            var self = this;

            return this.sharedProjectController.environmentBridge.projectInfo(this.projectUrl).then(function (projectInfo) {
                self.sharedProjectController.dependencies = projectInfo.dependencies;
                return self.sharedProjectController.populateLibrary();
            });
        }
    },

    _fixDependencyError: {
        value: function (dependency) {
            if (!!dependency.extraneous) { // if this dependency is missing within the package.json file, then fix it.
                this._package.dependencies[dependency.name] = dependency.versionInstalled;

                for (var i = 0, length = dependency.problems.length; i < length; i++) { // remove the error from the errors containers.
                    var error = dependency.problems[i];

                    if (error.name === dependency.name && error.type === ErrorsCommands.list.codes.extraneous) {
                        dependency.problems.splice(parseInt(i, 10),1);
                        break;
                    }
                }
                return true;
            }
            return false;
        }
    },

    _classifyDependencies: {
        value: function (dependencies, fixError) {
            if (dependencies) {
                this._resetDependencies();
                var fixedErrors = false,
                    type = null,
                    dependencyCollection = this._dependencyCollection;

                fixedErrors = dependencies.reduce(function (fixed, dependency) {
                    if (fixError) {
                        fixed = fixed || this._fixDependencyError(dependency);
                    }

                    if (dependency.hasOwnProperty('type')) {
                        type = DependencyNames[dependency.type];

                        if (type) {
                            dependencyCollection[type].push(dependency);
                        } else {
                            throw new Error('Encountered dependency with unexpected type "' + dependency.type +'"');
                        }
                    }
                    return fixed;

                }, fixedErrors);

                if (fixedErrors) {
                    this.saveModification();
                }
            }
        }
    },

    getInformationDependency: {
        value: function (dependency) {
            if (PackageTools.isDependency(dependency)) {
                if (!dependency.private && !dependency.information) {
                    this.editor.loadingDependency(true);
                    var search = (dependency.versionInstalled) ? dependency.name + "@" + dependency.versionInstalled : dependency.name,
                        self = this;

                    return this._packageManagerPlugin.invoke("viewDependency", search).then(function (module) {
                        dependency.information = module || {}; // Can be null if the version doesn't exists.
                        return dependency;
                    }).fin(function () {
                        self.editor.loadingDependency(false);
                    });
                }
                return Promise.resolve(dependency);
            }
            return Promise.reject(new Error("Encountered an error while getting dependency information"));
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

    performActionDependency: {
        value: function (action, dependency) {
            var promise = null,
                title = null;

            if (!dependency) {
                promise = Promise.reject(new Error("Dependency Information is missing"));
            }

            if (!promise) { // No errors.
                if (action === Dependency.INSTALL_DEPENDENCY_ACTION) {
                    promise = this.installDependency(dependency, true);
                    title = "Installing";
                } else if (action === Dependency.REMOVE_DEPENDENCY_ACTION) {
                    promise = this.uninstallDependency(dependency);
                    title = "Uninstalling";
                } else if (action === Dependency.UPDATE_DEPENDENCY_ACTION) {
                    promise = this.updateDependency(dependency);
                    title = "Updating";
                } else {
                    promise = Promise.reject(new Error("Action not recognized"));
                    title = "Error";
                }
            }

            this.dispatchEventNamed("asyncActivity", true, false, {
                promise: promise,
                title: title
            });

            return promise;
        }
    },

    updateDependency: {
        value: function (dependency) {
            if (PackageTools.isDependency(dependency) && PackageTools.isNameValid(dependency.name) &&
                PackageTools.isVersionValid(dependency.version)) {

                return this.installDependency(dependency, false);
            }
            return Promise.reject(new Error("The dependency name and version are required"));
        }
    },

    installDependency: {
        value: function (dependency, install) { // install action (not update) => force the range to be the version installed.
            var self = this,
                module = dependency;

            module.versionInstalled = PackageTools.isVersionValid(module.version) ? module.version : null; // if git url
            module.performingAction = true;

            this._insertDependency(module, true, install); // Insert and Save
            self.editor.notifyDependenciesListChange(module.name, Dependency.INSTALLING_DEPENDENCY_ACTION);

            return PackageQueueManager.installModule(module).then(function (installed) {
                if (PackageTools.isDependency(installed)) {
                    module.performingAction = false;

                    if (installed.name !== module.name || !module.version) { // If names are different or version missing
                        self._removeDependencyFromFile(module, false);
                        module.name = installed.name;
                        module.version = PackageTools.isGitUrl(module.version) ? module.version : installed.versionInstalled;
                        module.versionInstalled = installed.versionInstalled;
                        self._insertDependency(module, true);
                    }

                    self.editor.notifyDependenciesListChange(module.name, Dependency.INSTALL_DEPENDENCY_ACTION);
                    return 'The dependency ' + installed.name + (!!install ? ' has been installed.' : ' has been updated');
                }

                self.editor.notifyDependenciesListChange(module.name, Dependency.ERROR_INSTALL_DEPENDENCY_ACTION);
                throw new Error('An error has occurred while installing the dependency ' + module.name);

            }, function (error) {
                module.performingAction = false;
                self.editor.notifyDependenciesListChange(module.name, Dependency.ERROR_INSTALL_DEPENDENCY_ACTION);
                throw error;
            });
        }
    },

    _insertDependency: {
        value: function (module, save, strict) {
            if (PackageTools.isDependency(module) && module.hasOwnProperty('version')) {
                var self = this;

                this.findDependency(module.name, null, function (index, dependency) {
                    if (index >= 0) { // already within the dependencies list.
                        self._dependencyCollection[dependency.type].splice(index, 1);
                    }

                    module.type = module.type || DependencyNames.dependencies;
                    self._dependencyCollection[module.type].push(module);

                    if (!!save) {
                        if (index >= 0 && module.type !== dependency.type) {
                            self._removeDependencyFromFile(dependency, false);
                        }

                        self._addDependencyToFile(module, strict, module.type);
                        self._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE);
                    }
                });
            }
        }
    },

    _addDependencyToFile: {
        value: function (dependency, strict, type) {
            if (PackageTools.isDependency(dependency) && dependency.hasOwnProperty('type')) {
                type = DependencyNames[type];

                if (type) {
                    var group = this._package[dependency.type],
                        range = group[dependency.name];

                    if (range && !strict) { // if range already specified
                        // clean returns null if the range it's not a version specified.
                        range = !semver.clean(range, true) ? range : dependency.versionInstalled;
                    } else {
                        range = PackageTools.isGitUrl(dependency.version) ? dependency.version : dependency.versionInstalled;
                    }

                    if (group) {
                        delete group[dependency.name];
                    }

                    dependency.type = type;
                    this._package[type][dependency.name] = range || '';
                    return true;
                }
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

                if (dependency.extraneous || PackageQueueManager.isRunning || this.isReloadingList) {
                    var promise = Promise.reject(new Error ('Can not change a dependency type either the dependency is ' +
                        'extraneous or an action is performing'));

                    this.dispatchEventNamed("asyncActivity", true, false, {
                        promise: promise,
                        title: "Package Manager"
                    });
                }

                if (this._addDependencyToFile(dependency, false, type)) {
                    return this.saveModification(true);
                }
            }
            return Promise.reject(new Error ('An error has occurred while switching dependency type'));
        }
    },

    uninstallDependency: {
        value: function (dependency) {
            dependency = (typeof dependency === 'string') ? this.findDependency(dependency) : dependency;

            if (PackageTools.isDependency(dependency)) {
                var name = dependency.name,
                    self = this;

                if (DEPENDENCIES_REQUIRED.indexOf(name.toLowerCase()) >= 0) {
                    return Promise.reject(new Error('Can not uninstall the dependency ' + name + ', required by Lumieres'));
                }

                dependency.performingAction = true;
                this._removeDependencyFromFile(dependency, true);

                return PackageQueueManager.uninstallModule(name, !dependency.missing).then(function () {
                    self.editor.notifyDependenciesListChange(name, Dependency.REMOVE_DEPENDENCY_ACTION);
                    return 'The dependency ' +name + ' has been removed';
                });
            }
            return Promise.reject(new Error('An error has occurred while removing a dependency'));
        }
    },

    _removeDependencyFromFile: {
        value: function (dependency, save) {
            if (typeof dependency === "string") { // if the dependency is its name
                dependency = this.findDependency(dependency); // try to find the dependency related to this name
            }

            if (PackageTools.isDependency(dependency) && dependency.hasOwnProperty('type') && !dependency.extraneous) {
                var type = DependencyNames[dependency.type];

                if (type) {
                    if (!!save) {
                        this._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE);
                    }
                    return delete this._package[type][dependency.name];
                }
            }
            return false;
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
                promise = this.packageManagerPlugin.invoke("getOutdatedDependencies").then(function (updates) {
                    var keys = Object.keys(updates);

                    for (var i = 0, length = keys.length; i < length; i++) { // temporary fix because npm outdated is buggy.
                        var dependency = self.findDependency(keys[i], null, false);
                        if (!dependency || dependency.private) {
                            delete updates[keys[i]];
                        }
                    }

                    self._outDatedDependencies = updates;
                    self._notifyOutDatedDependencies();

                    return defaultLocalizer.localize("num_updates").then(function (messageFn) {
                        return messageFn({updates:Object.keys(updates).length});
                    });
                });

            this.dispatchEventNamed("asyncActivity", true, false, {
                promise: promise,
                title: "Searching for updates"
            });
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
                var type = DependencyNames[dependency.type];

                if (type) {
                    var container = this._package[type];

                    if (container[dependency.name]) {
                        container[dependency.name] = range.trim();
                        this._modificationsAccepted(DEFAULT_TIME_AUTO_SAVE, true);
                        return true;
                    }
                }
            }
            return false;
        }
    },

    _countPackageFileChangedByApp: {
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
                    if (self._countPackageFileChangedByApp === 0) {
                        if (!PackageQueueManager.isRunning || !self.isReloadingList) {
                            self._updateDependenciesList().done();
                        }
                    } else {
                        self._countPackageFileChangedByApp--;
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

            return this.sharedProjectController.environmentBridge.save(this, this.url).then(function () {
                if (!!updateDependencies) {
                    return self._updateDependenciesAfterSaving();
                }
            });
        }
    },

    _savingInProgress: {
        value: null
    },

    save: {
        value: function (url, dataWriter) {
            var self = this,
                jsonPackage = JSON.stringify(this._package, function (key, value) {
                    return (value !== null) ?  value : undefined;
                }, 4);

            this._savingInProgress = Promise.when(dataWriter(jsonPackage, url)).then(function (value) {
                self._changeCount = 0;
                self._savingInProgress = null;
                self._countPackageFileChangedByApp++;
                return value;
            });
            return this._savingInProgress;
        }
    }

});
