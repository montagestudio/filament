/**
    @module "ui/activity-infobar.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Set = require("montage/collections/set");

var CLASS_PREFIX = "ActivityInfobar";

/**
    Description TODO
    @class module:"ui/activity-infobar.reel".ActivityInfobar
    @extends module:montage/ui/component.Component
*/
exports.ActivityInfobar = Montage.create(Component, /** @lends module:"ui/activity-infobar.reel".ActivityInfobar# */ {

    didCreate: {
        value: function() {
            this.runningActivities = Set();
            this.completedActivities = Set();
            this.failedActivities = Set();
        }
    },

    runningActivities: {
        value: null
    },

    completedActivities: {
        value: null
    },

    failedActivities: {
        value: null
    },

    addActivity: {
        value: function(promise, title, status) {
            var self = this;

            // TODO check if promise already exists

            var task = {
                promise: promise,
                title: title || "Unnamed task",
                status: status || "",
            };

            promise.then(function (value) {
                task.status = value;
                self.runningActivities.delete(task);
                self.completedActivities.add(task);
                self.needsDraw = true;
            }, function (err) {
                var message = "";
                if (err.message) message = err.message;
                // avoid ugly [object Object]
                else if (err.toString !== Object.prototype.toString) message = err.toString();

                task.status = message;
                self.runningActivities.delete(task);
                self.failedActivities.add(task);
                self.needsDraw = true;
            }, function (status) {
                task.status = status;
                self.needsDraw = true;
            });

            this.runningActivities.add(task);
            this.needsDraw = true;
            this.infobar.show();
        }
    },

    handleDetailsAction: {
        value: function (event) {
            var self = this;
            var win = document.application.openWindow("ui/activity-list.reel",
                "ActivityList",
                {width: 500, height: 300}
            );
            win.addEventListener("load", function (event) {
                win.component.defineBinding("runningActivities", {
                    "<-": "runningActivities",
                    source: self
                });

                win.component.defineBinding("failedActivities", {
                    "<-": "failedActivities",
                    source: self
                });
            }, false);
        }
    },

    handleInfobarClosed: {
        value: function (event) {
            this.completedActivities.clear();
            this.failedActivities.clear();
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            var states = ["Completed", "Failed", "Running"];

            for (var i = 0; i < 3; i++) {
                var state = states[i];
                var lowerState = state.toLowerCase();
                var tasks = this[lowerState+"Activities"];
                var num = tasks.length;
                var els = this["_"+lowerState+"Els"];

                // TODO localize

                if (num === 0) {
                    this._element.classList.add(CLASS_PREFIX+"--none"+state);
                    this._element.classList.remove(CLASS_PREFIX+"--one"+state);
                    this._element.classList.remove(CLASS_PREFIX+"--many"+state);

                    els.title.textContent = "";
                    els.status.textContent= "";
                } else if (num === 1) {
                    this._element.classList.remove(CLASS_PREFIX+"--none"+state);
                    this._element.classList.add(CLASS_PREFIX+"--one"+state);
                    this._element.classList.remove(CLASS_PREFIX+"--many"+state);

                    if (els.num) els.num.textContent = num;
                    els.title.textContent = tasks.one().title;
                    els.status.textContent = tasks.one().status;
                } else {
                    this._element.classList.remove(CLASS_PREFIX+"--none"+state);
                    this._element.classList.add(CLASS_PREFIX+"--one"+state);
                    this._element.classList.add(CLASS_PREFIX+"--many"+state);

                    if (els.num) els.num.textContent = num;
                    els.title.textContent = "";
                    els.status.textContent = num + " tasks " + lowerState;
                }
            }
        }
    }

});
