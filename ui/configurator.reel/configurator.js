var Panel = require("ui/panel.reel").Panel;

exports.Configurator = Panel.specialize({

    constructor: {
        value: function Configurator() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    viewController: {
        value: null
    },

    //TODO this is a little weird that the inspector for selectedObjects.I finds its controller from inspectorControllers.I
    inspectorControllers: {
        value: null
    },

    recentlySelectedObjects: {
        value: null
    },

    selectedTab: {
        value: null
    },

    /**
     * Used to prevent blueprint being resolved if this.object changes
     * while the blueprint is being loaded.
     *
     * Takes advantage of the fact that a promise cannot be resolved after
     * being rejected and vice versa.
     *
     * @private
     * @type {Object}
     */
    _blueprintDeferred: {
        value: null
    },

    reelProxy: {
        get: function () {
            return this._reelProxy;
        },
        set: function (value) {
            if (value === this._reelProxy) {
                return;
            }

            if (this._blueprintDeferred && !this._blueprintDeferred.promise.isFulfilled()) {
                this._blueprintDeferred.reject(new Error("Inspected Object changed before blueprint was resolved"));
            }

            this._reelProxy = value;

            this.needsDraw = true;

            if (this._reelProxy && this._reelProxy.moduleId && this._reelProxy.exportName) {
                this._blueprintDeferred = Promise.defer();

                var self = this;
                this._reelProxy.packageRequire
                    .async(this._reelProxy.moduleId)
                    .get(this._reelProxy.exportName)
                    .get("blueprint")
                    .then(function (blueprint) {
                        self._blueprintDeferred.resolve(blueprint);
                        self.objectBlueprint = blueprint;
                    }, function (reason) {
                        console.warn("Unable to load blueprint: ", reason.message ? reason.message : reason);
                        self._blueprintDeferred.reject(null);
                    });
            } else {
                this._blueprintDeferred = null;
                this.objectBlueprint = null;
            }
        }
    }
});
