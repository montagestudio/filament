var Montage = require("montage/core/core").Montage,
    Target = require("montage/core/target").Target,
    Map = require("montage/collections/map"),
    EntityProxy = require("core/entity-proxy").EntityProxy,
    Url = require("core/url"),
    ReelDocument = require("core/reel-document").ReelDocument;

/**
 * Loads, constructs, and caches ReelDocuments from their module IDs.
 * Constructing ReelDocuments manually should be deprecated in favor of using
 * this factory, in order to take advantage of caching.
 *
 * @type {ReelDocumentFactory}
 */
exports.ReelDocumentFactory = Target.specialize({

    _documentDataSource: {
        value: null
    },

    _environmentBridge: {
        value: null
    },

    _packageRequire: {
        value: null
    },

    /**
     * @type {Map<String, Promise<ReelDocument>>}
     */
    _documentPromises: {
        value: null 
    },

    /**
     * @param documentDataSource {DocumentDataSource} The data source used to
     * track all changes made to documents. Should be the same instance as
     * used everywhere else in the application.
     * @param environmentBridge {EnvironmentBridge}
     * @param packageRequire {Require}
     *
     * @return {ReelDocumentFactory} This instance.
     */
    init: {
        value: function (documentDataSource, environmentBridge, packageRequire) {
            this._documentDataSource = documentDataSource;
            this._environmentBridge = environmentBridge;
            this._packageRequire = packageRequire;
            this._documentPromises = new Map();
            return this;
        }
    },

    /**
     * Return a cached ReelDocument corresponding to the moduleId if available,
     * or constructs a new ReelDocument.
     *
     * @function
     * @param moduleId {String}
     * @param [shouldPreloadChildren=true] {Boolean} Whether the children of the
     * component should have their documents loaded in the background as well
     * as an optimization.
     * @return {Promise<ReelDocument>}
     */
    makeReelDocument: {
        value: function (moduleId, shouldPreloadChildren) {
            var self = this,
                url = this._packageRequire.location + moduleId,
                documentPromise;
            if (shouldPreloadChildren === void 0) {
                shouldPreloadChildren = true;
            }
            if (url[url.length-1] !== "/") {
                url += "/";
            }
            documentPromise = this._documentPromises.get(moduleId);
            if (!documentPromise) {
                documentPromise = new ReelDocument()
                    .init(url, this._documentDataSource, this._packageRequire)
                    .load()
                    .then(function (doc) {
                        if (shouldPreloadChildren) {
                            self._preloadReelDocumentChildren(doc);
                        }
                        return doc;
                    })
                    .catch(function (err) {
                        self._documentPromises.delete(moduleId);
                        throw err;
                    });
                this._documentPromises.set(moduleId, documentPromise);
            }
            return documentPromise;
        }
    },

    /**
     * Search the given document's entity tree and extract the module IDs of
     * all child components, and begin constructing the ReelDocument instances
     * for each child. Returns nothing as this is intended to be a
     * fire-and-forget operation.
     *
     * @private
     * @function
     */
    _preloadReelDocumentChildren: {
        value: function (reelDocument) {
            var toExplore = reelDocument.entityTree.children.slice(),
                node;
            while (toExplore.length) {
                node = toExplore.pop();
                if (node.moduleId) {
                    this.makeReelDocument(node.moduleId, false);
                }
                toExplore = toExplore.concat(node.children);
            }
        }
    }
});
