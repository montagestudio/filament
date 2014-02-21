var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    PenTools = require("ui/pen-tools");

/**
    Description TODO
    @class module:"ui/toolbar.reel".Toolbar
    @extends module:montage/ui/component.Component
*/
exports.Toolbar = Montage.create(Component, /** @lends module:"ui/toolbar.reel".Toolbar# */ {

    selectedTool: {
        value: null
    },

    _tools: {
        value: {}
    },

    handleClick: {
        enumerable: false,
        value: function (event) {
            if (event.target.getAttribute("data-tool")) {
                if (event.target !== this._element) {
                    var elements = this.element.getElementsByTagName("*"),
                        i;

                    for (i = 0; i < elements.length; i++) {
                        elements[i].classList.remove("flow-Editor-Toolbar-Button--selected");
                    }
                    event.target.classList.add("flow-Editor-Toolbar-Button--selected");
                    this.selectedTool = this._tools[event.target.getAttribute("data-tool")];
                }
                event.preventDefault();
            }
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._tools = {
                    "arrow": PenTools.ArrowTool.create(),
                    "convert": PenTools.ConvertTool.create(),
                    "pen": PenTools.PenTool.create(),
                    "add": PenTools.AddTool.create(),
                    "helix": PenTools.HelixTool.create()
                };
                this.selectedTool = this._tools.convert;
            }
        }
    },

    prepareForActivationEvents: {
        enumerable: false,
        value: function () {
            this._element.addEventListener("click", this, false);
        }
    },

    handleCloseButtonAction: {
        value: function (evt) {
            window.top.document.getElementsByTagName("iframe")[0].parentNode.component.currentMode = 0;
            evt.stop();
            this.dispatchEventNamed("exitModalEditor", true, true);
        }
    },

    isInspectorVisible: {
        value: false
    },

    handleInspectorButtonAction: {
        value: function () {
            this.isInspectorVisible = !this.isInspectorVisible;
        }
    },

    isTreeVisible: {
        value: false
    },

    handleTreeButtonAction: {
        value: function () {
            this.isTreeVisible = !this.isTreeVisible;
        }
    },

    handleZoomExtendsAction: {
        value: function () {
            var boundaries = this.viewport.scene.getRecursiveAxisAlignedBoundaries(),
                x = boundaries[0].max - boundaries[0].min,
                y = boundaries[1].max - boundaries[1].min,
                z = boundaries[2].max - boundaries[2].min,
                scaleX = this.viewport._width / x,
                scaleY = this.viewport._height / y,
                scaleZ = this.viewport._height / z,
                scale = Math.min(scaleX, scaleY, scaleZ) * 0.8,
                xCenter = (boundaries[0].max + boundaries[0].min) / 2,
                yCenter = (boundaries[1].max + boundaries[1].min) / 2,
                zCenter = (boundaries[2].max + boundaries[2].min) / 2;

            this.viewport.scale = scale;
            this.viewport2.scale = scale;
            this.viewport.translateX = (this.viewport._width / 2) - (xCenter * scale);
            this.viewport.translateY = (this.viewport._height / 2) - (yCenter * scale);
            this.viewport2.translateX = (this.viewport2._width / 2) - (xCenter * scale);
            this.viewport2.translateY = (this.viewport2._height / 2) - (zCenter * scale);
        }
    }

});
