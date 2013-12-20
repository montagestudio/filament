/**
 * @module ui/split-control.reel
 * @requires montage
 * @requires montage/ui/component
 * @requires composer/translate-composer
 */
var Montage = require("montage").Montage,
    AbstractSlider = require("montage/ui/base/abstract-slider").AbstractSlider;

/**
 * @class SplitControl
 * @extends AbstractSlider
 */
exports.SplitControl = Montage.create(AbstractSlider, /** @lends SplitControl# */ {

    // Lifecycle
    constructor: {
        value: function SplitControl() {
            this.super();
            this.addOwnPropertyChangeListener("splitAxis", this);
            this.axis = "horizontal";
            window.addEventListener("resize", this, false);
        }
    },

    _valuePercentage: {
        value: null
    },

    valuePercentage: {
        set: function (value) {
            if (this._valuePercentage !== value) {
                this._valuePercentage = value;
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._valuePercentage;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            AbstractSlider.enterDocument.apply(this, arguments);
            if (firstTime) {
                this.defineBinding("axis",
                    {"<-": "splitAxis == 'horizontal' ? 'vertical' : 'horizontal'", source: this});
            }
        }
    },

    // AbstractSlider overides

    _calculateSliderMagnitude: {
        value: function() {
            if(this.splitAxis === "vertical") {
                return this.containerElement.offsetWidth;
            } else {
                return this.containerElement.offsetHeight;
            }

        }
    },

    willDraw: {
        value: function () {
            if (!this._completedFirstDraw && !this.valuePercentage) {
                this._updateValueFromDom();
            }
            this.super();
        }
    },

    draw: {
        value: function () {
            this.controlledElement.style.webkitFlexBasis = (this._valuePercentage/100)*this._sliderMagnitude + "px";
        }
    },

    handleThumbTranslateStart: {
        value: function (e) {
            document.body.style.pointerEvents = "none";
            if(this.controlledComponent) {
                this.controlledComponent.classList.add("Panel--noAnimation");
            }
            AbstractSlider.handleThumbTranslateStart.apply(this, arguments);
        }
    },

    handleThumbTranslate: {
        value: function (event) {
            AbstractSlider.handleThumbTranslate.apply(this, arguments);
        }
    },

    handleThumbTranslateEnd: {
        value: function (e) {
            document.body.style.pointerEvents = "auto";
            if(this.controlledComponent) {
                this.controlledComponent.classList.remove("Panel--noAnimation");
            }
            AbstractSlider.handleThumbTranslateEnd.apply(this, arguments);
        }
    },

    // Event Handlers

    handleResize: {
        value: function(event) {
            this._updateValueFromDom();
        }
    },


    // Properties

    splitAxis: {
        value: null
    },

    controlledComponent: {
        value: null
    },

    _controlledElement: {
        value: null
    },

    controlledElement: {
        get: function () {
            if(this._controlledElement === null) {
                return this.controlledComponent.element;
            }
            return this._controlledElement;
        },
        set: function (value) {
            this._controlledElement = value;
        }
    },


    containerElement: {
        value: null
    },

    // Stuff

    _updateValueFromDom: {
        value: function() {
            // value is from 0 to 100
            if(this.splitAxis === "vertical") {
                this.value = (this.controlledElement.offsetWidth/this.containerElement.offsetWidth)*100;
            } else {
                this.value = (this.controlledElement.offsetHeight/this.containerElement.offsetHeight)*100;
            }
        }
    },


    handleSplitAxisChange: {
        value: function() {
            if(this.splitAxis === "vertical") {
                this.classList.add("SplitControl--vertical");
                this.classList.remove("SplitControl--horizontal");
            } else {
                this.classList.remove("SplitControl--vertical");
                this.classList.add("SplitControl--horizontal");
            }
        }
    },

    _initialOffset: {
        value: 0
    },

    // Override abstract-slider.js
    // because this slider does not use any thumb, the abstract-slider is missing a component.
    prepareForActivationEvents: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this, false);
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);

            this._upKeyComposer.addEventListener("keyPress", this, false);
            this._downKeyComposer.addEventListener("keyPress", this, false);
            this._leftKeyComposer.addEventListener("keyPress", this, false);
            this._rightKeyComposer.addEventListener("keyPress", this, false);
        }
    }
});
