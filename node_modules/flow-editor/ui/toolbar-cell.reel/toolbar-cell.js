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

    subTools: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                if (Array.isArray(this.object.groups) && this.object.groups.length > 0) {
                    this.subTools = this.object.groups;
                    this.object = this.subTools[0]; // Select the first sub tool
                }
            }
        }
    },

    prepareForActivationEvents: {
        value: function () {
            if (Array.isArray(this.subTools) && this.subTools.length > 0) {
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
                var element = this.buttonElement;

                if (Array.isArray(this.subTools) && this.subTools.length > 0) {
                    // reset classes
                    element.className = "";

                    // Add default class list
                    element.classList.add("matte-Button");
                    element.classList.add("flow-Editor-Toolbar-Button");
                }

                element.setAttribute("title", this.object.title);


                if (this.isSelected) {
                    element.classList.add("flow-Editor-Toolbar-Button--selected");
                } else {
                    element.classList.remove("flow-Editor-Toolbar-Button--selected");
                }

                var classList = this.object.cssRules.class;

                if (Array.isArray(classList)) {
                    classList.forEach(function (classID) {
                        element.classList.add(classID);
                    });
                }
            }
        }
    }

});
