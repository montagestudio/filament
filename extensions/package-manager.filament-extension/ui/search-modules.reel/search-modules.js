/**
 * @module ui/search-modules.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    CLEAR_BUTTON_DEFAULT_LABEL = 'clear',
    CLEAR_BUTTON_STOP_LABEL = 'stop',
    REMOVE_DEPENDENCY_ACTION = 1,
    MIN_SEARCH_LENGTH = 1;

/**
 * @class SearchModules
 * @extends Component
 */
exports.SearchModules = Component.specialize(/** @lends SearchModules# */ {

    constructor: {
        value: function SearchModules() {
            this.super();
        }
    },

    handleSearchInputAction: {
        value: function (event) {
            this._startSearch();
        }
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

    /**
     * Reference to the packageDocument.
     * @type {Object}
     * @default null
     */
    editingDocument: {
        value: null
    },

    _clearButtonLabel: {
        value: null
    },

    clearButtonLabel: {
        set: function (label) {
            this._clearButtonLabel = (typeof label === "string") ? label : CLEAR_BUTTON_DEFAULT_LABEL;
        },
        get: function () {
            if (!this._clearButtonLabel) {
                this._clearButtonLabel = CLEAR_BUTTON_DEFAULT_LABEL;
            }
            return this._clearButtonLabel;
        }
    },

    _searchResults: {
        value: null
    },

    /**
     * Contains results from a search request.
     * @type {Array}
     * @default null
     */
    searchResults: {
        set: function (results) {
            this._searchResults = Array.isArray(results) ? results : null;
        },
        get: function () {
            return this._searchResults;
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

    /**
     * Indicates whether a search request is operating.
     * @function
     * @param {boolean} searching
     */
    isSearching: {
        set: function (searching) {
            this._searching = (typeof searching === 'boolean') ? searching : false;
            this.templateObjects.searchButton.enabled = !this._searching;
            this.templateObjects.searchInput.element.disabled = this._searching;
            this.clearButtonLabel = (this._searching) ? CLEAR_BUTTON_STOP_LABEL : CLEAR_BUTTON_DEFAULT_LABEL;
        },
        get: function () {
            return this._searching;
        }
    },

    /**
     * Searches if a dependency is in the results array,
     * After deleting or removing a dependency.
     * @function
     * @param {Object} dependency
     * @param {string} action
     */
    handleDependenciesListChange: {
        value: function (dependency, action) {
            if (dependency && Array.isArray(this.searchResults) && this.searchResults.length > 0) {
                var result = this._findResult(dependency.name);

                if (result) {
                    result.installed = (action !== REMOVE_DEPENDENCY_ACTION);
                }
            }
        }
    },

    /**
     * Find a package or its index within the results array.
     * @function
     * @param {Object} name
     * @param {boolean} index
     * @return {Object|integer}
     */
    _findResult: {
        value: function (name, index) {
            if (typeof name === 'string') {
                var keys = Object.keys(this.searchResults);

                for (var i = 0, length = keys.length; i < length; i++) {
                    if (name === this.searchResults[keys[i]].name) {
                        return (index) ? keys[i] : this.searchResults[keys[i]]; // return index or the dependency
                    }
                }
            }
            return null;
        }
    },

    /**
     * Clears the results list and
     * @function {boolean}
     * @param {Event} event, contain the cell which has raised the request.
     */
    handleClearAction: {
        value: function () {
            this.searchResults = null;
            this.request = null;
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
            var cell = event.detail.get('cell'),
                module = cell.module;

            if (this.editingDocument && module && typeof module === 'object' && module.hasOwnProperty('name')) {
                cell.installing(true);

                var promise = this.editingDocument.installDependency(module.name).then(function (data) {
                    if (data && typeof data === 'object' && data.hasOwnProperty('name') && module.name === data.name) {
                        if (cell) {
                            module.installed = true;
                        }
                        return "The dependency " + module.name + " has been installed";
                    }
                }, function (error) {
                    if (cell) {
                        cell.error(true);
                    }
                    throw error;
                });

                this.dispatchEventNamed("asyncActivity", true, false, {
                    promise: promise,
                    title: "Installing"
                });
            }
        }
    },

    _startSearch: {
        value: function () {
            if (!this.isSearching && this.request && this.request.length >= MIN_SEARCH_LENGTH) {
                var self = this;
                this.isSearching = true;

                this.editingDocument.packageManagerPlugin.invoke("searchModules", this.request).then(function (results) {
                    if (Array.isArray(results)) {
                        if (self.isSearching) {
                            for (var i = 0, length = results.length; i < length; i++) { // search for each result if it has already been installed
                                var result = results[i];

                                if (result && typeof result === 'object' && result.hasOwnProperty('name')) {
                                    var dependency = self.editingDocument.findDependency(result.name);
                                    result.installed = !!(dependency && !dependency.missing);
                                } else {
                                    results.splice(i, 1);
                                }
                            }
                        } else {
                            results = null;
                        }
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
     * Handles a research request.
     * @function {boolean}
     */
    handleSearchButtonAction: {
        value: function (event) {
            this._startSearch();
        }
    },

    /**
     * Terminates the current search request
     * @function {boolean}
     */
    _terminateSearch: {
        value: function (results) {
            this.searchResults = results;
            this.isSearching = false;
        }
    }

});
