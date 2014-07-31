/**
 * @module ui/reference/visualizer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;
var sharedReferenceManager = require("../../../core/reference-manager").sharedReferenceManager;

/**
 * @class Visualizer
 * @extends Component
 */
exports.Visualizer = Component.specialize(/** @lends Visualizer# */ {
    constructor: {
        value: function Visualizer() {
            this.super();
        }
    },

    enterDocument: {
        value: function () {
            sharedReferenceManager.registerVisualizer(this);
            var animation = document.createElementNS ("http://www.w3.org/2000/svg", "animate");
            animation.setAttribute("attributeName","d");
            animation.setAttribute("attributeType","XML");
            animation.setAttribute("repeatCount","1");
            animation.setAttribute("dur","1s");

            this.animation = animation;
        }
    },

    start: {
        value: function (session) {
            this.startX = session.startPositionX;
            this.startY = session.startPositionY;
            this.x = session.startPositionX;
            this.y = session.startPositionY;
            this._isActive = true;
            this.templateObjects.referenceVisualizerOverlay.show();

            //TODO if we have a listener for the end of the shrink then remove it (
            if (this.resetAfterAnimation.listenting) {
                this.path.removeEventListener(animationEndEvent, this.resetAfterAnimation, false);
            }
            //make sure we cleanup
            this._shouldCleanup = true;
            this.resetAfterAnimation.listenting = false;
        }
    },

    move: {
        value: function (session) {
            this.x = session.positionX;
            this.y = session.positionY;
            this.needsDraw = true;
        }
    },

    end: {
        value: function (session) {
            this._isActive = false;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {

            if(this._shouldCleanup) {
                this.path.classList.remove("is-shrink");
                this.path.classList.remove("bottomLeft");
                this.path.classList.remove("topLeft");
                this.path.classList.remove("bottomRight");
                this.path.classList.remove("topRight");
                this._shouldCleanup = false;
            }

            if(this._isActive) {
                var path = "M ";
                // move to start point
                path += this.startX + " "+ this.startY;
                // define control point
                path += " T ";
                path += this.x + " "+ this.y;
                this.path.setAttribute("d", path);
            } else {
                // animate to shrink
                this.path.classList.add("is-shrink");
                if (this.x > this.startX) {
                    if (this.y < this.startY) {
                        this.path.classList.add("bottomLeft");
                    } else {
                        this.path.classList.add("topLeft");
                    }
                } else {
                    if (this.y < this.startY) {
                        this.path.classList.add("bottomRight");
                    } else {
                        this.path.classList.add("topRight");
                    }
                }
                this.path.addEventListener(animationEndEvent, this.resetAfterAnimation, false);
                this.resetAfterAnimation.listenting = true;
            }
        }
    },

    _resetAfterAnimation: {
        value: null
    },

    resetAfterAnimation: {
        get: function () {
            if (this._resetAfterAnimation === null) {
                var self = this;
                this._resetAfterAnimation = function () {
                    self.templateObjects.referenceVisualizerOverlay.hide();
                    self.resetAfterAnimation.listenting = false;
                };
            }
            return this._resetAfterAnimation;
        }
    },

    _shouldCleanup: {
        value: false
    },

    animation: {
        value: null
    },

    startX: {
        value: 0
    },

    startY: {
        value: 0
    },

    x: {
        value: 0
    },

    y: {
        value: 0
    },

    _isActive: {
        value: false
    },

    _path: {
        value: null
    }

});

var animationEndEvent;
var _style = document.createElement("div").style;
if("webkitAnimation" in _style) {
    animationEndEvent = "webkitAnimationEnd";
} else if("MozAnimation" in _style) {
    animationEndEvent = "mozAnimationEnd";
} else {
    animationEndEvent = "animationend";
}
