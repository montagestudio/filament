var Montage = require("montage").Montage,
    Editor = require("palette/ui/editor.reel").Editor,
    Promise = require("montage/core/promise").Promise,
    ERROR_VIEW_CMD_NOT_FOUND = 3001,
    INSTALL_DEPENDENCY_ACTION = 0,
    REMOVE_DEPENDENCY_ACTION = 1;

exports.PackageEditor = Montage.create(Editor, {

    constructor: {
        value: function PackageEditor () {
            this.super();
        }
    },

    didDraw: {
        value: function () {
            this.addOwnPropertyChangeListener("selectedDependency", this);
            this.addOwnPropertyChangeListener("reloadingList", this);
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

    /**
     * Invoke the dependency view process, when a dependency is selected.
     * @function
     * @param {Object} dependency, the dependency which has been selected.
     */
    handleSelectedDependencyChange: {
        value: function (dependency) {
            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name')) {
                var self = this,
                    search = (dependency.versionInstalled) ? dependency.name + "@" + dependency.versionInstalled : dependency.name;

                this._backendPlugin.invoke("viewDependency", search).then(function (module) {
                    if (module && typeof module === 'object' && module.hasOwnProperty('name')) {
                        module.problems = dependency.problems;
                        module.type = dependency.type;
                        module.versionInstalled = dependency.versionInstalled;
                        self.dependencyDisplayed = module;
                    } else {
                        self.dependencyDisplayed = dependency;
                    }
                }, function (error) {

                    if (error && typeof error === 'object' && error.message === ERROR_TYPE_NOT_FOUND) {
                        self.dependencyDisplayed = dependency;
                    } else {
                        self.dependencyDisplayed = null;
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

    /**
     * Cleans the information part when the dependencies list change.
     * @function
     * @param {boolean} changed
     */
    handleReloadingListChange: {
        value: function (changed) {
            if (changed) {
                this.dependencyDisplayed = null;
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
                    this._handleRemoveDependency(source, source.dependency);
                } else { // install request
                    this._handleInstallDependency(source, source.dependency);
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
    _handleRemoveDependency: {
        value: function (source, dependency) {
            var self = this;

            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name')) {
                source.performingAction = true; // Notify to the cell the dependency is installing.

                var promise = this.currentDocument.uninstallDependency(dependency.name).then(function (success) {

                    if (success) {
                        self._dependenciesListChange(dependency, REMOVE_DEPENDENCY_ACTION);
                        return 'The dependency ' + dependency.name + ' has been removed';
                    }
                    source.performingAction = false;
                    throw new Error('An error has occurred while removing the dependency ' + dependency.name);

                }, function (error) {
                    source.performingAction = false;
                    throw error;
                });

                self.dispatchEventNamed("asyncActivity", true, false, {
                    promise: promise,
                    title: "Removing"
                });
            }
        }
    },

    /**
     * Invokes the install dependency process.
     * @function
     * @param {Object} source, the cell which raised the action.
     * @param {Object} dependency, the dependency owns by the cell.
     * @private
     */
    _handleInstallDependency: {
        value: function (source, dependency) {
            var self = this;

            if (dependency && typeof dependency === 'object' && dependency.hasOwnProperty('name')) {
                var promise = this.currentDocument.installDependency(dependency.name, (dependency.version || null), dependency.type).then(function (data) {
                    if (data && typeof data === 'object' && data.hasOwnProperty('name') && dependency.name === data.name) {
                        source.canInstall = false;

                        self._dependenciesListChange(dependency, INSTALL_DEPENDENCY_ACTION);
                        return 'The dependency ' + dependency.name + ' has been installed.';
                    }

                    throw new Error('An error has occurred while installing the dependency ' + dependency.name);

                }, function (error) {
                    throw error;
                });

                self.dispatchEventNamed("asyncActivity", true, false, {
                    promise: promise,
                    title: "Installing"
                });
            }
        }
    },

    /**
     * Notifies to the search part that the dependencies list has changed.
     * @function
     * @param {Object} dependency, the dependency which has been modified.
     * @param {String} action, specifies which action has been applied.
     * @private
     */
    _dependenciesListChange: {
        value: function (dependency, action) {
            if (dependency && action) {
                this.templateObjects.searchModules.handleDependenciesListChange(dependency, action);

                if (action === REMOVE_DEPENDENCY_ACTION && this.dependencyDisplayed && this.dependencyDisplayed.name === dependency.name) { // Need to clean the view part, if the dependency deleted is also the dependency displayed
                    this.dependencyDisplayed = null;
                }

            }
        }
    }

});
