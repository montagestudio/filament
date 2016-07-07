var Editor = require("palette/ui/editor.reel").Editor,
    Promise = require("montage/core/promise").Promise,
    ErrorsCommands = require('../../core/package-tools').Errors.commands,
    application = require("montage/core/application").application;

exports.PackageEditor = Editor.specialize({

    constructor: {
        value: function PackageEditor () {
            this.super();
        }
    },

    friendlyName : {
        value: "Package Manager"
    },

    acceptsActiveTarget: {
        value: true
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.addOwnPropertyChangeListener("selectedDependency", this);
                application.addEventListener("didOpenDocument", this);
            }
        }
    },

    closeDocument: {
        value: function () {
            this.clearSelection();
            this.templateObjects.searchModules.clearSearch();
        }
    },

    handleDidOpenDocument: {
        value: function (event) {
            if (this.currentDocument === event.detail.document) {
                this.updateSelectionDependencyList();
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
            if (this.currentDocument) {
                if (dependency && typeof dependency === 'object') {
                    var self = this;

                    this.currentDocument.getDependencyInformation(dependency).then(function (module) {
                        if(self.selectedDependency && module && typeof module === 'object' && module.name === self.selectedDependency.name) {
                            self.dependencyDisplayed = module;
                        }

                    }, function (error) {
                        if (error && typeof error === 'object' && error.code === ErrorsCommands.view.codes.dependencyNotFound) {
                            if (self.selectedDependency && dependency && dependency.name === self.selectedDependency.name) { // Can be private.
                                self.dependencyDisplayed = self.selectedDependency;
                                self.selectedDependency.information = {};
                            } else { // Does not exist.
                                self.clearSelection();
                            }
                        } else {
                            self.clearSelection();
                            self.dispatchEventNamed("asyncActivity", true, false, {
                                promise: Promise.reject(error),
                                title: "Package Manager"
                            });
                        }
                    });
                } else {
                    this.clearSelection();
                }
            }
        }
    },

    updateSelectionDependencyList: {
        value: function () {
            if (this.dependencyDisplayed && this.currentDocument) {
                this.previousSelectedDependency = this.currentDocument.findDependency(this.dependencyDisplayed.name, null, false);

                if (!this.previousSelectedDependency) {
                    this.clearSelection();
                } else {
                    this.templateObjects.packageDependencies.updateSelection(this.previousSelectedDependency);
                }
            }
        }
    },

    loadingDependency: {
        value: function (loading) {
            this.templateObjects.dependencyInformation.loadingDependency = !!loading;
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
                var source = event.detail.get('source'),
                    dependencyName = source.dependency.name;

                if (source && typeof source === 'object' && !source.dependency.state.acceptInstall) { // remove request
                    this.currentDocument.uninstallDependency(dependencyName);
                } else { // install request
                    var dependencyVersion = source.dependency.versionInstalled || '',
                        dependencyType = source.dependency.type;

                    this.currentDocument.installDependency(dependencyName, dependencyVersion, dependencyType);
                }
            }
        }
    },

    clearSelection: {
        value: function () {
            this.dependencyDisplayed = null;
            this.previousSelectedDependency = null;
            this.selectedDependency = null;
        }
    }

});
