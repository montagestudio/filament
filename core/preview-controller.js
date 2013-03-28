var Montage = require("montage/core/core").Montage,
    Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise;

exports.PreviewController = Montage.create(Target, {

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

    init: {
        value: function (appDelegate) {
            this._applicationDelegate = appDelegate;
            return this;
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
                self._previewId = previewId;
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
                self.dispatchEventNamed("didUnregisterPreview", true, false);
            });
        }
    }

});
