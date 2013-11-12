/**
    @module "ui/selection/highlights.reel"
    @requires montage
    @requires montage/ui/component
*/
var Selections = require("../selections.reel").Selections;

/**
    Description TODO
    @class module:"ui/selection/highlights.reel".Highlights
    @extends module:"ui/selection/selections.reel".Selections
*/
exports.Highlights = Selections.specialize(/** @lends module:"ui/selection/highlights.reel".Highlights# */ {

    constructor: {
        value: function Selections() {
            this.super();
            this.highlightedElementsController = this.selectedObjectsController;
        }
    },

    highlightedElements: {
        get: function() {
            return this.selectedObjects;
        },
        set: function(value) {
            this.selectedObjects = value;
        }
    },

    highlightedElementsController: {
        value: null
    }

});
