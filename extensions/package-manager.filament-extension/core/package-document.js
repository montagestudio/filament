var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("ui/package-editor.reel").PackageEditor,
    PackageTools = require('./package-tools').PackageTools,
    PackageQueueManager = require('./packages-queue-manager').PackageQueueManager,
    Promise = require("montage/core/promise").Promise,

    DEPENDENCY_TYPE_REGULAR = 'regular',
    DEPENDENCY_TYPE_OPTIONAL = 'optional',
    DEPENDENCY_TYPE_BUNDLE = 'bundle',
    DEPENDENCY_TYPE_DEV = 'dev',
    DEPENDENCIES_REQUIRED = [ 'montage' ],
    DEPENDENCIES_NAME_CACHE = {
        regular: 'dependencies',
        optional: 'optionalDependencies',
        dev: 'devDependencies',
        bundle: 'bundledDependencies'
    },

    DEFAULT_TIME_AUTO_SAVE = 400,
    DEPENDENCY_TIME_AUTO_SAVE = 100,

    ERROR_LIST_CMD_DEPENDENCY_MISSING = 1000,
    ERROR_LIST_CMD_VERSION_INVALID = 1001,
    ERROR_LIST_CMD_FILE_INVALID = 1002,
    ERROR_LIST_CMD_DEPENDENCY_EXTRANEOUS = 1003,

    ERROR_INSTALL_CMD_NOT_FOUND = 2001,
    ERROR_INSTALL_CMD_VERSION_NOT_FOUND = 2002;

exports.PackageDocument = EditingDocument.specialize( {

    constructor: {
        value: function PackageDocument () {
            this.super();
            this.sharedProjectController = PackageDocument.sharedProjectController;
            PackageQueueManager.load(this, '_handleDependenciesListChange');
        }
    },

    editorType: {
        get: function () {
            return PackageEditor;
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this;

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return self.listDependencies().then(function(app) { // invoke the custom list command, which check every dependencies installed.
                    return self.create().init(fileUrl, packageRequire, app);
                });
            });
        }
    },

    init: {
        value: function (fileUrl, packageRequire, app) {
            var self = this.super.call(this, fileUrl, packageRequire);
            this._livePackage = packageRequire.packageDescription;
            if (app) {
                this._package = (app.file || {});
                this._classifyDependencies(app.dependencies, false); // classify dependencies
            }
            return self;
        }
    },

    sharedProjectController: {
        value: null
    },

    _backend: {
        value: null
    },

    backend: {
        get: function () {
            if (!this._backend && this.sharedProjectController) {
                this._backend = this.sharedProjectController.environmentBridge.backend;
            }
            return this._backend;
        }
    },

    _packageManagerPlugin: {
        value: null
    },

    packageManagerPlugin: {
        get: function () {
            if (!this._packageManagerPlugin) {
                this._packageManagerPlugin = this.backend.get("package-manager");
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

    _getAllowedKeys: {
        get: function () {
            return [
                'name',
                'version',
                'privacy',
                'license',
                'description',
                'author'
            ];
        }
    },

    setProperty: {
        value: function (key, value) {
            if (typeof key === 'string' && typeof value !== 'undefined' && this._getAllowedKeys.indexOf(key) >= 0) {

                if (this[key] && typeof this[key] === 'object' && !PackageTools.isPersonEqual(this[key], value)) { // case object person
                    this[key] = value;

                    if (PackageTools.isPersonEqual(this[key], value)) { // if modification has been accepted
                        this.undoManager.register("Set Property", Promise.resolve([this.setProperty, this, key, value]));
                        return true;
                    }

                } else if(this[key] !== value) { // if the new value is different from the old one
                    this[key] = value;

                    if (this[key] === value) {
                        this.undoManager.register("Set Property", Promise.resolve([this.setProperty, this, key, value]));
                        return true;
                    }
                } else { // no need modifications
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
                    var length = this._package.maintainers.length;
                    this._package.maintainers.push(maintainer);

                    if (this._package.maintainers.length > length) {
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
            if (this._package.maintainers && name && name.length > 0) {
                for (var i = 0, length = this._package.maintainers.length; i < length; i++) {
                    if (this._package.maintainers[i].name === name) {
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
                (maintainer && typeof maintainer === 'object' && maintainer.hasOwnProperty('name')) ? this._findMaintainerIndex(maintainer.name) : -1;

            if (index >= 0 && this._package.maintainers.splice(index, 1).length > 0) {
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

    _dependencies: {
        value: null
    },

    dependencies: {
        get : function () {
            return this._dependencies;
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
                self.isReloadingList = false;
            });
        }
    },

    _resetDependencies: {
        value: function () {
            if (!this._dependencies) {
                this._dependencies = {};
            }

            this._dependencies.regular = [];
            this._dependencies.bundle = [];
            this._dependencies.dev = [];
            this._dependencies.optional = [];
        }
    },

    isReloadingList: {
        value: false
    },

    _handleDependenciesListChange: {
        value: function (modules) {
            if (Array.isArray(modules) && modules.length > 0) {
                if (this._saveTimer || this._savingInProgress) { // A saving request has been scheduled, need to save the package.json file before invoking the list command.
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
            this._updateDependenciesList();
            this._updateLibraryGroups().done();
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

                    if (error.name === dependency.name && error.type === ERROR_LIST_CMD_DEPENDENCY_EXTRANEOUS) {
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
                    dependencyTypeCollectionMap = {},
                    dependencyCollection;

                dependencyTypeCollectionMap[DEPENDENCY_TYPE_DEV] = this._dependencies.dev;
                dependencyTypeCollectionMap[DEPENDENCY_TYPE_OPTIONAL] = this._dependencies.optional;
                dependencyTypeCollectionMap[DEPENDENCY_TYPE_BUNDLE] = this._dependencies.bundle;
                dependencyTypeCollectionMap[DEPENDENCY_TYPE_REGULAR] = this._dependencies.regular;

                fixedErrors = dependencies.reduce(function (fixed, dependency) {

                    if (fixError) {
                        fixed = fixed || this._fixDependencyError(dependency);
                    }

                    if (dependency.hasOwnProperty('type')) {

                        dependencyCollection = dependencyTypeCollectionMap[dependency.type];
                        if (dependencyCollection) {
                            dependencyCollection.push(dependency);
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
                var keys = Object.keys(this._dependencies);

                for (var i = 0, length = keys.length; i < length; i++) {
                    var response = this._findDependency(name, keys[i]);
                    if (typeof response !== 'undefined') {
                        return response;
                    }
                }
            } else if (this._dependencies.hasOwnProperty(type)) {
                var dependencies = this._dependencies[type];
                for (var k = 0, len = this._dependencies[type].length; k < len; k++) {
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
                return (!response) ? null : (index) ? response.key : response.dependency;
            }
        }
    },

    installDependency: {
        value: function (name, version, type) { // version or git url
            var self = this,
                module = {
                    name: name,
                    version: (version || ''),
                    versionInstalled: PackageTools.isVersionValid(version) ? version : null,
                    type: (type || DEPENDENCY_TYPE_REGULAR),
                    isInstalling: true
                };

            this._insertDependency(module, true); // Insert and Save

            return PackageQueueManager.installModule(module).then(function (installed) {
                if (installed && typeof installed === 'object' && installed.hasOwnProperty('name')) {
                    module.isInstalling = false;

                    if (installed.name !== module.name) {
                        self._removeDependencyFromFile(module, false);
                        self._insertDependency({
                            name: installed.name,
                            version: installed.versionInstalled,
                            type: module.type
                        }, true); // If names are different
                    }

                    return {
                        name: installed.name,
                        versionInstalled: installed.versionInstalled,
                        type: module.type,
                        missing: false,
                        installed: true
                    };
                }
                throw new Error('An error has occurred while installing the dependency ' + name);
            }, function (error) {
                module.isInstalling = false;

                if (typeof error === "object") {
                    if (error.message === ERROR_INSTALL_CMD_NOT_FOUND.toString()) {
                        throw new Error('The dependency named ' + name + ' does not exist.');
                    } else if (error.message === ERROR_INSTALL_CMD_VERSION_NOT_FOUND.toString()) {
                        throw new Error('The version ' + version + ' for the dependency named ' + name + ' does not exist.');
                    } else {
                        throw error;
                    }
                } else {
                    throw new Error('An error has occurred while installing the dependency ' + name + ', error: ' + error);
                }
            });
        }
    },

    _insertDependency: {
        value: function (module, save) {
            if (module && typeof module === 'object' && module.hasOwnProperty('name') && module.hasOwnProperty('version')) {
                var self = this;

                this.findDependency(module.name, null, function (index, dependency) {

                    if (index >= 0) { // already within the dependencies list.
                        self._dependencies[dependency.type].splice(index, 1);
                    }

                    if (module.type === DEPENDENCY_TYPE_DEV) {
                        self._dependencies.dev.push(module);
                    } else if (module.type === DEPENDENCY_TYPE_OPTIONAL) {
                        self._dependencies.optional.push(module);
                    } else if (module.type === DEPENDENCY_TYPE_BUNDLE) {
                        self._dependencies.bundle.push(module);
                    } else {
                        module.type = DEPENDENCY_TYPE_REGULAR;
                        self._dependencies.regular.push(module);
                    }

                    if (!!save) {
                        if (index >= 0) {
                            self._removeDependencyFromFile(dependency, false);
                        }

                        self._addDependencyToFile(module);
                        self._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE);
                    }

                });
            }
        }
    },

    _addDependencyToFile: {
        value: function (dependency, type) {
            if (typeof type === 'string') {
                dependency.type = type;
            }

            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name') && dependency.hasOwnProperty('type')) {
                type = DEPENDENCIES_NAME_CACHE[dependency.type];

                if (type) {
                    this._package[type][dependency.name] = (dependency.versionInstalled || dependency.version);
                    return true;
                }
            }
            return false;
        }
    },

    replaceDependency: {
        value: function (dependency, type) {
            if (dependency && dependency.type !== type && this._removeDependencyFromFile(dependency, false) && this._addDependencyToFile(dependency, type)) {
                var self = this;

                return this.saveModification().then(function () {
                    return self._updateDependenciesAfterSaving();
                });
            }
        }
    },

    uninstallDependency: {
        value: function (name) {
            if (typeof name === 'string' && DEPENDENCIES_REQUIRED.indexOf(name.toLowerCase()) < 0) {
                var dependency = this.findDependency(name);

                if (dependency && typeof dependency === "object") {
                    this._removeDependencyFromFile(dependency, true);
                    return PackageQueueManager.uninstallModule(name, !dependency.missing);
                }

                return Promise.reject(new Error('An error has occurred'));
            } else {
                return Promise.reject(new Error('Can not uninstall the dependency ' + name + ', required by Lumieres'));
            }
        }
    },

    _removeDependencyFromFile: {
        value: function (dependency, save) {
            if (typeof dependency === "string") { // if the dependency is its name
                dependency = this.findDependency(dependency); // try to find the dependency related to this name
            }

            var type = DEPENDENCIES_NAME_CACHE[dependency.type];

            if (dependency && type && typeof dependency === 'object' && dependency.hasOwnProperty('name') && dependency.hasOwnProperty('type') && !dependency.extraneous ) {
                if (!!save) {
                    this._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE); // TODO return promise if error during saving
                }

                return delete this._package[type][dependency.name];
            }
            return false;
        }
    },

    _saveTimer: {
        value: null
    },

    _modificationsAccepted: {
        value: function (time) {
            var self = this;
            time = (typeof time === "number") ? time : DEFAULT_TIME_AUTO_SAVE;

            if (this._saveTimer) {
                clearTimeout(this._saveTimer);
            }

            this._saveTimer = setTimeout(function () {
                self.saveModification().then(function () {
                    self._saveTimer = null;
                });
            }, time);
        }
    },

    saveModification: {
        value: function () {
            return this.sharedProjectController.environmentBridge.save(this, this.url);
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
                }, '\t');

            this._savingInProgress = Promise.when(dataWriter(jsonPackage, url)).then(function (value) {
                self._changeCount = 0;
                self._savingInProgress = null;
                return value;
            });

            return this._savingInProgress;
        }
    }

});
