/**
    @module "ui/tasks-infobar.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Set = require("collections/set");

/**
    Description TODO
    @class module:"ui/tasks-infobar.reel".TasksInfobar
    @extends module:montage/ui/component.Component
*/
exports.TasksInfobar = Montage.create(Component, /** @lends module:"ui/tasks-infobar.reel".TasksInfobar# */ {

    didCreate: {
        value: function() {
            this._runningTasks = Set();
            this._completedTasks = Set();
            this._failedTasks = Set();
        }
    },

    _runningTasks: {
        value: null
    },

    _completedTasks: {
        value: null
    },

    _failedTasks: {
        value: null
    },

    addTask: {
        value: function(promise, title, info) {
            var self = this;

            // TODO check if promise already exists

            var task = {
                promise: promise,
                title: title || "Unnamed task",
                info: info || "",
            };

            promise.then(function (value) {
                task.info = value;
                self._runningTasks.delete(task);
                self._completedTasks.add(task);
                self.needsDraw = true;
            }, function (err) {
                task.info = err;
                self._runningTasks.delete(task);
                self._failedTasks.add(task);
                self.needsDraw = true;
            }, function (info) {
                task.info = info;
                self.needsDraw = true;
            });

            this._runningTasks.add(task);
            this.needsDraw = true;
            this.infobar.show();
        }
    },

    handleInfobarClosed: {
        value: function (event) {
            this._completedTasks.clear();
            this._failedTasks.clear();
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            var out = "";

            out += this._runningTasks.length + " running ";
            out += this._completedTasks.length + " completed ";
            out += this._failedTasks.length + " failed ";

            this.templateObjects.title.value = out;
        }
    }

});
