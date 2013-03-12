/**
    @module "ui/contextual-inspectors.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/contextual-inspectors.reel".ContextualInspectors
    @extends module:montage/ui/component.Component
*/
exports.ContextualInspectors = Montage.create(Component, /** @lends module:"ui/contextual-inspectors.reel".ContextualInspectors# */ {
    _contextualInspectors: {
        value: null
    },
    contextualInspectors: {
        get: function() {
            return this._contextualInspectors;
        },
        set: function(value) {
            if (value !== this._contextualInspectors) {
                if (this._contextualInspectors) {
                    this._contextualInspectors.removeRangeChangeListener(this, "contextualInspectors");
                }
                this._contextualInspectors = value;
                if (value) {
                    this._contextualInspectors.addRangeChangeListener(this, "contextualInspectors");
                }

                this.needsDraw = true;
            }
        }
    },

    contextualInspectorsController: {
        value: null
    },

    handleContextualInspectorsRangeChange: {
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
            if (!this._contextualInspectors || !this._contextualInspectors.length) {
                return;
            }

            this.needsDraw = true;

            var kids = this.templateObjects.repetition.childComponents;
            for (var i = 0, len = kids.length; i < len; i++) {
                kids[i].content.needsDraw = true;
            }
        }
    }
});
