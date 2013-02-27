/**
    @module "ui/library.reel/library-group.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/library.reel/library-group.reel".LibraryGroup
    @extends module:montage/ui/component.Component
*/
exports.LibraryGroup = Montage.create(Component, /** @lends module:"ui/library.reel/library-group.reel".LibraryGroup# */ {

    _open: {
        value: false
    },
    open: {
        get: function() {
            return this._open;
        },
        set: function(value) {
            if (this._open === value) {
                return;
            }
            this._open = value;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            this.element.open = this._open;
        }
    }

});
