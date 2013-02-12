/**
    @module "ui/activity-list.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    ContentController = require("montage/core/content-controller").ContentController,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer;

/**
    Description TODO
    @class module:"ui/activity-list.reel".ActivityList
    @extends module:montage/ui/component.Component
*/
exports.ActivityList = Montage.create(Component, /** @lends module:"ui/activity-list.reel".ActivityList# */ {

    didCreate: {
        value: function() {
            defaultLocalizer.localize("activity", "Activity").then(function (message) {
                document.title = message;
            }).done();
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
            // TODO remove when FRB arrives
            if (!Array.isArray(value)) {
                value = value.toArray();
            }
            value = ContentController.create().initWithContent(value);
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
            // TODO remove when FRB arrives
            if (!Array.isArray(value)) {
                value = value.toArray();
            }
            value = ContentController.create().initWithContent(value);
            this._failedActivities = value;
        }
    }

});
