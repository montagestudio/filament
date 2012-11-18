/**
    @module "ui/library-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/library-cell.reel".LibraryCell
    @extends module:montage/ui/component.Component
*/
exports.LibraryCell = Montage.create(Component, /** @lends module:"ui/library-cell.reel".LibraryCell# */ {

    prototypeObject: {
        value: null
    },

    handlePrototypeButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addComponent", true, true, {
                prototypeObject: this.prototypeObject
            });
        }
    }

});
