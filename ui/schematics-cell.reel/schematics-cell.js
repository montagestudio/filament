/**
    @module "./schematics-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

var CLASS_PREFIX = "SchematicsCell";

/**
    Description TODO
    @class module:"./schematics-cell.reel".SchematicsCell
    @extends module:montage/ui/component.Component
*/
exports.SchematicsCell = Component.specialize(/** @lends module:"./schematics-cell.reel".SchematicsCell# */ {

    constructor: {
        value: function SchematicsCell() {
            this.super();
            this.addPathChangeListener("x", this, "scheduleDraw");
            this.addPathChangeListener("y", this, "scheduleDraw");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            var icon = this.templateObjects.icon.element;
            icon.addEventListener("dragstart", this, false);
            icon.addEventListener("mousedown", this, false);
            icon.addEventListener("dragend", this, false);

            this.element.parentElement.classList.add("SchematicsCellParent");
        }
    },

    proxyObject: {
        value: null
    },

    x: {
        value: null
    },

    y: {
        value: null
    },

    scheduleDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleMousedown: {
        value: function () {
            this.eventManager.claimPointer("mouse", this);
        }
    },

    surrenderPointer: {
        value: function (pointer, component) {
            return false;
        }
    },

    handleDragstart: {
        value: function (evt) {
            event.dataTransfer.setData("text/plain", "@" + this.proxyObject.label);
        }
    },

    handleDragend: {
        value: function () {
            this.eventManager.forfeitAllPointers(this);
        }
    },

    handleTranslateStart: {
        value: function (evt) {
            this.templateObjects.translateComposer.translateX = this.x;
            this.templateObjects.translateComposer.translateY = this.y;
            this.classList.add(CLASS_PREFIX + "--dragging");
        }
    },

    handleTranslateEnd: {
        value: function() {
            this.classList.remove(CLASS_PREFIX + "--dragging");
        }
    },

    handleTranslate: {
        value: function (evt) {
            this.x = evt.translateX;
            this.y = evt.translateY;
        }
    },

    draw: {
        value: function () {
            var x = this.x ? this.x : 0,
                y = this.y ? this.y : 0;

            this.element.parentElement.style.webkitTransform = "translate3d(" + x + "px," + y + "px, 0)";
        }
    }

});
