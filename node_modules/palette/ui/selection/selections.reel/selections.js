/**
    @module "ui/selection/selections.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController;

/**
    Description TODO
    @class module:"ui/selection/selections.reel".Selections
    @extends module:montage/ui/component.Component
*/
exports.Selections = Montage.create(Component, /** @lends module:"ui/selection/selections.reel".Selections# */ {

    constructor: {
        value: function() {
            this.super();
            this.selectedObjectsController = RangeController.create();
            this.selectedObjectsController.defineBinding("content", {
                "<-": "_selectedObjects",
                source: this
            });
        }
    },

    _selectedObjects: {
        value: null
    },
    /**
     * Array of components that are selected, and so should be surrounded
     * by a selected border.
     * @type {Array[Component]}
     */
    selectedObjects: {
        get: function() {
            return this._selectedObjects;
        },
        set: function(value) {
            if (value !== this._selectedObjects) {
                if (this._selectedObjects) {
                    this._selectedObjects.removeRangeChangeListener(this, "selectedObjects");
                }
                this._selectedObjects = value;
                this._selectedObjects.addRangeChangeListener(this, "selectedObjects");

                this.needsDraw = true;
            }
        }
    },

    selectedObjectsController: {
        value: null
    },

    handleSelectedObjectsRangeChange: {
        value: function() {
            this.allNeedDraw();
        }
    },

    handleUpdate: {
        value: function (event) {
            this.allNeedDraw();
        }
    },

    allNeedDraw: {
        value: function() {
            if (!this._selectedObjects || !this._selectedObjects.length) {
                return;
            }

            this.needsDraw = true;

            // all selections need to be redrawn
            var kids = this.templateObjects.repetition.childComponents;
            for (var i = 0, len = kids.length; i < len; i++) {
                kids[i].needsDraw = true;
            }
        }
    }

});
