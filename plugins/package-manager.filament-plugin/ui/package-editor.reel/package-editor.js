/**
    @module "./package-editor.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    PackageDocument = require("core/package-document").PackageDocument;

/**
    Description TODO
    @class module:"./package-editor.reel".PackageEditor
    @extends module:montage/ui/component.Component
*/
exports.PackageEditor = Montage.create(Component, /** @lends module:"./package-editor.reel".PackageEditor# */ {

    load: {
        value: function (fileUrl, packageUrl) {
            //TODO not make a new document each time..
            var document = PackageDocument.create().init(fileUrl, packageUrl);
            return Promise.resolve(document);
        }
    }
});
