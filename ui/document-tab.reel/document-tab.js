/**
    @module "ui/document-tab.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

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
    }

});
