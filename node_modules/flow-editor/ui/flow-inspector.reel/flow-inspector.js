/**
    @module "ui/flow-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/flow-inspector.reel".FlowInspector
    @extends module:montage/ui/component.Component
*/
exports.FlowInspector = Component.specialize( /** @lends module:"ui/flow-inspector.reel".FlowInspector# */ {

    _scene: {
        value: null
    },

    scene: {
        get: function () {
            return this._scene;
        },
        set: function (value) {
            this._scene = value;

            if (value) {
                this._scene._data.addEventListener("selectionChange", this, false);
                this._scene._data.addEventListener("sceneChange", this, false);
            }
        }
    },

    titleText: {
        value: ""
    },

    _showing: {
        value: null
    },

    selection: {
        value: null
    },

    handleSceneChange: {
        value: function () {
            this.handleSelectionChange();
        }
    },

    handleSelectionChange: {
        value: function () {
            this.selection = this._scene.getSelection(this._scene)[0];
            this.type = this.selection._data.type;

            if (this.selection) {
                switch (this.type) {
                    case "FlowKnot":
                        this.titleText = "Control Point";
                        break;
                    case "FlowSpline":
                        this.titleText = "Spline";
                        break;
                    case "FlowCamera":
                        this.titleText = "Camera";
                        break;
                    case "Vector3":
                        this.titleText = "Vector";
                        break;
                    case "FlowGrid":
                        this.titleText = "Flow";
                        break;
                    case "FlowHelix":
                        this.titleText = "Helix";
                        break;
                    default:
                        this.titleText = this.type;
                        break;
                }
            } else {
                this.titleText = "Nothing selected";
            }
        }
    },

    handleCloseAction: {
        value: function () {
            this.isVisible = false;
        }
    },

    _isVisible: {
        value: true
    },

    isVisible: {
        get: function () {
            return this._isVisible;
        },
        set: function (value) {
            this._isVisible = value;
            this.needsDraw = true;
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    _windowPositionX: {
        value: 510
    },

    _windowPositionY: {
        value: 10
    },

    handleMousemove: {
        value: function (event) {
            this._windowPositionX = this._startX + event.pageX - this._pointerX;
            this._windowPositionY = this._startY + event.pageY - this._pointerY;
            this.needsDraw = true;
        }
    },

    handleMouseup: {
        value: function (event) {
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "auto";
        }
    },

    handleMousedown: {
        value: function (event) {
            this._startX = this._windowPositionX;
            this._startY = this._windowPositionY;
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
            document.addEventListener("mousemove", this, false);
            document.addEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "none";
            event.preventDefault();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.title.addEventListener("mousedown", this, false);
                window.addEventListener("resize", this, false);
                this.handleSelectionChange();
            }
        }
    },

    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            this._width = this.element.offsetWidth;
            this._height = this.element.offsetHeight;
            this._bodyWidth = window.innerWidth;
            this._bodyHeight = window.innerHeight;
        }
    },

    draw: {
        value: function () {
            this.element.style.display = this._isVisible ? "block" : "none";

            if (this._windowPositionX > this._bodyWidth - this._width) {
                this._windowPositionX = this._bodyWidth - this._width;
            }

            if (this._windowPositionX < 0) {
                this._windowPositionX = 0;
            }

            if (this._windowPositionY > this._bodyHeight - this._height) {
                this._windowPositionY = this._bodyHeight - this._height;
            }

            if (this._windowPositionY < 0) {
                this._windowPositionY = 0;
            }

            this.element.style.left = this._windowPositionX + "px";
            this.element.style.top = this._windowPositionY + "px";

            if (this._isVisible && (this._width === 0)) {
                this.needsDraw = true;
            }
        }
    }

});
