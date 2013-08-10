var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("ui/package-editor.reel").PackageEditor,
    PackageTools = require('./package-tools').PackageTools,
    PackageQueueManager = require('./packages-queue-manager').PackageQueueManager,
    Promise = require("montage/core/promise").Promise,

    DEPENDENCY_TYPE_REGULAR = 'regular',
    DEPENDENCY_TYPE_OPTIONAL = 'optional',
    DEPENDENCY_TYPE_BUNDLE = 'bundle',
    DEPENDENCY_TYPE_DEV = 'dev',
    DEPENDENCIES_REQUIRED = [
        'montage'
    ],
    DEFAULT_TIME_AUTO_SAVE = 400,
    DEPENDENCY_TIME_AUTO_SAVE = 100,
	ERROR_DEPENDENCY_MISSING = 1000,
    ERROR_VERSION_INVALID = 1001,
    ERROR_FILE_INVALID = 1002,
    ERROR_DEPENDENCY_EXTRANEOUS = 1003;

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
                this._package.name = name;
                this._livePackage.name = name;
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
                this._package.version = version;
                this._livePackage.version = version;
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
                if (this._saveTimer) { // A saving request has been scheduled, need to save the package.json file before invoking the list command.
                    clearTimeout(this._saveTimer);
                    var self = this;

                    if (!this._savingInProgress) {
                        this._saveTimer = null;

                        this.saveModification().then(function () {
                            self._updateDependenciesList();
                        });
                    } else {
                        this._savingInProgress.then(function () {
                            self._updateDependenciesList();
                            self._savingInProgress = null;
                        });
                    }
                } else {
                    this._updateDependenciesList();
                }
            }
        }
    },

    _fixDependencyError: {
        value: function (dependency) {
            if (!!dependency.extraneous) { // if this dependency is missing within the package.json file, then fix it.
                this._package.dependencies[dependency.name] = dependency.versionInstalled;

                for (var i = 0, length = dependency.problems.length; i < length; i++) { // remove the error from the errors containers.
                    var error = dependency.problems[i];

                    if (error.name === dependency.name && error.type === ERROR_DEPENDENCY_EXTRANEOUS) {
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

    findDependency: {
        value: function (name, index, type) {
            if (typeof name === 'string') {
                if (typeof type === 'undefined') { // if type not specified, search inside any
                    var keys = Object.keys(this._dependencies);

                    for (var i = 0, length = keys.length; i < length; i++) {
                        var response = this.findDependency(name, index, keys[i]);
                        if (typeof response !== 'undefined') {
                            return response;
                        }
                    }
                } else if (this._dependencies.hasOwnProperty(type)) {
                    var dependencies = this._dependencies[type];
                    for (var k = 0, len = this._dependencies[type].length; k < len; k++) {
                        if (dependencies[k].name === name) {
                            return (index) ? k : dependencies[k]; // return index or the dependency
                        }
                    }
                }
            }
        }
    },

    installDependency: {
        value: function (name, version, type) {
            var module = {
                    name: name,
                    version: (version || ''),
                    type: (type || DEPENDENCY_TYPE_REGULAR),
                    isInstalling: true
                };

            this._insertDependency(module, true); // Insert and Save

            return PackageQueueManager.installModule(module).then(function (installed) {
                if (installed && typeof installed === 'object' && installed.hasOwnProperty('name')) {
                    module.isInstalling = false;

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
                    throw error;
                } else {
                    throw new Error('An error has occurred while installing the dependency ' + name);
                }
            });
        }
    },

    _insertDependency: {
        value: function (module, save) {
            if (module && typeof module === 'object' && module.hasOwnProperty('name') && module.hasOwnProperty('version')) {
                var index = this.findDependency(module.name, true, module.type); // try to find the dependency related to the name

                if (index >= 0) { // already within the dependencies list.
                    this._dependencies[module.type].splice(index, 1);
                }

                if (module.type === DEPENDENCY_TYPE_DEV) {
                    this._dependencies.dev.push(module);
                } else if (module.type === DEPENDENCY_TYPE_OPTIONAL) {
                    this._dependencies.optional.push(module);
                } else if (module.type === DEPENDENCY_TYPE_BUNDLE) {
                    this._dependencies.bundle.push(module);
                } else {
                    module.type = DEPENDENCY_TYPE_REGULAR;
                    this._dependencies.regular.push(module);
                }

                if (!!save) {
                    this._addDependencyToFile(module);
                    this._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE);
                }
            }
        }
    },

    _addDependencyToFile: {
        value: function (dependency, type) {
            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name') && dependency.hasOwnProperty('type')) {

                if (typeof type === 'string') {
                    dependency.type = type;
                }

                if (dependency.type === DEPENDENCY_TYPE_DEV) {
                    this._package.devDependencies[dependency.name] = (dependency.versionInstalled || dependency.version);
                } else if (dependency.type === DEPENDENCY_TYPE_OPTIONAL) {
                    this._package.optionalDependencies[dependency.name] = (dependency.versionInstalled || dependency.version);
                } else if (dependency.type === DEPENDENCY_TYPE_BUNDLE) {
                    this._package.bundledDependencies[dependency.name] = (dependency.versionInstalled || dependency.version);
                } else {
                    dependency.type = DEPENDENCY_TYPE_REGULAR;
                    this._package.dependencies[dependency.name] = (dependency.versionInstalled || dependency.version);
                }
                return true;
            }
            return false;
        }
    },

    replaceDependency: {
        value: function (dependency, type) {
            if (dependency && dependency.type !== type && this._removeDependencyFromFile(dependency, false) && this._addDependencyToFile(dependency, type)) {
                var self = this;

                return this.saveModification().then(function () {
                    return self._updateDependenciesList();
                });
            } else {
                return Promise.reject(new Error ('An error has occurred'));
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
            var modified = false;

            if (typeof dependency === "string") { // if the dependency is its name
                dependency = this.findDependency(dependency); // try to find the dependency related to this name
            }

            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name') && dependency.hasOwnProperty('type') && !dependency.extraneous) {
                if (dependency.type === DEPENDENCY_TYPE_DEV) {
                    modified = delete this._package.devDependencies[dependency.name];
                } else if (dependency.type === DEPENDENCY_TYPE_OPTIONAL) {
                    modified = delete this._package.optionalDependencies[dependency.name];
                } else if (dependency.type === DEPENDENCY_TYPE_BUNDLE) {
                    modified = delete this._package.bundledDependencies[dependency.name];
                } else {
                    dependency.type = DEPENDENCY_TYPE_REGULAR;
                    modified = delete this._package.dependencies[dependency.name];
                }

                if (!!save) {
                    this._modificationsAccepted(DEPENDENCY_TIME_AUTO_SAVE); // TODO return promise if error during saving
                }

                return modified;
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
                if (!self._savingInProgress) {
                    self.saveModification().then(function () {
                        self._saveTimer = null;
                    });
                }
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
                    return (key !== "directories" && value !== null) ?  value : undefined;
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
