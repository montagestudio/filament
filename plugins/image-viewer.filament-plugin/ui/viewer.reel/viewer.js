/**
    @module "./viewer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    EditingDocument = require("core/editing-document").EditingDocument,
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
            var document = EditingDocument.create().init(fileUrl, packageUrl);
            this.currentDocument = document;
            return Promise.resolve(document);
        }
    }

});
