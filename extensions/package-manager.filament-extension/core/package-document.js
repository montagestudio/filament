var EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("ui/package-editor.reel").PackageEditor,
    PackageTools = require('./package-tools').PackageTools,
    Promise = require("montage/core/promise").Promise;

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

    sharedProjectController: {
        value: null
    },

    editorType: {
        get: function () {
            return PackageEditor;
        }
    },

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this;

            return require.loadPackage(packageUrl).then( function (packageRequire) {
                return self.create().init(fileUrl, packageRequire);
            });
        }
    },

    _package: {
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

    _dependencies: {
        value: null
    },

    dependencies: {
        get : function () {
            return this._dependencies;
        }
    },

    init: {
        value: function (fileUrl, packageRequire) {
            var self = this.super.call(this, fileUrl, packageRequire);
            this._package = packageRequire.packageDescription;

            return self;
        }
    },

    packageName: {
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

    packageVersion: {
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

    packageDescription: {
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

    packageAuthor: {
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

    addMaintainer: {
        value: function (maintainer) {
            maintainer = PackageTools.getValidPerson(maintainer);

            if (maintainer) {
                if (this.findMaintainerIndex(maintainer.name) < 0) { // name must be different
                    if (!this._package.maintainers) {
                        this._package.maintainers = []; // Array of persons
                    }
                    return (this._package.maintainers.push(maintainer) > 0);
                }
            }
            return false;
        }
    },

    findMaintainerIndex: {
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
                var index = this.findMaintainerIndex(name);

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

    packageLicense: {
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

    packagePrivacy: {
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
            }, 1000);
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
