/**
    @module "./package-editor.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise;

/**
    Description TODO
    @class module:"./package-editor.reel".PackageEditor
    @extends module:montage/ui/component.Component
*/
exports.PackageEditor = Montage.create(Component, /** @lends module:"./package-editor.reel".PackageEditor# */ {

    load: {
        value: function (fileUrl, packageUrl) {
            console.log("Edit Package.json", fileUrl, packageUrl);
            return Promise.resolve({reelUrl: fileUrl});
        }
    }
});
