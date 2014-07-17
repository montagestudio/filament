/**
 * @module ui/toolbar-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    ToolBarConfig = require("core/configuration").FlowEditorConfig.toolbar;

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
                var element = this.buttonElement,
                    id = this.object.id;

                if (Array.isArray(this.subTools) && this.subTools.length > 0) {
                    // reset classes
                    element.className = "";

                    // Add default class list
                    element.classList.add("matte-Button");
                    element.classList.add("flow-Editor-Toolbar-Button");
                }

                element.setAttribute("title", this.object.title);

                if (this.isSelected) {
                    element.classList.add(ToolBarConfig.classSelectedTools);
                } else {
                    element.classList.remove(ToolBarConfig.classSelectedTools);
                }

                element.classList.add(ToolBarConfig.classBaseName + "-" + id.charAt(0).toUpperCase() + id.slice(1));
            }
        }
    }

});
