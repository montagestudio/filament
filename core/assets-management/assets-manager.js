var FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    application = require("montage/core/application").application,
    ReelDocument = require("core/reel-document").ReelDocument,
    AssetsConfig = require("./assets-config").AssetsConfig,
    Promise = require("montage/core/promise").Promise,
    AssetTools = require("./asset-tools").AssetTools,
    Montage = require("montage/core/core").Montage,
    Asset = require("./asset").Asset,

    PACKAGE_LOCATION = require.location,
    GLTF_BUNDLE_MIME_TYPE = "model/gltf-bundle",
    CONVERSION_GLTF_ENABLED = false,

    FILE_SYSTEM_CHANGES = {
        CREATE: "create",
        DELETE: "delete",
        UPDATE: "update"
    };

/**
 * @class AssetsManager
 * @extends module:montage.Montage
 */
exports.AssetsManager = Montage.specialize({

    constructor: {
        value: function AssetsManager() {
            this.super();

            this.assets = {};
            this.assetCategories = {};
            this.assetsToHide = [];
            this.assetsTemplate = [];

            var self = this,
                assetCategories = AssetsConfig.assetCategories;

            Object.keys(assetCategories).forEach(function (assetCategoryName) {

                var currentAssetCategory = assetCategories[assetCategoryName];
                currentAssetCategory.defaultIconUrl = PACKAGE_LOCATION + currentAssetCategory.defaultIconUrl;
                self.assetCategories[assetCategoryName] = assetCategoryName;
                self.assets[assetCategoryName] = [];

                if (currentAssetCategory.hidden) {
                    self.assetsToHide = self.assetsToHide.concat(currentAssetCategory.hidden);
                }

                if (currentAssetCategory.templates) {
                    self.assetsTemplate = self.assetsTemplate.concat(currentAssetCategory.templates);
                }
            });

            application.addEventListener("didOpenPackage", this);
            application.addEventListener("fileSystemChange", this);
        }
    },

    /**
     * Contains all AssetCategories supported.
     * @public
     * @type {Array.<String>}
     */
    assetCategories: {
        value: null
    },

    /**
     * Contains all asset of the AssetManager, sorted by AssetCategory.
     * @public
     * @type {Object}
     */
    assets: {
        value: null
    },

    /**
     * Defines the number of assets within the AssetManager.
     * @public
     * @return {number}
     */
    assetsCount: {
        get:  function () {
            var assets = this.assets;

            if (assets) {
                return Object.keys(assets).reduce(function (count, assetCategory) {
                    return count + assets[assetCategory].length;
                }, 0);
            }
        }
    },

    /**
     * Contains a list of mime-types which have to be hidden from the Asset library.
     * @public
     * @return {Array}
     */
    assetsToHide: {
        value: null
    },

    /**
     * Contains a list of mime-types which represent the assets that can be used as a template.
     * @public
     * @return {Array}
     */
    assetsTemplate: {
        value: null
    },

    /**
     * Reference to the projectController
     * @public
     * @return {Object}
     */
    projectController: {
        value: null
    },

    /**
     * Reference to the project Url
     * @public
     * @return {String}
     */
    projectUrl: {
        value: null
    },

    /**
     * Reference to the current Document Object.
     * @public
     * @return {Object}
     */
    _currentDocument: {
        get: function () {
            if (this.projectController) {
                return this.projectController.currentDocument;
            }
        }
    },

    /**
     * Schedules to populate the Asset Manager once the project has been opened.
     * @function
     * @public
     * @param {Object} event.
     */
    handleDidOpenPackage: {
        value: function (event) {
            if (this.projectController) {
                this._populateAssets().done();
            }
        }
    },

    /**
     * Populates the Asset Manager with a list of Assets.
     * @function
     * @public
     * @param {Object} event.
     * @return {Promise} a promise for the list of Assets.
     */
    _populateAssets: {
        value: function () {
            var self = this;

            return this.projectController.environmentBridge.listAssetAtUrl(this.projectController.projectUrl).then(function (fileDescriptors) {
                self.addAssetsWithFileDescriptors(fileDescriptors);
            });
        }
    },

    /**
     * Creates ans adds a list of assets from an array of FileDescriptors.
     * @function
     * @public
     * @param {Array.<FileDescriptor>} fileDescriptors - list of fileDescriptors.
     */
    addAssetsWithFileDescriptors: {
        value: function (fileDescriptors) {
            if (fileDescriptors && Array.isArray(fileDescriptors)) {
                var self = this;

                fileDescriptors.forEach(function (fileDescriptor) {
                    var createdAsset = self.createAssetWithFileDescriptor(fileDescriptor);
                    self.addAsset(createdAsset);
                });
            }
        }
    },

    /**
     * Adds an asset within the asset list of the AssetManager.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {Boolean}
     */
    addAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                var assetFound = this._findAssetWithFileUrl(asset.fileUrl);

                if (assetFound) {
                    if (assetFound.exist) {
                        return false;
                    }
                    this.removeAsset(assetFound);
                }

                this.assets[asset.category].push(asset);
                return true;
            }
            return false;
        }
    },

    /**
     * Creates an Asset Object with some information within an FileDescriptor Object.
     * @function
     * @public
     * @param {Object} fileDescriptor - a FileDescriptor Object.
     * @return {(Asset|null)} created Asset Object.
     */
    createAssetWithFileDescriptor: {
        value: function (fileDescriptor) {
            var fileUrl = fileDescriptor.fileUrl;

            if ((AssetTools.isAFile(fileUrl) || AssetTools.isGlTFBundle(fileUrl)) &&
                AssetTools.isMimeTypeSupported(fileDescriptor.mimeType)) {

                var createdAsset = Asset.create().initWithFileDescriptor(fileDescriptor);

                createdAsset.iconUrl = this.getIconWithAsset(createdAsset);
                createdAsset.isHidden = this.assetsToHide.indexOf(createdAsset.mimeType) >= 0;
                createdAsset.isTemplate = this.assetsTemplate.indexOf(createdAsset.mimeType) >= 0;

                return createdAsset;
            }
        }
    },

    /**
     * Creates an Asset Object from another asset and save it.
     * @function
     * @public
     * @param {Object} asset - an Asset Object which represents a "Template".
     * @param {String} [location="asset.fileUrl"] - the path where the new asset wants to be saved.
     * @return {Promise} for the created Asset Object.
     */
    createAndSaveAssetFromTemplate: {
        value: function (assetTemplate, location) {
            if (!CONVERSION_GLTF_ENABLED) { // Temporary fix, feature not used at the moment.
                return Promise.reject("GlTF conversion is disabled");
            }

            if (AssetTools.isAssetValid(assetTemplate) && assetTemplate.isTemplate) {
                var promise = null;

                // If the asset template is a 3D model, we create a new "glTF bundle asset"
                if (AssetsConfig.assetCategories.MODEL.templates.indexOf(assetTemplate.mimeType) >= 0) {
                    promise = this._createAndSaveGlTFModelAsset(assetTemplate, location);
                }

                if (promise) {
                    this._currentDocument.dispatchEventNamed("asyncActivity", true, false, {
                        promise: promise,
                        status: assetTemplate.fileName,
                        title: "Converting asset"
                    });

                    return promise;
                }
            }

            return Promise.reject("Can not create an asset with the template given");
        }
    },

    /**
     * Creates a glTF bundle Asset from a 3D asset and save it.
     * @function
     * @public
     * @param {Object} asset - a 3D Asset which represents a "Template".
     * @param {String} location - the path where the new asset wants to be saved.
     * @return {Promise} for the created Asset Object.
     */
    _createAndSaveGlTFModelAsset: {
        value: function (assetTemplate, location) {
            var self = this;

            return this._assetCompiler.convert(assetTemplate.fileUrl, location).then(function(outputURL) {
                return self._getStatsAtUrl(outputURL).then(function (stat) {
                    var fileDescriptor = FileDescriptor.create().initWithUrlAndStat(outputURL, stat);
                    fileDescriptor.mimeType = GLTF_BUNDLE_MIME_TYPE;

                    var assetFound = self._findAssetWithFileUrl(outputURL);

                    if (assetFound && assetFound.exist) {
                        assetFound.updateWithFileDescriptor(fileDescriptor);
                        return assetFound;
                    }

                    var assetCreated = self.createAssetWithFileDescriptor(fileDescriptor);

                    if (self.addAsset(assetCreated)) {
                        return assetCreated;
                    }
                });
            });
        }
    },

    /**
     * Get the Stats object at an url.
     * @function
     * @public
     * @param {String} fileUrl - an url.
     * @return {Promise} for the url.
     */
    _getStatsAtUrl: {
        value: function (fileUrl) {
            return this.projectController.environmentBridge.getStatsAtUrl(fileUrl);
        }
    },

    /**
     * Gets an iconUrl for an Asset Object.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {(String|null)} icon url.
     */
    getIconWithAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                //Todo implement a way to make a thumbnail for an asset.
                return this.getDefaultIconUrlByAssetCategory(asset.category);
            }

            return null;
        }
    },

    /**
     * Gets a default iconUrl for an Asset Category.
     * @function
     * @public
     * @param {String} assetCategory - an Asset Category.
     * @return {(String|null)} icon url.
     */
    getDefaultIconUrlByAssetCategory: {
        value: function (assetCategory) {
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                return AssetsConfig.assetCategories[assetCategory].defaultIconUrl;
            }

            return null;
        }
    },

    /**
     * Decompose a path into an array,
     * Where each entry represent a level
     * "/a/b/c/d/ => ["a", "b", "c", "d"]
     * @function
     * @private
     * @param {String} path - an path.
     * @return {Array}
     */
    _decomposePath: {
        value: function (path) {
            path = path.trim();

            var tmp = path.split("/"),
                parts = [];

            for (var i = 0, length = tmp.length; i < length; i++) {
                var part = tmp[i];

                if (part.length > 0) {
                    parts.push(part);
                }
            }

            return parts;
        }
    },

    /**
     * Removes whitespace & remove last trailing slash.
     * @function
     * @private
     * @param {String} path - an path.
     * @return {String} a string cleaned.
     */
    _cleanPath: {
        value: function (path) {
            path = path.trim();

            if (path.charAt(path.length - 1) === "/") { // remove last trailing slash.
                path = path.slice(0, -1);
            }

            return path;
        }
    },

    /**
     * Appends two paths.
     * @function
     * @private
     * @param {String} rootPath - an 'root' path.
     * @param {String} appendPath - an path to append.
     * @return {String} a path concatenated.
     */
    _resolvePaths: {
        value: function (rootPath, appendPath) {
            if (typeof rootPath === 'string' && typeof appendPath === 'string') {
                rootPath = this._cleanPath(rootPath);
                appendPath = this._cleanPath(appendPath);

                var rootPathParts = this._decomposePath(rootPath),

                    // Determine the number of parent directories.
                    parents = appendPath.match(/\.\.\//g),
                    parentsNumber = parents ? parents.length : 0,

                    // remove the '../' characters.
                    endPath = appendPath.substring(parentsNumber * 3); // ../ => 3 characters

                // can not have more parents than the root path decomposed.
                if (rootPathParts.length >= parentsNumber) {
                    if (parentsNumber > 0) {
                        var startPath = "/";

                        for (var i = 0, length = rootPathParts.length - parentsNumber; i < length;  i++) {
                            startPath += rootPathParts[i] + "/";
                        }

                        return startPath + endPath;
                    }

                    if (rootPath.charAt(0) !== "/") {
                        rootPath = '/' + rootPath;
                    }

                    if (endPath.charAt(0) !== "/") {
                        endPath = '/' + endPath;
                    }

                    return rootPath + endPath;
                }
            }
        }
    },

    /**
     * Gets a relative project path for an Asset from the current reel document.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @return {(String|undefined)} relative url.
     */
    getRelativePathWithAssetFromCurrentReelDocument: {
        value: function (asset) {
            var projectUrl = this._projectUrl,
                currentReelDocument = this._currentDocument;

            if (projectUrl && AssetTools.isAssetValid(asset) && currentReelDocument instanceof ReelDocument) {
                var reelDocumentRelativeUrl = currentReelDocument.url.substring(projectUrl.length),
                    assetRelativeUrl = asset.fileUrl.substring(projectUrl.length);

                if (reelDocumentRelativeUrl && assetRelativeUrl) {
                    var pos = 0;

                    while (reelDocumentRelativeUrl.charAt(pos) === assetRelativeUrl.charAt(pos)) {
                        ++pos;
                    }

                    var deepPart = this._decomposePath(this._cleanPath(reelDocumentRelativeUrl.substring(pos))),
                        relativePath = "";

                    for (var i = 0, length = deepPart.length; i < length; i++) {
                        relativePath += "../";
                    }

                    return relativePath + assetRelativeUrl.substring(pos);
                }
            }
        }
    },

    /**
     * Removes an Asset from the list of the AssetManager.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {Boolean}.
     */
    removeAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                var index = this._findAssetIndex(asset);

                if (index >= 0) {
                    this.assets[asset.category].splice(index, 1);
                    return true;
                }
            }

            return false;
        }
    },

    /**
     * Removes an Asset from the list of the AssetManager,
     * with a file url.
     * @function
     * @public
     * @param {String} fileUrl - a file Url.
     * @return {Boolean}.
     */
    removeAssetWithFileUrl: {
        value: function (fileUrl) {
            if ((AssetTools.isAFile(fileUrl) || AssetTools.isGlTFBundle(fileUrl))) {
                var assetFound = this._findAssetWithFileUrl(fileUrl);
                return this.removeAsset(assetFound);
            }

            return false;
        }
    },

    /**
     * Finds the "location" of an Asset with the list of Asset of the AssetManager.
     * @function
     * @private
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {number}.
     */
    _findAssetIndex: {
        value: function (asset) {
            var assetsList = this.assets[asset.category],
                fileUrl = asset.fileUrl;

            for (var i = 0, length = assetsList.length; i < length; i++) {
                var currentAsset = assetsList[i];

                if (fileUrl === currentAsset.fileUrl) {
                    return i;
                }
            }

            return -1;
        }
    },

    /**
     * Finds an Asset within the list of Assets in terms of a file url.
     * @function
     * @private
     * @param {String} property - an Asset property.
     * @param {String} value - a value.
     * @param {String} [category] - an Asset Category.
     * @return {(Object|null)} an Asset Object that has been found.
     */
    _findAssetWithPropertyAndValue: {
        value: function (property, value, assetCategory) {
            var assetFound = null;

            // If assetCategory is not undefined looks into the Asset category, in order to find an asset
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                var assetSet = this.assets[assetCategory];

                assetSet.some(function (asset) {
                    assetFound = asset[property] === value ? asset : null;
                    return !!assetFound;
                });

                return assetFound;
            }

            // If assetCategory is undefined looks into each Asset categories.
            var assetCategories = this.assetCategories,
                self = this;

            Object.keys(assetCategories).some(function (assetCategory) {
                assetFound = self._findAssetWithPropertyAndValue(property, value, assetCategory);
                return !!assetFound;
            });

            return assetFound;
        }
    },

    /**
     * Finds an Asset within the list of Assets in terms of a file url.
     * @function
     * @private
     * @param {String} fileUrl - a file Url.
     * @param {String} [category] - an Asset Category.
     * @return {(Object|null)} an Asset Object that has been found.
     */
    _findAssetWithFileUrl: {
        value: function (fileUrl, assetCategory) {
            if ((AssetTools.isAFile(fileUrl) || AssetTools.isGlTFBundle(fileUrl))) {
                return this._findAssetWithPropertyAndValue("fileUrl", fileUrl, assetCategory);
            }

            return null;
        }
    },

    /**
     * Finds an Asset within the list of Assets in terms of an index node.
     * @function
     * @private
     * @param {String} fileUrl - an index node.
     * @param {String} [category] - an Asset Category.
     * @return {(Object|null)} an Asset Object that has been found.
     */
    _findAssetWithInode: {
        value: function (inode, assetCategory) {
            return this._findAssetWithPropertyAndValue("inode", inode, assetCategory);
        }
    },

    /**
     * Finds and Gets an Asset with a file url.
     * @function
     * @public
     * @param {String} fileUrl - a file Url.
     * @return {(Object|null)} Asset Object.
     */
    getAssetByFileUrl: {
        value: function (fileUrl) {
            return this._findAssetWithFileUrl(fileUrl);
        }
    },

    /**
     * Finds and Gets an Asset with a relative path.
     * @function
     * @public
     * @param {String} relativePath - a relative path.
     * @return {(Object|null)} Asset Object.
     */
    getAssetByRelativePath: {
        value: function (relativePath) {
            if (typeof relativePath === "string" && relativePath.length > 0 && this._currentDocument) {
                relativePath = relativePath.replace(/^\.\/|^\//, ''); // remove ./ or / from the begin of a path.

                var reelDocumentRelativeUrl = this._currentDocument.url.substring(this._projectUrl.length),
                    assetUrl = this._resolvePaths(reelDocumentRelativeUrl, relativePath);

                return this._findAssetWithFileUrl(this._cleanPath(this._projectUrl) + assetUrl);
            }
        }
    },

    /**
     * Gets an Assets list in term of an Asset Category.
     * @function
     * @public
     * @param {String} category - an Asset Category.
     * @return {Array.<Asset>} an Array of Assets Object.
     */
    getAssetsByAssetCategory: {
        value: function (assetCategory) {
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                return this.assets[assetCategory];
            }

            return [];
        }
    },

    /**
     * Gets an Assets list in term of a mime-type.
     * @function
     * @public
     * @param {String} mimeType - a supported mime-type.
     * @return {Array.<Asset>} an Array of Assets Object.
     */
    getAssetsByMimeType: {
        value: function (mimeType) {
            if (!AssetTools.isMimeTypeSupported(mimeType)) {
                throw new Error("Cannot get assets because the mime-type:" + mimeType + " is not supported");
            }

            var assetCategory = AssetTools.findAssetCategoryFromMimeType(mimeType),
                assetSet = this.assets[assetCategory];

            return assetSet.filter(function (asset) {
                return asset.mimeType === mimeType;
            });
        }
    },

    /**
     * Tries to find an Asset Object from the deleted assets list,
     * by comparing data within a FileDescriptor Object.
     * Whether a Asset has been found, it will be updated and added to the assets list.
     * @function
     * @private
     * @param {Object} fileDescriptor - an FileDescriptor Object.
     * @param {number} fileDescriptor._stat - stats of an fileDescriptor.
     * @return {Boolean} if an asset has been revived.
     */
    _reviveAssetWithFileDescriptor: {
        value: function (fileDescriptor) {
            var inode = fileDescriptor._stat.node ? fileDescriptor._stat.node.ino : fileDescriptor._stat.ino,
                asset = this._findAssetWithInode(inode);

            if (asset && !asset.exist) {
                asset.exist = true;
                asset.updateWithFileDescriptor(fileDescriptor);
                return true;
            }

            return false;
        }
    },

    /**
     * Invokes the detectMimeTypeAtUrl function from the environmentBridge
     * Will get a mime-type for a file at a given url.
     * @function
     * @private
     * @param {String} fileUrl - a file Url.
     * @return {Promise} for the file analyzed.
     */
    _detectMimeTypeWithFileUrl: {
        value: function (fileUrl) {
            return this.projectController.environmentBridge.detectMimeTypeAtUrl(fileUrl);
        }
    },

    /**
     * handles any changes of an asset from the file system.
     * @function
     * @public
     * @param {Object} event - Event Object.
     * @param {Object} event.detail - Contains some information about the file changes;
     * @param {String} fileUrl - a file Url.
     */
    handleFileSystemChange: {
        value: function (event) {
            var fileChangeDetail = event.detail;

            if (this.projectController && fileChangeDetail && typeof fileChangeDetail === "object") {
                var fileUrl = fileChangeDetail.fileUrl,
                    self = this;

                switch (fileChangeDetail.change) {

                case FILE_SYSTEM_CHANGES.CREATE:

                    /* When moving or renaming a file, trigger two events,
                     * a first an event with the "delete" change, then a second with the "create" change.
                     * So in order to avoid to make again a new thumbnail,
                     * we keep for a while the last Asset Objects which have been removed,
                     * and then we check if they can be "reused".
                     */

                    this._detectMimeTypeWithFileUrl(fileUrl).then(function (mimeType) {
                        if (AssetTools.isMimeTypeSupported(mimeType)) {
                            var fileDescriptor = FileDescriptor.create().initWithUrlAndStat(fileUrl, fileChangeDetail.currentStat);
                            fileDescriptor.mimeType = mimeType;

                            if (!self._reviveAssetWithFileDescriptor(fileDescriptor)) {
                                self.addAsset(self.createAssetWithFileDescriptor(fileDescriptor));
                            }
                        }
                    }).done();
                    break;

                case FILE_SYSTEM_CHANGES.DELETE:
                    var asset = this._findAssetWithFileUrl(fileUrl);

                    if (asset) {
                        asset.exist = false;
                    }
                    break;

                case FILE_SYSTEM_CHANGES.UPDATE:
                    var updatedAsset = this._findAssetWithFileUrl(fileUrl);

                    if (updatedAsset) {
                        this._detectMimeTypeWithFileUrl(fileUrl).then(function (mimeType) {
                            if (AssetTools.isMimeTypeSupported(mimeType)) {
                                var fileDescriptor = FileDescriptor.create().initWithUrlAndStat(fileUrl, fileChangeDetail.currentStat);
                                fileDescriptor.mimeType = mimeType;

                                // TODO once a thumbnail mechanism will has been implemented,
                                // trigger it and update the iconUrl property
                                updatedAsset.updateWithFileDescriptor(fileDescriptor);
                            }
                        }).done();
                    }
                    break;
                }
            }
        }
    }

});
