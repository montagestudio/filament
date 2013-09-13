var Montage = require("montage").Montage,
    Editor = require("palette/ui/editor.reel").Editor,
    Promise = require("montage/core/promise").Promise,
    ErrorsCommands = require('../../core/package-tools').Errors.commands,
    application = require("montage/core/application").application,
    Dependency = require("../../core/dependency").Dependency;

exports.PackageEditor = Montage.create(Editor, {

    constructor: {
        value: function PackageEditor () {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.addOwnPropertyChangeListener("selectedDependency", this);
                this.addOwnPropertyChangeListener("reloadingList", this, true);
                application.addEventListener("didOpenDocument", this);
            }
        }
    },

    closeDocument: {
        value: function () {
            this._clearSelection();
            this.templateObjects.searchModules.clearSearch();
        }
    },

    handleDidOpenDocument: {
        value: function (event) {
            if (this.currentDocument === event.detail.document) {
                this._updateSelection();
            }
        }
    },

    /**
     * Dependency related to the selected dependency, with more information about it.
     * Information gathered after that the view command has been invoked.
     * @type {Object}
     * @default null
     */
    dependencyDisplayed: {
        value: null
    },

    /**
     * The current selected dependency from the dependencies list.
     * @type {Object}
     * @default null
     */
    selectedDependency: {
        value: null
    },

    previousSelectedDependency: {
        value: null
    },

    /**
     * Invoke the dependency view process, when a dependency is selected.
     * @function
     * @param {Object} dependency, the dependency which has been selected.
     */
    handleSelectedDependencyChange: {
        value: function (dependency) {
            if (this.currentDocument && dependency && typeof dependency === 'object') {
                var self = this;

                this.currentDocument.getInformationDependency(dependency).then(function (module) {
                    if(self.selectedDependency && module && typeof module === 'object' && module.name === self.selectedDependency.name) {
                        self.dependencyDisplayed = module;
                    }
                }, function (error) {
                    if (error && typeof error === 'object' && error.code === ErrorsCommands.view.codes.dependencyNotFound) {
                        if (self.selectedDependency && dependency && dependency.name === self.selectedDependency.name) { // Can be private.
                            self.dependencyDisplayed = self.selectedDependency;
                            self.selectedDependency.information = {};
                        } else { // Does not exist.
                            self._clearSelection();
                        }
                    } else {
                        self._clearSelection();
                        self.dispatchEventNamed("asyncActivity", true, false, {
                            promise: Promise.reject(error),
                            title: "Package Manager"
                        });
                    }
                });
            }
        }
    },

    /**
     * "Watches" if the the dependencies list is reloading.
     * @type {boolean}
     * @default false
     * @return {boolean}
     */
    reloadingList: {
        value: false
    },

    _updateSelection: {
        value: function () {
            if (this.dependencyDisplayed && this.currentDocument) {
                this.previousSelectedDependency = this.currentDocument.findDependency(this.dependencyDisplayed.name, null, false);

                if (!this.previousSelectedDependency) {
                    this._clearSelection();
                } else {
                    this.templateObjects.packageDependencies.updateSelection(this.previousSelectedDependency);
                }
            }
        }
    },

    handleReloadingListWillChange: {
        value: function () {
            if (this.reloadingList) {
                this._updateSelection();
            }
        }
    },

    /**
     * Handles any button actions from a dependency cell,
     * it will select the right action to perform relative to the information contained within the event.
     * @function
     * @param {event} event
     */
    handleDependencyButtonAction: {
        value: function (event) {
            if (this.currentDocument) {
                var source = event.detail.get('source');

                if (source && typeof source === 'object' && !source.canInstall) { // remove request
                    this.currentDocument.performActionDependency(Dependency.REMOVE_DEPENDENCY_ACTION, source.dependency).done();
                } else { // install request
                    this.currentDocument.performActionDependency(Dependency.INSTALL_DEPENDENCY_ACTION, source.dependency).done();
                }
            }
        }
    },

    _clearSelection: {
        value: function () {
            this.dependencyDisplayed = null;
            this.previousSelectedDependency = null;
            this.selectedDependency = null;
        }
    },

    /**
     * Notifies to the search part that the dependencies list has changed.
     * @function
     * @param {String} dependencyName, the dependency name which has been modified.
     * @param {String} action, specifies which action has been applied.
     * @private
     */
    _dependenciesListChange: {
        value: function (dependencyName, action) {
            if (dependencyName && action >= 0) {
                this.templateObjects.searchModules.handleDependenciesListChange(dependencyName, action);

                if (action === Dependency.REMOVE_DEPENDENCY_ACTION && this.dependencyDisplayed &&
                    this.dependencyDisplayed.name === dependencyName) { // Need to clean the view part, if the dependency deleted is also the dependency displayed
                    this._clearSelection();
                }

            }
        }
    }

});
