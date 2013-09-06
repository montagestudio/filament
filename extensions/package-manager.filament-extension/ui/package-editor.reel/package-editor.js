var Montage = require("montage").Montage,
    Editor = require("palette/ui/editor.reel").Editor,
    Promise = require("montage/core/promise").Promise,
    ErrorsCommands = require('../../core/package-tools').Errors.commands,
    application = require("montage/core/application").application,
    INSTALL_DEPENDENCY_ACTION = 0,
    REMOVE_DEPENDENCY_ACTION = 1;

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
        value: function (evt) {
            var openedDocument = evt.detail.document;
            if (this.currentDocument === openedDocument) {
                this._updateSelection();
            }
        }
    },

    _backendPlugin: {
        get: function () {
            if (this.currentDocument) {
                return this.currentDocument.packageManagerPlugin;
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
            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name')) {
                var self = this,
                    search = (dependency.versionInstalled) ?
                        dependency.name + "@" + dependency.versionInstalled : dependency.name;

                this._backendPlugin.invoke("viewDependency", search).then(function (module) {
                    if (self.selectedDependency) {
                        if (module && typeof module === 'object' && module.hasOwnProperty('name')) {
                            module.problems = dependency.problems;
                            module.type = dependency.type;
                            module.versionInstalled = dependency.versionInstalled;
                            module.range = dependency.version;
                            module.update = dependency.update || null;
                            self.dependencyDisplayed = module;
                        } else {
                            self.dependencyDisplayed = dependency;
                        }
                    }
                }, function (error) {

                    if (error && typeof error === 'object' && error.code === ErrorsCommands.view.codes.dependencyNotFound) {
                        self.dependencyDisplayed = (self.selectedDependency) ? dependency : null;
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
                    this.removeDependency(source, source.dependency);
                } else { // install request
                    this.installDependency(source.dependency);
                }
            }
        }
    },

    /**
     * Invokes the uninstall dependency process.
     * @function
     * @param {Object} source, the cell which raised the action.
     * @param {Object} dependency, the dependency owns by the cell.
     */
    removeDependency: {
        value: function (source, dependency) {
            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name')) {
                var self = this;
                source.performingAction = true; // Notify to the cell the dependency is installing.

                var promise = this.currentDocument.uninstallDependency(dependency.name).then(function (success) {

                    if (success) {
                        self._dependenciesListChange(dependency.name, REMOVE_DEPENDENCY_ACTION);
                        return 'The dependency ' + dependency.name + ' has been removed';
                    }
                    source.performingAction = false;
                    throw new Error('An error has occurred while removing the dependency ' + dependency.name);

                }, function (error) {
                    source.performingAction = false;
                    throw error;
                });

                this.dispatchEventNamed("asyncActivity", true, false, {
                    promise: promise,
                    title: "Removing"
                });
            }
        }
    },

    installDependency: {
        value: function (dependency, version, type) {
            if (dependency && typeof dependency === "object" && dependency.name) {
                version = dependency.version;
                type = dependency.type;
                dependency = dependency.name;
            }

            var self = this,
                promise = this.currentDocument.installDependency(dependency, version, type).then(function (data) {
                    if (data && typeof data === 'object' && data.hasOwnProperty('name')) {
                        self._dependenciesListChange(data.name, INSTALL_DEPENDENCY_ACTION);
                        return 'The dependency ' + data.name + ' has been installed.';
                    }

                    throw new Error('An error has occurred while installing the dependency ' + dependency);
                });

            this.dispatchEventNamed("asyncActivity", true, false, {
                promise: promise,
                title: "Installing"
            });
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

                if (action === REMOVE_DEPENDENCY_ACTION && this.dependencyDisplayed &&
                    this.dependencyDisplayed.name === dependencyName) { // Need to clean the view part, if the dependency deleted is also the dependency displayed
                    this._clearSelection();
                }

            }
        }
    }

});
