/**
    @module "ui/flow-number-input.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/flow-number-input.reel".FlowNumberInput
    @extends module:montage/ui/component.Component
*/
exports.FlowNumberInput = Montage.create(Component, /** @lends module:"ui/flow-number-input.reel".FlowNumberInput# */ {

    _step: {
        value: 1
    },

    step: {
        get: function() {
            return this._step;
        },
        set: function(value) {
            this._step =  typeof value === "string" ? parseFloat(value) : value;
        }
    },

    _value: {
        value: 0
    },

    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            this._value = parseFloat(value);
            this.needsDraw = true;
        }
    },

    _pointerX: {
        value: null
    },

    _isDragging: {
        value: false
    },

    handleMousedown: {
        value: function (event) {
            this._pointerX = event.pageX;
            this._isDragging = true;
            this.needsDraw = true;
            document.addEventListener("mousemove", this, false);
            document.addEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "none";
            event.preventDefault();
        }
    },

    handleMousemove: {
        value: function (event) {
            var dX = event.pageX - this._pointerX;

            this.value += dX * this._step;
            this.needsDraw = true;
            this._pointerX = event.pageX;
        }
    },

    handleMouseup: {
        value: function (event) {
            this._isDragging = false;
            this._pointerX = event.pageX;
            this.needsDraw = true;
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "auto";
        }
    },

    handleChange: {
        value: function (event) {
            this.value = this.input.value;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.knob.addEventListener("mousedown", this, false);
                this.input.addEventListener("change", this, false);
            }
        }
    },

    draw: {
        value: function () {
            this.input.value = Math.round(this._value * 1000) / 1000;
            if (this._isDragging) {
                document.body.style.cursor = "ew-resize";
                this.element.classList.add("pressed");
            } else {
                document.body.style.cursor = "auto";
                this.element.classList.remove("pressed");
            }
        }
    }

});
