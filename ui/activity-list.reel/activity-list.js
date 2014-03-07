/**
    @module "ui/activity-list.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController;

/**
    Description TODO
    @class module:"ui/activity-list.reel".ActivityList
    @extends module:montage/ui/component.Component
*/
exports.ActivityList = Montage.create(Component, /** @lends module:"ui/activity-list.reel".ActivityList# */ {

    constructor: {
        value: function ActivityList() {
            this.super();
        }
    },

    _runningActivities: {
        value: null
    },
    runningActivities: {
        get: function () { return this._runningActivities; },
        set: function (value) {
            if (!value) {
                return;
            }
            value = RangeController.create().initWithContent(value);
            this._runningActivities = value;
        }
    },

    _failedActivities: {
        value: null
    },
    failedActivities: {
        get: function () { return this._failedActivities; },
        set: function (value) {
            if (!value) {
                return;
            }
            value = RangeController.create().initWithContent(value);
            this._failedActivities = value;
        }
    }

});
