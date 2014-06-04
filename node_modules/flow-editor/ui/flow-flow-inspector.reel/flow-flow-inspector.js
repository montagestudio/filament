/**
 @module "ui/flow-flow-inspector.reel"
 @requires montage
 @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 Description TODO
 @class module:"ui/flow-flow-inspector.reel".FlowFlowInspector
 @extends module:montage/ui/component.Component
 */
exports.FlowFlowInspector = Component.specialize( /** @lends module:"ui/flow-flow-inspector.reel".FlowFlowInspector# */ {

    _isSelectionEnabled: {
        value: null
    },

    isSelectionEnabled: {
        get: function () {
            return this._isSelectionEnabled;
        },
        set: function (value) {
            this._isSelectionEnabled = value;
            this.isSelectionEnabledInput = value;
        }
    },

    _isSelectionEnabledInput: {
        value: null
    },

    isSelectionEnabledInput: {
        get: function () {
            return this._isSelectionEnabledInput;
        },
        set: function (value) {
            if (this._isSelectionEnabled !== value) {
                this.isSelectionEnabled = value;
            }

            this._isSelectionEnabledInput = value;
        }
    },

    _hasSelectedIndexScrolling: {
        value: null
    },

    hasSelectedIndexScrolling: {
        get: function () {
            return this._hasSelectedIndexScrolling;
        },
        set: function (value) {
            this._hasSelectedIndexScrolling = value;
            this.hasSelectedIndexScrollingInput = value;
        }
    },

    _hasSelectedIndexScrollingInput: {
        value: null
    },

    hasSelectedIndexScrollingInput: {
        get: function () {
            return this._hasSelectedIndexScrollingInput;
        },
        set: function (value) {
            if (this._hasSelectedIndexScrolling !== value) {
                this.hasSelectedIndexScrolling = value;
            }

            this._hasSelectedIndexScrollingInput = value;
        }
    },

    _scrollingTransitionTimingFunction: {
        value: null
    },

    scrollingTransitionTimingFunction: {
        get: function () {
            return this._scrollingTransitionTimingFunction;
        },
        set: function (value) {
            this._scrollingTransitionTimingFunction = value;
            this.scrollingTransitionTimingFunctionInput = value;
        }
    },

    _scrollingTransitionTimingFunctionInput: {
        value: null
    },

    scrollingTransitionTimingFunctionInput: {
        get: function () {
            return this._scrollingTransitionTimingFunctionInput;
        },
        set: function (value) {
            if (this._scrollingTransitionTimingFunction !== value) {
                this.scrollingTransitionTimingFunction = value;
            }

            this._scrollingTransitionTimingFunctionInput = value;
        }
    },

    _duration: {
        value: null
    },

    duration: {
        get: function () {
            return this._duration;
        },
        set: function (value) {
            var intValue = parseInt(value);

            this.durationInput = this._duration = !isNaN(intValue) ? intValue : 0;
        }
    },

    _durationInput: {
        value: null
    },

    durationInput: {
        get: function () {
            return this._durationInput;
        },
        set: function (value) {
            if (this._duration !== value) {
                this.duration = value;
            }

            this._durationInput = value;
        }
    },

    _scrollVectorX: {
        value: null
    },

    scrollVectorX: {
        get: function () {
            return this._scrollVectorX;
        },
        set: function (value) {
            this._scrollVectorX = value;
            this.scrollVectorXInput = value;
        }
    },

    _scrollVectorXInput: {
        value: null
    },

    scrollVectorXInput: {
        get: function () {
            return this._scrollVectorXInput;
        },
        set: function (value) {
            if (this._scrollVectorX !== value) {
                this.scrollVectorX = value;
            }

            this._scrollVectorXInput = value;
        }
    },

    _scrollVectorY: {
        value: null
    },

    scrollVectorY: {
        get: function () {
            return this._scrollVectorY;
        },
        set: function (value) {
            this._scrollVectorY = value;
            this.scrollVectorYInput = value;
        }
    },

    _scrollVectorYInput: {
        value: null
    },

    scrollVectorYInput: {
        get: function () {
            return this._scrollVectorYInput;
        },
        set: function (value) {
            if (this._scrollVectorY !== value) {
                this.scrollVectorY = value;
            }

            this._scrollVectorYInput = value;
        }
    },

    _offset: {
        value: null
    },

    offset: {
        get: function () {
            return this._offset;
        },
        set: function (value) {
            this._offset = value;
            this.offsetInput = value;
        }
    },

    _offsetInput: {
        value: null
    },

    offsetInput: {
        get: function () {
            return this._offsetInput;
        },
        set: function (value) {
            if (this._offset !== value) {
                this.offset = value;
            }

            this._offsetInput = value;
        }
    },

    _flow: {
        value: null
    },

    flow: {
        get: function () {
            return this._flow;
        },
        set: function (value) {
            this._flow = value && value._data.type === "FlowGrid" ? value : null;
        }
    },

    handleAction: {
        value: function () {
            this.dispatchEventNamed("flowPropertyChangeSet", true, true);
        }
    }

});
