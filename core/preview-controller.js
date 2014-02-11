var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise;

exports.PreviewController = Target.specialize({

    constructor: {
        value: function PreviewController () {
            this.super();
        }
    },

    init: {
        value: function (appDelegate) {
            this._applicationDelegate = appDelegate;

            var self = this;

            // TODO replace all this with propertyPath dependencies
            this.addBeforePathChangeListener("_applicationDelegate.environmentBridge", function () {
                self.dispatchBeforeOwnPropertyChange("environmentBridge", self.environmentBridge);
            }, null, true);

            this.addPathChangeListener("_applicationDelegate.environmentBridge", function () {
                self.dispatchOwnPropertyChange("environmentBridge", self.environmentBridge);
            });

            this.addBeforePathChangeListener("environmentBridge.previewUrl", function () {
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
            }, null, true);

            this.addPathChangeListener("environmentBridge.previewUrl", function () {
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
            });

            return this;
        }
    },

    _applicationDelegate: {
        value: null
    },

    applicationDelegate: {
        get: function () {
            return this._applicationDelegate;
        }
    },

    environmentBridge: {
        get: function () {
            return this._applicationDelegate.environmentBridge;
        }
    },

    _previewId: {
        value: null
    },

    previewId: {
        get: function () {
            return this._previewId;
        }
    },

    previewUrl: {
        get: function () {
            if (this.environmentBridge) {
                var url = this.environmentBridge.previewUrl;
                return this._previewId ?  url + "/" + this._previewId + "/" : url;
            }
        }
    },

    /**
     * Registers the serving of a preview within this environment
     *
     * @param {string} name The name for this preview
     * @param {string} url The url to serve for this preview
     *
     * @return {Promise} A promise for the registration of this preview
     */
    registerPreview: {
        value: function (name, url) {
            var self = this;
            return this.environmentBridge.registerPreview(name, url).then(function (previewId) {
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
                self._previewId = previewId;
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
                self.dispatchEventNamed("didRegisterPreview", true, false);
                return name;
            });
        }
    },

    /**
     * Launch the preview server for this project
     *
     * @return {Promise} A promise for the successful launch of the preview
     */
    launchPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.launchPreview(this._previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchEventNamed("didLaunchPreview", true, false);
            });
        }
    },

    /**
     * Refresh the preview server for this project
     *
     * @return {Promise} A promise for the successful refresh of the preview
     */
    refreshPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.refreshPreview(this._previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchEventNamed("didRefreshPreview", true, false);
            });
        }
    },

    setPreviewObjectProperties: {
        value: function(label, ownerModuleId, properties) {
            if (typeof this.environmentBridge.setPreviewObjectProperties === "function") {
                return this.environmentBridge.setPreviewObjectProperties(this._previewId, label, ownerModuleId, properties);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    setPreviewObjectBinding: {
        value: function(ownerModuleId, label, binding) {
            if (typeof this.environmentBridge.setPreviewObjectBinding === "function") {
                return this.environmentBridge.setPreviewObjectBinding(this._previewId, ownerModuleId, label, binding);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    deletePreviewObjectBinding: {
        value: function(ownerModuleId, label, path) {
            if (typeof this.environmentBridge.deletePreviewObjectBinding === "function") {
                return this.environmentBridge.deletePreviewObjectBinding(this._previewId, ownerModuleId, label, path);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    addTemplateFragment: {
        value: function(moduleId, label, argumentName, cssSelector, how, templateFragment) {
            if (typeof this.environmentBridge.addTemplateFragment === "function") {
                return this.environmentBridge.addTemplateFragment(this._previewId, moduleId, label, argumentName, cssSelector, how, templateFragment);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    addTemplateFragmentObjects: {
        value: function(moduleId, templateFragment) {
            if (typeof this.environmentBridge.addTemplateFragmentObjects === "function") {
                return this.environmentBridge.addTemplateFragmentObjects(this._previewId, moduleId, templateFragment);
            } else {
                return Promise.resolve(null);
            }
        }
    },

    /**
     * Unregister the preview server for this project
     *
     * @return {Promise} A promise for the successful unregistration of the preview
     */
    unregisterPreview: {
        value: function () {
            var self = this;
            return this.environmentBridge.unregisterPreview(this._previewId).then(function () {
                //TODO pass along url for preview in event
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
                self._previewId = null;
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
                self.dispatchEventNamed("didUnregisterPreview", true, false);
            });
        }
    }

});
