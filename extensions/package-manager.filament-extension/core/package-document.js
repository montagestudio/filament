var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("ui/package-editor.reel").PackageEditor,
    PackageTools = require('./package-tools').PackageTools,
    Promise = require("montage/core/promise").Promise;

var DEPENDENCY_TYPE_REGULAR = 'regular',
    DEPENDENCY_TYPE_OPTIONAL = 'optional',
    DEPENDENCY_TYPE_BUNDLE = 'bundle',
    DEPENDENCY_TYPE_DEV = 'dev',
	ERROR_DEPENDENCY_MISSING = 1000,
    ERROR_VERSION_INVALID = 1001,
    ERROR_FILE_INVALID = 1002,
    ERROR_DEPENDENCY_EXTRANEOUS = 1003;

exports.PackageDocument = EditingDocument.specialize( {

    constructor: {
        value: function PackageDocument () {
            this.super();
            this.sharedProjectController = PackageDocument.sharedProjectController;
            this._dependencies = {
                dev: [],
                regular: [],
                optional: [],
                bundle: []
            };
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
                return self.getDependencies().then(function(app) { // invoke the custom list command, which check every dependencies installed.
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

    _backendPlugin: {
        value: function () {
            return (this.sharedProjectController) ? this.sharedProjectController.environmentBridge.backend.get("package-manager") : null;
        }
    },

    backendPlugin: {
        get: function () {
            return this._backendPlugin;
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

    _dependencies: {
        value: null
    },

    dependencies: {
        get : function () {
            return this._dependencies;
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
                var needSave = false;

                for (var x in dependencies) {
                    var dependency = dependencies[x];

                    if (fixError === true) {
                        var found = this._fixDependencyError(dependency);

                        if (!needSave && found) {
                            needSave = true;
                        }
                    }

                    if (dependency.hasOwnProperty('type')) {
                        if (!dependency.missing && !dependency.extraneous && !dependency.jsonFileMissing && !dependency.jsonFileError) { // Managing errors is coming, display just the valid ones
                            if (dependency.type === DEPENDENCY_TYPE_DEV) {
                                this._dependencies.dev.push(dependency);
                            } else if (dependency.type === DEPENDENCY_TYPE_OPTIONAL) {
                                this._dependencies.optional.push(dependency);
                            } else if (dependency.type === DEPENDENCY_TYPE_BUNDLE) {
                                this._dependencies.bundle.push(dependency);
                            } else {
                                this._dependencies.regular.push(dependency);
                            }

                        }
                    }
                }

                if (needSave === true) { // needs to save modification.
                    this.saveModification();
                }
            }
        }
    },

    getDependencies: {
        value: function () {
            return this.backendPlugin().invoke("listDependencies", this.projectUrl);
        }
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
                this._modificationsHaveBeenAccepted();
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
                this._modificationsHaveBeenAccepted();
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
                this._modificationsHaveBeenAccepted();
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
                this._modificationsHaveBeenAccepted();
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
                this._modificationsHaveBeenAccepted();
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
                this._modificationsHaveBeenAccepted();
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
                    if (!this._package.maintainers) {
                        this._package.maintainers = []; // Array of persons
                    }
                    return (this._package.maintainers.push(maintainer) > 0);
                }
            }
            return false;
        }
    },

    _findMaintainerIndex: {
        value: function (name) {
            if(this._package.maintainers && name && name.length > 0){
                var i = this._package.maintainers.length;
                while (i--) {
                    if (this._package.maintainers[i].name === name) {
                        return i;
                    }
                }
            }
            return -1;
        }
    },

    removeMaintainer: {
        value: function (name) {
            if (typeof name === "string"){
                var index = this._findMaintainerIndex(name);

                if (index >= 0) {
                    var response = this._package.maintainers.splice(index, 1);

                    if(response.length > 0){
                        return true;
                    }
                }
            }
            return false;
        }
    },

    packageMaintainers: {
        get: function () {
            return this._package.maintainers;
        }
    },

    _saveTimer: {
        value: null
    },

    _modificationsHaveBeenAccepted: {
        value: function () {
            var self = this;

            if (this._saveTimer) {
                clearTimeout(this._saveTimer);
            }

            this._saveTimer = setTimeout(function(){
                self._saveTimer = null;
                self.saveModification();
            }, 400);
        }
    },

    saveModification: {
        value: function () {
            this.sharedProjectController.environmentBridge.save(this, this.url);
        }
    },

    save: {
        value: function (url, dataWriter) {
            var self = this;
            var jsonPackage = JSON.stringify(this._package, function (key, value) {
                    return (key !== "directories" && value !== null) ?  value : undefined;
                }, '\t');

            return Promise.when(dataWriter(jsonPackage, url))
                .then( function (value) {
                    self._changeCount = 0;
                    return value;
                });
        }
    }

});
