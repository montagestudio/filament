/**
 * @module ui/toolbar-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ToolbarCell
 * @extends Component
 */
exports.ToolbarCell = Component.specialize(/** @lends ToolbarCell# */ {

    constructor: {
        value: function ToolbarCell() {
            this.super();
        }
    },

    object: {
        value: null
    },

    buttonElement: {
        value: null
    },

    isSelected: {
        value: null
    },

    prepareForActivationEvents: {
        value: function () {
            if (this.object && Array.isArray(this.object.children) && this.object.children.length > 0) {
                var buttonComponent = this.templateObjects.button;
                buttonComponent.addEventListener("hold", buttonComponent, false);
            }
        }
    },

    select: {
        value: function () {
            this.isSelected = true;
            this.needsDraw = true;
        }
    },

    unSelect: {
        value: function () {
            this.isSelected = false;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            if (this.object && this.buttonElement) {
                var element = this.buttonElement,
                    classList = this.object.cssRules.class;

                element.setAttribute("title", this.object.title);

                if (this.isSelected) {
                    element.classList.add("flow-Editor-Toolbar-Button--selected");
                } else {
                    element.classList.remove("flow-Editor-Toolbar-Button--selected");
                }

                if (Array.isArray(classList)) {
                    classList.forEach(function (classID) {
                        element.classList.add(classID);
                    });
                }
            }
        }
    }

});
