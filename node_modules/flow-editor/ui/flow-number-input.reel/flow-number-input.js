/**
    @module "ui/flow-number-input.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/flow-number-input.reel".FlowNumberInput
    @extends module:montage/ui/component.Component
*/
exports.FlowNumberInput = Component.specialize( /** @lends module:"ui/flow-number-input.reel".FlowNumberInput# */ {

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
            this._value = !isNaN(value) ? Math.round(parseFloat(value) * 1000) / 1000 : 0;
            this.needsDraw = true;
        }
    },

    _pointerX: {
        value: null
    },

    _isDragging: {
        value: false
    },

    prepareForActivationEvents: {
        value: function() {
            this.knob.addEventListener("mousedown", this, false);
            this.input.addEventListener("change", this, false);
        }
    },

    handleMousedown: {
        value: function (event) {
            this._pointerX = event.pageX;
            this._isDragging = true;

            document.addEventListener("mousemove", this, false);
            document.addEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "none";

            this.dispatchEventNamed("flowPropertyChangeStart", true, true);
            this.needsDraw = true;

            event.preventDefault();
        }
    },

    handleMousemove: {
        value: function (event) {
            var dX = event.pageX - this._pointerX;

            this.value += dX * this._step;
            this._pointerX = event.pageX;

            this.dispatchEventNamed("flowPropertyChange", true, true);
            this.needsDraw = true;
        }
    },

    handleMouseup: {
        value: function (event) {
            this._isDragging = false;
            this._pointerX = event.pageX;

            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "auto";

            this.dispatchEventNamed("flowPropertyChangeEnd", true, true);
            this.needsDraw = true;
        }
    },

    handleChange: {
        value: function (event) {
            this.value = this.input.value;
            this.dispatchEventNamed("flowPropertyChangeSet", true, true);
        }
    },

    draw: {
        value: function () {
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
