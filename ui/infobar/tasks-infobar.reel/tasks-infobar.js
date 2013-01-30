/**
    @module "ui/tasks-infobar.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Set = require("collections/set");

var CLASS_PREFIX = "TasksInfobar";

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
            var states = ["Completed", "Failed", "Running"];

            for (var i = 0; i < 3; i++) {
                var state = states[i];
                var lowerState = state.toLowerCase();
                var tasks = this["_"+lowerState+"Tasks"];
                var num = tasks.length;
                var els = this["_"+lowerState+"Els"];

                // TODO localize

                if (num === 0) {
                    this._element.classList.add(CLASS_PREFIX+"--none"+state);
                    this._element.classList.remove(CLASS_PREFIX+"--one"+state);
                    this._element.classList.remove(CLASS_PREFIX+"--many"+state);

                    els.title.textContent = "";
                    els.info.textContent= "";
                } else if (num === 1) {
                    this._element.classList.remove(CLASS_PREFIX+"--none"+state);
                    this._element.classList.add(CLASS_PREFIX+"--one"+state);
                    this._element.classList.remove(CLASS_PREFIX+"--many"+state);

                    if (els.num) els.num.textContent = num;
                    els.title.textContent = tasks.one().title;
                    els.info.textContent = tasks.one().info;
                } else {
                    this._element.classList.remove(CLASS_PREFIX+"--none"+state);
                    this._element.classList.add(CLASS_PREFIX+"--one"+state);
                    this._element.classList.add(CLASS_PREFIX+"--many"+state);

                    if (els.num) els.num.textContent = num;
                    els.title.textContent = "";
                    els.info.textContent = num + " tasks " + lowerState;
                }
            }
        }
    }

});
