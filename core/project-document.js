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
     * Initializes a packageDocument object for editing the data about
     * a package and all that that represents.
     *
     * @param {Function} packageRequire The require used by this package
     * @param {Object} environmentBridge The backend service provider used to manipulate the package
     */
    init: {
        value: function (packageRequire, environmentBridge) {
            var self = this.super();
            self._packageRequire = packageRequire;
            self._environmentBridge = environmentBridge;
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
                        .then(function (success) {
                        deferredUndoOperation.resolve([self.add, self, btoa(data), url]);
                        return success;
                    });
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
