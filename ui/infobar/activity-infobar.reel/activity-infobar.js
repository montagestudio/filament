/**
    @module "ui/activity-infobar.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    Set = require("montage/collections/set");

var CLASS_PREFIX = "ActivityInfobar";

/**
    Description TODO
    @class module:"ui/activity-infobar.reel".ActivityInfobar
    @extends module:montage/ui/component.Component
*/
exports.ActivityInfobar = Component.specialize(/** @lends module:"ui/activity-infobar.reel".ActivityInfobar# */ {

    constructor: {
        value: function ActivityInfobar() {
            this.super();
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

    mostRecentActivity: {
        value: null
    },

    addActivity: {
        value: function(promise, title, status) {
            var self = this;

            // TODO check if promise already exists

            var task = {
                promise: promise,
                title: title || "Unnamed task",
                status: status || ""
            };

            promise.then(function (value) {
                task.status = value || "";
                self.runningActivities.delete(task);
                self.completedActivities.add(task);
                self.mostRecentActivity = task;
                self.needsDraw = true;
            }, function (err) {
                var message = "";
                if (err.message) {
                    message = err.message;
                }
                // avoid ugly [object Object]
                else if (err.toString !== Object.prototype.toString) {
                    message = err.toString();
                }

                task.status = message || "";
                self.runningActivities.delete(task);
                self.failedActivities.add(task);
                self.mostRecentActivity = task;
                self.needsDraw = true;
            }, function (status) {
                task.status = status || "";
                self.mostRecentActivity = task;
                self.needsDraw = true;
            });

            this.runningActivities.add(task);
            self.mostRecentActivity = task;

            this.needsDraw = true;
            this.infobar.show();
        }
    },

    handleDetailsAction: {
        value: function (event) {
            this.templateObjects.overlay.show();
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
            this._completedNumEl.textContent = this.completedActivities.length;
            this._failedNumEl.textContent = this.failedActivities.length;

            // TODO replace with bindings once we get FRB
            if (this.completedActivities.length === 0) {
                this._element.classList.add(CLASS_PREFIX+"--noneCompleted");
            } else {
                this._element.classList.remove(CLASS_PREFIX+"--noneCompleted");
            }

            if (this.failedActivities.length === 0) {
                this._element.classList.add(CLASS_PREFIX+"--noneFailed");
            } else {
                this._element.classList.remove(CLASS_PREFIX+"--noneFailed");
            }

            if (!this.mostRecentActivity) {
                return;
            }

            // If there are no running activities, display the message from the
            // most recently passed/failed along with the appropriate pass/fail
            // style.
            // If there is one task running display its title and status,
            // otherwise display a count of the running tasks

            if (this.runningActivities.length === 0) {
                this._element.classList.remove(CLASS_PREFIX+"--running");
                this._titleEl.textContent = this.mostRecentActivity.title;
                this._statusEl.textContent = this.mostRecentActivity.status;

                if (this.mostRecentActivity.promise.isFulfilled()) {
                    this._element.classList.add(CLASS_PREFIX+"--completed");
                    this._element.classList.remove(CLASS_PREFIX+"--failed");
                } else if (this.mostRecentActivity.promise.isRejected()) {
                    this._element.classList.remove(CLASS_PREFIX+"--completed");
                    this._element.classList.add(CLASS_PREFIX+"--failed");
                }
            } else {
                this._element.classList.remove(CLASS_PREFIX+"--completed");
                this._element.classList.remove(CLASS_PREFIX+"--failed");
                this._element.classList.add(CLASS_PREFIX+"--running");

                if (this.runningActivities.length === 1) {
                    this._titleEl.textContent = this.mostRecentActivity.title;
                    this._statusEl.textContent = this.mostRecentActivity.status;
                } else {
                    this._titleEl.textContent = "";
                    this._statusEl.textContent = this.runningActivities.length + " activities running";
                }

            }
        }
    }

});
