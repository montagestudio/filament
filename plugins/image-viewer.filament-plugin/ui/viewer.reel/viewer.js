/**
    @module "./viewer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    ImageDocument = require("core/image-document").ImageDocument,
    Promise = require("montage/core/promise").Promise;

/**
    Description TODO
    @class module:"./viewer.reel".Viewer
    @extends module:montage/ui/component.Component
*/
exports.Viewer = Montage.create(Component, /** @lends module:"./viewer.reel".Viewer# */ {

    currentDocument: {
        value: null
    },

    load: {
        value: function (fileUrl, packageUrl) {
            //TODO not make a new document each time..
            var document = ImageDocument.create().init(fileUrl, packageUrl);
            this.currentDocument = document;
            return Promise.resolve(document);
        }
    }

});
