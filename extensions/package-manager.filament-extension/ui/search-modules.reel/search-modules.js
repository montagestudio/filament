/**
 * @module ui/search-modules.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    CELL_STATES = require("./search-modules-cell.reel").STATES,
    MIME_TYPES = require("../../core/mime-types"),
    application = require("montage/core/application").application;

/**
 * @class SearchModules
 * @extends Component
 */
exports.SearchModules = Component.specialize(/** @lends SearchModules# */ {

    constructor: {
        value: function SearchModules() {
            this.super();
            this.addOwnPropertyChangeListener("request", this);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var searchElement = this.templateObjects.searchResults._element;
                searchElement.addEventListener("dragstart", this, false);
                searchElement.addEventListener("dragend", this, false);

                application.addEventListener("dependencyInstalled", this);
                application.addEventListener("dependencyRemoved", this);
            }
        }
    },

    packageDependencies: {
        value: null
    },

    /**
     * Reference to the packageDocument.
     * @type {Object}
     * @default null
     */
    editingDocument: {
        value: null
    },

    _request: {
        value: null
    },

    /**
     * The request value which is used for a searching action.
     * @type {String}
     * @default null
     */
    request: {
        set: function (request) {
            this._request = (typeof request === 'string') ? request : null;
        },
        get: function () {
            return this._request;
        }
    },

    _results: {
        value: null
    },

    /**
     * Contains results from a search request.
     * @type {Array}
     * @default null
     */
    results: {
        set: function (results) {
            this._results = Array.isArray(results) ? results : null;
        },
        get: function () {
            return this._results;
        }
    },

    /**
     * Indicates whether a search request is operating.
     * @type {boolean}
     * @default false
     * @private
     */
    _searching: {
        value: false
    },

    handleRequestChange: {
        value: function () {
            if (this.results && typeof this.request === 'string' && this.request.length === 0) {
                this.clearSearch();
            }
        }
    },

    /**
     * Indicates whether a search request is operating.
     * @function
     * @param {boolean} searching
     */
    isSearching: {
        set: function (searching) {
            this._searching = (typeof searching === 'boolean') ? searching : false;
            this.searchInput.element.disabled = this._searching;
        },
        get: function () {
            return this._searching;
        }
    },

    handleSearchAction: {
        value: function () {
            this._startSearch();
        }
    },

    clearSearch: {
        value: function () {
            this.results = null;
            this.request = null;
            this.isSearching = false;
        }
    },

    _startSearch: {
        value: function () {
            if (!this.isSearching && this.request) {
                var self = this;
                this.isSearching = true;

                this.editingDocument.environmentBridge.searchPackages(this.request).then(function (results) {
                    for (var i = 0, length = results.length; i < length; i++) { // search for each result if it has already been installed
                        var result = results[i],
                            dependency = self.editingDocument.findDependency(result.name);

                        result.state = (dependency && !dependency.missing) ? CELL_STATES.INSTALLED : CELL_STATES.DEFAULT;
                    }

                    self._terminateSearch(results);
                }, function (error) {
                    self._terminateSearch();

                    self.dispatchEventNamed("asyncActivity", true, false, {
                        promise: Promise.reject(error),
                        title: "Searching"
                    });
                });
            }
        }
    },

    /**
     * Terminates the current search request
     * @function {boolean}
     */
    _terminateSearch: {
        value: function (results) {
            this.results = results || [];
            this.isSearching = false;
        }
    },

    /**
     * Handles a installation request.
     * @function {boolean}
     * @param {Event} event, contain the cell which has raised the request.
     */
    handleModuleInstallAction:{
        value: function (event) {
            var module = event.detail.get('module');

            if (this.editingDocument && module && typeof module === 'object' && module.hasOwnProperty('name')) {
                this.editingDocument.installDependency(module.name, module.version);
            }
        }
    },

    handleDependencyInstalled: {
        value: function (event) {
            var dependencyInstalled = event.detail.installed,
                dependency = this._findResult(dependencyInstalled.requestedName);

            if (dependency) {
                dependency.state = CELL_STATES.INSTALLED;
            }
        }
    },

    handleDependencyRemoved: {
        value: function (event) {
            var dependencyRemoved = event.detail.removed,
                dependency = this._findResult(dependencyRemoved.name);

            if (dependency) {
                dependency.state = CELL_STATES.DEFAULT;
            }
        }
    },

    /**
     * Find a package or its index within the results array.
     * @function
     * @param {Object} name
     * @param {boolean} index
     * @return {Object|Integer}
     */
    _findResult: {
        value: function (name, index) {
            if (typeof name === 'string') {
                var keys = Object.keys(this.results);

                for (var i = 0, length = keys.length; i < length; i++) {
                    if (name === this.results[keys[i]].name) {
                        return (index) ? keys[i] : this.results[keys[i]]; // return index or the dependency
                    }
                }
            }
            return null;
        }
    },

    handleDragstart: {
        value: function (event) {
            var source = event.target.component;

            if (source && this.packageDependencies && typeof source === "object" && source.hasOwnProperty("module")) {
                var module = source.module,
                    dataTransfer = event.dataTransfer;

                dataTransfer.effectAllowed = 'copy';
                dataTransfer.setData(MIME_TYPES.PACKAGE_MANAGER_INSTALLATION_DEPENDENCY, JSON.stringify(module));
                this.packageDependencies.acceptDrop(event);
            }

        }
    },

    handleDragend: {
        value: function () {
            if (this.packageDependencies) {
                this.packageDependencies.forceDisplayGroups(false);
            }
        }
    }

});
