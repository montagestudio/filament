/**
    @module "ui/library.reel/library-group.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/library.reel/library-group.reel".LibraryGroup
    @extends module:montage/ui/component.Component
*/
exports.LibraryGroup = Component.specialize(/** @lends module:"ui/library.reel/library-group.reel".LibraryGroup# */ {

    _open: {
        value: true
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
    },

    details: {
        value: null
    },

    filterPath: {
        value: null
    }

});
