/**
 * @module montage-splitter/ui/splitter.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;
var AbstractSlider = require("montage/ui/base/abstract-slider").AbstractSlider;

/**
 * @class Splitter
 * @extends Component
 */
exports.Splitter = AbstractSlider.specialize(/** @lends Splitter# */ {

    // Lifecycle
    constructor: {
        value: function Splitter() {
            this.super();
            this.addOwnPropertyChangeListener("splitAxis", this);
            this.addOwnPropertyChangeListener("fixedPane", this);
            window.addEventListener("resize", this, false);
            this.splitAxis = "vertical";
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
                if (this.fixedPane === null) {
                    //use defaults
                    if(this.splitAxis === "vertical") {
                        this.handleFixedPaneChange("first");
                    } else {
                        this.handleFixedPaneChange("second");
                    }
                } else {
                    this.handleFixedPaneChange(this.fixedPane);
                }

            }
        }
    },

    // AbstractSlider overides

    _calculateSliderMagnitude: {
        value: function() {
            if(this.splitAxis === "vertical") {
                return this.element.offsetWidth;
            } else {
                return this.element.offsetHeight;
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
           if(this.fixedPane === "first" || this.fixedPane === null && this.splitAxis === "vertical") {
                this._firstPane.classList.add("is-fixed");
                this._firstPane.classList.remove("is-fill");
                this._secondPane.classList.add("is-fill");
                this._secondPane.classList.remove("is-fixed");
            } else {
                this._firstPane.classList.remove("is-fixed");
                this._firstPane.classList.add("is-fill");
                this._secondPane.classList.remove("is-fill");
                this._secondPane.classList.add("is-fixed");
            }
            this._controlledElement.style.webkitFlexBasis = (this._valuePercentage/100)*this._sliderMagnitude + "px";
        }
    },

    didDraw: {
        value: function() {
            // verify that the magnitude hasn't been changed by a parent
            if(this._sliderMagnitude !== this._calculateSliderMagnitude()) {
                this.needsDraw = true;
            }
        }
    },


    handleThumbTranslateStart: {
        value: function (e) {
            document.body.style.pointerEvents = "none";
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

    _fixedPane: {
        value: null
    },

    fixedPane: {
        get: function () {
            return this._fixedPane;
        },
        set: function (value) {
            this._fixedPane = value;
        }
    },


    fixedPane: {
        value: null
    },

    _controlledElement: {
        value: null
    },

    // Stuff

    _updateValueFromDom: {
        value: function() {
            // value is from 0 to 100
            if(this.splitAxis === "vertical") {
                this.value = (this._controlledElement.offsetWidth/this.element.offsetWidth)*100;
            } else {
                this.value = (this._controlledElement.offsetHeight/this.element.offsetHeight)*100;
            }
        }
    },

    handleSplitAxisChange: {
        value: function() {
            if(this.splitAxis === "vertical") {
                this.classList.add("is-verticalSplit");
                this.classList.remove("is-horizontalSplit");
            } else {
                this.classList.remove("is-verticalSplit");
                this.classList.add("is-horizontalSplit");
            }
        }
    },

    handleFixedPaneChange: {
        value: function(newValue) {
            if (newValue === "first") {
                this._controlledElement = this._firstPane;
            } else {
                this._controlledElement = this._secondPane;
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
    }});
