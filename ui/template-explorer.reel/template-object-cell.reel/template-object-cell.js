/**
    @module "ui/template-object-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var CLASS_PREFIX = "TemplateObjectCell";

/**
    Description TODO
    @class module:"ui/template-object-cell.reel".TemplateObjectCell
    @extends module:montage/ui/component.Component
*/
exports.TemplateObjectCell = Montage.create(Component, /** @lends module:"ui/template-object-cell.reel".TemplateObjectCell# */ {

    didCreate: {
        value: function () {
            this.addPathChangeListener("x", this, "scheduleDraw");
            this.addPathChangeListener("y", this, "scheduleDraw");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) return;
            this.templateObjects.icon.element.addEventListener("dragstart", this, false);
        }
    },

    templateObject: {
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

    handleDragstart: {
        value: function (evt) {
            event.dataTransfer.setData("text/plain", "@" + this.templateObject.label);
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

            this.element.style.webkitTransform = "translate3d(" + x + "px," + y + "px, 0)";
        }
    },

    handlePress: {
        value: function(event) {
            console.log("handleBindAction")
            var bindingModel = Object.create(null);
            bindingModel.targetObject = this.templateObject;
            bindingModel.targetPath = "";
            bindingModel.oneway = true;
            bindingModel.sourcePath = "";

            this.dispatchEventNamed("editBindingForObject", true, false, {
                bindingModel: bindingModel
            });
        }
    }

});
