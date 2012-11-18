/*global FileDialog */

/**
    @module "ui/file.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise;

/**
    Description TODO
    @class module:"ui/file.reel".File
    @extends module:montage/ui/component.Component
*/
exports.File = Montage.create(Component, /** @lends module:"ui/file.reel".File# */ {

    value: {
        value: null
    }
});

