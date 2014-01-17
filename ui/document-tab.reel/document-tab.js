/**
    @module "ui/document-tab.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Url = require("core/url");

/**
    Description TODO
    @class module:"ui/document-tab.reel".DocumentTab
    @extends module:montage/ui/component.Component
*/
exports.DocumentTab = Montage.create(Component, /** @lends module:"ui/document-tab.reel".DocumentTab# */ {

    document: {
        value: null
    },

    handleCloseButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("closeDocument", true, true, this.document);
        }
    },

    handlePress: {
        value: function (evt) {
            this.dispatchEventNamed("openUrl", true, true, this.document.url);
        }
    },

    handleLongPress: {
        value: function (evt) {
            var parentDirectory = Url.resolve(this.document.fileUrl, "..");
            this.dispatchEventNamed("expandTree", true, true, parentDirectory);
        }
    }

});
