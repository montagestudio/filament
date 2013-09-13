var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("../ui/package-editor.reel").PackageEditor,
    Tools = require('./package-tools'),
    PackageQueueManager = require('./packages-queue-manager').PackageQueueManager,
    Promise = require("montage/core/promise").Promise,
    semver = require('semver'),
    PackageTools = Tools.ToolsBox,
    ErrorsCommands = Tools.Errors.commands,
    DependencyNames = Tools.DependencyNames,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,

    DEFAULT_TIME_AUTO_SAVE = 400,
    DEPENDENCY_TIME_AUTO_SAVE = 100,
    INSTALL_DEPENDENCY_ACTION = 0,
    REMOVE_DEPENDENCY_ACTION = 1,
    UPDATE_DEPENDENCY_ACTION = 2,
    DEPENDENCIES_REQUIRED = ['montage'],
    ALLOWED_PROPERTIES_KEYS = [
        'name',
        'version',
        'privacy',
        'license',
        'description',
        'author'
    ];

exports.PackageDocument = EditingDocument.specialize( {

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this;

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return self.listDependencies().then(function(app) { // invoke the custom list command, which check every dependencies installed.
                    return self.create().init(fileUrl, packageRequire, self.sharedProjectController, app);
                });
            });
        }
    },

    init: {
        value: function (fileUrl, packageRequire, projectController, app) {
            var self = this.super.call(this, fileUrl, packageRequire);

            PackageQueueManager.load(this, '_handleDependenciesListChange');
            this._livePackage = packageRequire.packageDescription;
            this.sharedProjectController = projectController;

            this._package = app.file || {};
            this._classifyDependencies(app.dependencies, false); // classify dependencies

            return this.packageManagerPlugin.invoke("loadNPM", this.projectUrl).then(function (loaded) {
                if (!loaded) {
                    throw new Error("An error has occurred while NPM was initializing");
                }
                self._getOutDatedDependencies();
                return self;
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
            return  this._packageManagerPlugin;
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

    _livePackage: {
        value: null
    },

    _package: {
        value: null
    },

    setProperty: {
        value: function (key, value) {
            if (typeof key === 'string' && typeof value !== 'undefined' && ALLOWED_PROPERTIES_KEYS.indexOf(key) >= 0) {
                if (this[key] && typeof this[key] === 'object' && !PackageTools.isPersonEqual(this[key], value)) { // case person object.
                    this[key] = value;

                    if (PackageTools.isPersonEqual(this[key], value)) { // modification has been accepted.
                        if (this.undoManager) {
                            this.undoManager.register("Set Property", Promise.resolve([this.setProperty, this, key, value]));
                        }
                        return true;
                    }
                } else if(this[key] !== value) { // new value is different from the old one.
                    this[key] = value;

                    if (this[key] === value) {
                        if (this.undoManager) {
                            this.undoManager.register("Set Property", Promise.resolve([this.setProperty, this, key, value]));
                        }
                        return true;
                    }
                } else { // no need modifications.
                    return true;
                }
            }
            return false;
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

    privacy: {
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

    addMaintainer: {
        value: function (maintainer) {
            maintainer = PackageTools.getValidPerson(maintainer);

            if (maintainer) {
                if (this._findMaintainerIndex(maintainer.name) < 0) { // name must be different
                    var maintainers = this.packageMaintainers,
                        length = maintainers.length;

                    maintainers.push(maintainer);

                    if (maintainers.length > length) {
                        this.saveModification();
                        return true;
                    }
                }
            }
            return false;
        }
    },

    _findMaintainerIndex: {
        value: function (name) {
            var maintainers = this.packageMaintainers;

            if (maintainers && typeof name === 'string' && name.length > 0) {
                for (var i = 0, length = maintainers.length; i < length; i++) {
                    if (maintainers[i].name === name) {
                        return i;
                    }
                }
            }
            return -1;
        }
    },

    removeMaintainer: {
        value: function (maintainer) {
            var index  = (typeof maintainer === "string") ? this._findMaintainerIndex(maintainer) :
                (maintainer && typeof maintainer === 'object' && maintainer.hasOwnProperty('name')) ?
                    this._findMaintainerIndex(maintainer.name) : -1;

            if (index >= 0 && this.packageMaintainers.splice(index, 1).length > 0) {
                this.saveModification();
                return true;
            }
            return false;
        }
    },

    packageMaintainers: {
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
                self.isReloadingList = false;
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
                if (action === INSTALL_DEPENDENCY_ACTION) {
                    promise = this.installDependency(dependency, true);
                    title = "Installing";
                } else if (action === REMOVE_DEPENDENCY_ACTION) {
                    promise = this.uninstallDependency(dependency);
                    title = "Uninstalling";
                } else if (action === UPDATE_DEPENDENCY_ACTION) {
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
            if (dependency && typeof dependency === "object" && PackageTools.isNameValid(dependency.name) &&
                PackageTools.isVersionValid(dependency.version)) {

                return this.installDependency(dependency, false);
            }
            return Promise.reject(new Error("The dependency name and version are required"));
        }
    },

    installDependency: {
        value: function (dependency, install) { // install action => force the range to be the version installed.
            var self = this,
                module = dependency;

            module.versionInstalled = PackageTools.isVersionValid(module.version) ? module.version : null; // if git url
            module.performingAction = true;

            this._insertDependency(module, true, install); // Insert and Save

            return PackageQueueManager.installModule(module).then(function (installed) {
                if (installed && typeof installed === 'object' && installed.hasOwnProperty('name')) {
                    module.performingAction = false;

                    if (installed.name !== module.name || !module.version) { // If names are different or version missing
                        self._removeDependencyFromFile(module, false);
                        module.name = installed.name;
                        module.version = PackageTools.isGitUrl(module.version) ? module.version : installed.versionInstalled;
                        module.versionInstalled = installed.versionInstalled;
                        self._insertDependency(module, true);
                    }

                    return 'The dependency ' + installed.name + (!!install ? ' has been installed.' : ' has been updated');
                }
                throw new Error('An error has occurred while installing the dependency ' + module.name);

            }, function (error) {
                module.performingAction = false;
                throw error;
            });
        }
    },

    _insertDependency: {
        value: function (module, save, strict) {
            if (module && typeof module === 'object' && module.hasOwnProperty('name') && module.hasOwnProperty('version')) {
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

                        self._addDependencyToFile(module, strict);
                        self._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE);
                    }
                });
            }
        }
    },

    _addDependencyToFile: {
        value: function (dependency, strict, type) {
            if (typeof type === 'string') {
                dependency.type = type;
            }

            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name') && dependency.hasOwnProperty('type')) {
                type = DependencyNames[dependency.type];

                if (type) {
                    var group = this._package[type],
                        range = group[dependency.name];

                    if (range && !strict) { // if range already specified
                        range = !semver.clean(range, true) ? range : dependency.versionInstalled; // clean returns null if the range it's not a version specified.
                    } else {
                        range = PackageTools.isGitUrl(dependency.version) ? dependency.version : dependency.versionInstalled;
                    }

                    group[dependency.name] = range || '';
                    return true;
                }
            }
            return false;
        }
    },

    replaceDependency: {
        value: function (dependency, type) {
            if (dependency && dependency.type !== type && !PackageQueueManager.isRunning && !this.isReloadingList &&
                this._removeDependencyFromFile(dependency, false) && this._addDependencyToFile(dependency, true, type)) {

                return this.saveModification(true);
            }
        }
    },

    uninstallDependency: {
        value: function (dependency) {
            dependency = (typeof dependency === 'string') ? this.findDependency(dependency) : dependency;

            if (dependency && typeof dependency === "object" && dependency.hasOwnProperty("name")) {
                var name = dependency.name;

                if (DEPENDENCIES_REQUIRED.indexOf(name.toLowerCase()) >= 0) {
                    return Promise.reject(new Error('Can not uninstall the dependency ' + name + ', required by Lumieres'));
                }

                dependency.performingAction = true;
                this._removeDependencyFromFile(dependency, true);

                return PackageQueueManager.uninstallModule(name, !dependency.missing).then(function () {
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

            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name') &&
                dependency.hasOwnProperty('type') && !dependency.extraneous) {
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
            var outDatedDependencies = this._outDatedDependencies,
                keys = Object.keys(outDatedDependencies);

            for (var i = 0, length = keys.length; i < length; i++) {
                var dependency = this.findDependency(keys[i]);

                if (dependency) {
                    var update = outDatedDependencies[keys[i]];

                    if (dependency.versionInstalled  !== update.available && semver.satisfies(update.available, dependency.version)) {
                        dependency.update = update;
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

            if (dependency && typeof dependency === "object" && dependency.hasOwnProperty('name') &&
                dependency.hasOwnProperty("type") && this.isRangeValid(range)) {
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
                return value;
            });
            return this._savingInProgress;
        }
    }

});
