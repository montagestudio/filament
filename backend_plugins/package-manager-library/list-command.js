var semver = require("semver"),
    PackageManagerError = require("./core").PackageManagerError,
    Q = require("q"),
    PATH = require("path"),
    FS = require("q-io/fs"),
    DEPENDENCY_TYPE_REGULAR = 'dependencies',
    DEPENDENCY_TYPE_OPTIONAL = 'optionalDependencies',
    DEPENDENCY_TYPE_BUNDLE = 'bundledDependencies',
    DEPENDENCY_TYPE_DEV = 'devDependencies',
    ERROR_DEPENDENCY_MISSING = 1000,
    ERROR_VERSION_INVALID = 1001,
    ERROR_FILE_INVALID = 1002,
    ERROR_DEPENDENCY_EXTRANEOUS = 1003,
    ERROR_PROJECT_FILE = 1004,
    ERROR_PATH_MISSING = 1005;

exports.listCommand = Object.create(Object.prototype, {

    /**
     * Lists all dependencies of the app project, and try to find some eventual errors.
     * @function
     * @param {String} dirPath, file system path where to operate.
     * @param {boolean} lite, which kind of tree should return this function, either a lite or a more complete one.
     * @return {Promise.<Object>} Promise for the dependencies tree.
     */
    run: {
        value: function (dirPath, lite) {
            if (typeof dirPath === "string" && dirPath.length > 0) {
                this._app = {
                    name: '',
                    version: '',
                    file: null,
                    path: (dirPath.charAt(dirPath.length-1) === '/') ? dirPath : PATH.join(dirPath, '/')
                };

                return this._runProcess(lite);
            } else {
                return Q.reject(new PackageManagerError("The project path is missing", ERROR_PATH_MISSING));
            }
        }
    },

    /**
     * Represents the app project (root of the tree).
     * @type {Object}
     * @default null
     * @private
     */
    _app: {
        value: null,
        writable: true
    },

    /**
     * Add the missing dependencies container to the _app property.
     * @function
     * @private
     */
    _addMissingFields: {
        value: function () {
            var file = this._app.file;
            file.dependencies = (typeof file.dependencies !== 'undefined') ? file.dependencies : {};
            file.optionalDependencies = (typeof file.optionalDependencies !== 'undefined') ? file.optionalDependencies : {};
            file.devDependencies = (typeof file.devDependencies !== 'undefined') ? file.devDependencies : {};
            file.bundledDependencies = (file.bundleDependencies || file.bundledDependencies || []);
        }
    },

    /**
     * Returns a lite and clean tree, which contains just the dependencies of "the top level".
     * @function
     * @private
     * @return {Object} lite tree.
     */
    _lite: {
        value: function () {
            var dependencies = Array.isArray(this._app.dependencies) ? this._app.dependencies : [];

            for (var i = 0, length = dependencies.length; i < length; i++) {
                delete dependencies[i].parent;
                delete dependencies[i].dependencies;
            }

            this._addMissingFields();
            return this._app;
        }
    },

    /**
     * Returns a complete and clean tree, which contains all information about the dependencies project.
     * @function
     * @private
     * @return {Object} complete tree + app_project information.
     */
    _complete: {
        value: function () {
            var dependencies = Array.isArray(this._app.dependencies) ? this._app.dependencies : [];
            this._app.dependencies = this._getComplete(dependencies);

            this._addMissingFields();
            return this._app;
        }
    },

    /**
     * Returns a well formatted "complete tree".
     * @function
     * @param {Array} dependencies, dependencies container of a given level.
     * @return {Object} complete tree.
     * @private
     */
    _getComplete: {
        value: function (dependencies) {
            if (Array.isArray(dependencies)) {
                for (var i = 0, length = dependencies.length; i < length; i++) {
                    delete dependencies[i].parent;

                    if (dependencies[i].dependencies.length > 0) { // Format deeply
                        this._getComplete(dependencies[i].dependencies);
                    }
                }
                return dependencies;
            } else {
                return [];
            }
        }
    },

    /**
     * Run the main process, which takes place in two steps:
     * 1: Getting information form the file system and every package.json file.
     * 2: Finding eventual errors according to previous information gathered.
     * @function
     * @param {Object} deferred, used later to returns the tree.
     * @param {boolean} lite, returns either a lite tree or not.
     * @private
     */
    _runProcess: {
        value: function (lite) {
            var self = this;

            // Step 1: Get information.
            return this._readJsonFile(this._app.path, this._app, true).then(function () {
                if (!self._app.jsonFileMissing && !self._app.jsonFileError) {
                    delete self._app.parent; // Cleaning up.

                    // Step 2: Find eventual errors.
                    self._findEventualErrors();
                    return !!lite ? self._lite() : self._complete();
                }

                throw new PackageManagerError("The Project package.json file shows errors", ERROR_PROJECT_FILE);
            });
        }
    },

    /**
     * Read the package.json file of the current dependency or the app project,
     * in order to get further information about it.
     * @function
     * @param {String} path, represents the package.json file path of the current dependency or the project app.
     * @param {Object} currentDependency, represents the current dependency which is analyzing.
     * @param {boolean} root, whether true will store the raw data of the package.json file.
     * but once all information will have been gathered.
     * @private
     */
    _readJsonFile: {
        value: function (path, currentDependency, root) {
            var self = this,
                file = PATH.join(path, 'package.json');

            return FS.exists(file).then(function (exists) {
                var moduleParsed = {};

                if (exists) {
                    return FS.read(file).then(function (data) {
                        try {
                            moduleParsed = JSON.parse(data);

                            if (typeof moduleParsed.name === 'undefined' || typeof moduleParsed.version === 'undefined' || (!root && moduleParsed.name !== currentDependency.name) ) {
                                // If the name or the version field are missing.
                                currentDependency.jsonFileError = true;
                            }

                            if (!currentDependency.jsonFileError && root) {
                                currentDependency.file = JSON.parse(data);
                                currentDependency.name = moduleParsed.name;
                                currentDependency.version = moduleParsed.version;
                            }

                        } catch (exception) {
                            currentDependency.jsonFileError = true;
                        }

                        moduleParsed.path = path;

                        if (!currentDependency.jsonFileError) {
                            currentDependency.versionInstalled = moduleParsed.version;
                            currentDependency.private = !!moduleParsed.private;
                            return self._handleJsonFile(moduleParsed, currentDependency); // If no errors, then format results.
                        }

                        return moduleParsed;
                    }, function () {
                        currentDependency.jsonFileError = true;
                    });
                } else { // The package.json file is missing.
                    currentDependency.jsonFileMissing = true;
                }
            });
        }
    },

    /**
     * Regroups and performs a cleaning of all dependencies types into an array,
     * once the package.json file has been parsed.
     * @function
     * @param {Object} moduleParsed, represents the raw data from the package.json file.
     * @param {Object} currentDependency, represents the current dependency which is analyzing.
     * @private
     */
    _handleJsonFile: {
        value: function (moduleParsed, currentDependency) {

            if (moduleParsed.optionalDependencies) { // if optionalDependencies exists
                var temp = {dependencies: this._formatDependencies(moduleParsed.optionalDependencies,
                    currentDependency, moduleParsed.path, DEPENDENCY_TYPE_OPTIONAL) };

                this._mergeDependencies(temp, (moduleParsed.dependencies) ? this._formatDependencies(
                    moduleParsed.dependencies, currentDependency, moduleParsed.path, DEPENDENCY_TYPE_REGULAR) : []
                );

                moduleParsed.dependencies = temp.dependencies;
            } else {
                moduleParsed.dependencies = (moduleParsed.dependencies) ? this._formatDependencies(
                    moduleParsed.dependencies, currentDependency, moduleParsed.path, DEPENDENCY_TYPE_REGULAR) : [];
            }

            if (moduleParsed.devDependencies) { // if devDependencies exists.
                this._mergeDependencies(moduleParsed,
                    this._formatDependencies(moduleParsed.devDependencies,
                        currentDependency, moduleParsed.path, DEPENDENCY_TYPE_DEV));
            }

            this._formatBundledDependencies(currentDependency,
                (moduleParsed.bundleDependencies || moduleParsed.bundledDependencies || null));

            return this._readInstalled(moduleParsed, currentDependency);
        }
    },

    _formatBundledDependencies: {
        value: function (currentDependency, bundledDependencies) {
            if (bundledDependencies) { // if bundleDependencies exists.
                if (!currentDependency.bundledDependencies) {
                    currentDependency.bundledDependencies = {};
                }

                if (Array.isArray(bundledDependencies)) {
                    for (var i = 0, length = bundledDependencies.length; i < length; i++) {
                        currentDependency.bundledDependencies[bundledDependencies[i]] = i;
                    }
                }
            }
        }
    },

    /**
     * Formats and returns a dependencies list from the package.json file.
     * @function
     * @param {Object} dependencies, represents a raw dependency list from the package.json file.
     * @param {Object} parent, the parent which owns this list.
     * @param {String} path, current path of the dependency which is analyzing.
     * @param {String} type, represents the dependency type that contain this list.
     * @return {Array} array of dependencies.
     * @private
     */
    _formatDependencies: {
        value: function  (dependencies, parent, path, type) {
            var container = [];

            if (dependencies && typeof dependencies === 'object') {
                var keys = Object.keys(dependencies);

                for (var i = 0, length = keys.length; i < length; i++) {
                    container.push({
                        name: keys[i],
                        version: dependencies[keys[i]],
                        missing: true, // By default all dependencies are missing,
                        // later they will be checked whether they are in the file system.
                        dependencies: [],
                        bundledDependencies: {},
                        parent: parent,
                        path: path,
                        type: type
                    });
                }
            }

            return container;
        }
    },

    /**
     * Merges different kind of dependencies list into one.
     * @function
     * @param {Object} module,
     * @param {Object} items, dependencies to add.
     * @private
     */
    _mergeDependencies: {
        value: function (module, items) {
            var dependencies = module.dependencies;

            if (Array.isArray(dependencies) && Array.isArray(items)) {
                var names = [];

                for (var i = 0, length = dependencies.length; i < length; i++) {
                    names.push(dependencies[i].name);
                }

                module.dependencies = dependencies.concat(
                    items.filter(function (element) {
                        return (names.indexOf(element.name) < 0);
                    })
                );
            }
        }
    },

    /**
     * Find the key of a dependency object within an array of dependencies.
     * @function
     * @param {String} name, dependency name.
     * @param {Array} dependencies, array of dependencies.
     * @return {Integer}
     * @private
     */
    _getDependencyIndex: {
        value: function (name, dependencies) {
            if (Array.isArray(dependencies)) {
                for (var i = 0, length = dependencies.length; i < length; i++) {
                    if (dependencies[i].name === name) {
                        return i;
                    }
                }
            }
            return -1;
        }
    },

    /**
     * Used for sorting dependency, sort by name, ASC.
     * @function
     * @param {Object} a, dependency A.
     * @param {Object} b, dependency B.
     * @return {Integer}
     * @private
     */
    _sortDependencies: {
        value: function (a, b) {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
        }
    },

    _checkFile: {
        value: function (element, path) {
            var deferred = Q.defer();

            if (element.charAt(0) !== '.') {
                FS.stat(PATH.join(path, element)).then(function (stats) {
                    deferred.resolve([stats.isDirectory(), element]);
                });
            } else {
                deferred.resolve([false]);
            }

            return deferred.promise;
        }
    },

    _filterListFiles: {
        value: function (list, path) {
            var container = [],
                self = this;

            if (Array.isArray(list) && list.length > 0) {
                return Q.all(list.map(function (item) {
                        return self._checkFile(item, path).then(function (data) {
                            if (data[0]) {
                                container.push(data[1]);
                            }
                        });
                    }))
                    .then(function () {
                        return container;
                    });
            } else {
                return Q(container);
            }
        }
    },

    /**
     * Reads dependencies in the file system, in order to make sure the dependency are well installed,
     * Besides, sets as extraneous every dependency which are not within the package.json file.
     * @function
     * @param {Object} moduleParsed, represents the raw data from the package.json file.
     * @param {Object} currentDependency, represents the current dependency which is analyzing.
     * @private
     */
    _readInstalled: {
        value: function (moduleParsed, currentDependency) {
            var self = this,
                path = PATH.join(moduleParsed.path, 'node_modules/');

            return FS.exists(path).then(function (exists) {
                if (exists) {
                    return FS.list(path).then(function (files) {
                        return self._filterListFiles(files, path).then(function (modulesInstalled) {

                            for (var i = 0, length = modulesInstalled.length; i < length; i++) {

                                var moduleName = modulesInstalled[i],
                                    index = self._getDependencyIndex(moduleName, moduleParsed.dependencies);

                                if (index < 0) { // If index < 0, then the dependency is missing within the package.json file.
                                    moduleParsed.dependencies.push({
                                        name: moduleName,
                                        version: '',
                                        missing: false,
                                        dependencies: [],
                                        parent: currentDependency,
                                        path: moduleParsed.path,
                                        type: (currentDependency.bundledDependencies &&
                                            currentDependency.bundledDependencies[moduleName]) ?
                                            DEPENDENCY_TYPE_BUNDLE : DEPENDENCY_TYPE_REGULAR,
                                        extraneous: true
                                    });
                                } else { // not missing
                                    moduleParsed.dependencies[index].missing = false;
                                }
                            }
                        },  function () {})
                            .then(function () {
                                currentDependency.dependencies = moduleParsed.dependencies.sort(self._sortDependencies);
                                return self._findChildren(currentDependency); // try to find children.
                            });
                    });
                }
            });
        }

    },

    /**
     * Tries to find some dependency children.
     * @function
     * @param {Object} parent, represents the current dependency which is analyzing.
     * @private
     */
    _findChildren: {
        value: function (parent) {
            var dependencies = parent.dependencies,
                self = this;

            return Q.all(dependencies.map(function (child) {
                if (!child.missing) { // Examines the package.json file of the current child
                    return self._readJsonFile(PATH.join(child.path, 'node_modules/', child.name, '/'), child);
                }
            }));
        }
    },

    /**
     * Tries to find some eventual errors, once the step 1 is finished.
     * @function
     * @private
     */
    _findEventualErrors: {
        value: function () {
            this._browseTree(this._app);
        }
    },

    /**
     * Browses the entire tree in order to find errors.
     * @function
     * @param {Object} module, current level to check.
     * @private
     */
    _browseTree: {
        value: function (module) {
            var dependencies = module.dependencies;

            if (Array.isArray(dependencies)) {
                for (var i = 0, length = dependencies.length; i < length; i++) { // for each dependency we looks for eventual errors
                    this._reportEventualErrors(module, dependencies[i]);

                    if (dependencies[i].dependencies.length > 0) { // need to check deeply
                        this._browseTree(dependencies[i]);
                    }
                }
            }
        }
    },

    /**
     * Returns the top level parents of a dependency.
     * Does not return the "app" parent level.
     * @function
     * @param {Object} element, first call the dependency, then becomes a parents which has been found.
     * @param {Object} previous, previous parent which has been found.
     * @return {Object}
     * @private
     */
    _findTopParent: {
        value: function (element, previous) {
            if (element.parent) {
                return this._findTopParent(element.parent, element);
            } else if (typeof previous === 'undefined') {
                return element;
            } else {
                return previous;
            }
        }
    },

    /**
     * Tries to find recursively whether a dependency is present upstream within the tree.
     * @function
     * @param {Object} parent, current parent.
     * @param {String} name, name of the dependency to search.
     * @return {Object|undefined}
     * @private
     */
    _searchDependencyFromParent: {
        value: function (parent, name) {
            if (parent && parent.dependencies) {
                var dependencies = parent.dependencies;

                if (Array.isArray(dependencies)) {
                    for (var i = 0, length = dependencies.length; i < length; i++) {
                        if (!dependencies[i].missing && dependencies[i].name === name) {
                            return dependencies[i];
                        }
                    }
                    // Examines the next parent level when no results.
                    return this._searchDependencyFromParent(parent.parent, name);
                }
            }
        }
    },

    /**
     * Determines whether a dependency is present before within the tree.
     * @function
     * @param {Object} dependency, dependency to search.
     * @return {Object|undefined}
     * @private
     */
    _isParentHasDependency: {
        value: function (dependency) {
            return this._searchDependencyFromParent(dependency.parent, dependency.name); // At least one parent,
            // The deepest "parent level" has already been checked by the readInstalled function.
        }
    },

    /**
     * Checks whether an error has already been raised to the top level.
     * @function
     * @param {Object} error, current error.
     * @param {Object} parent, current top level.
     * @private
     */
    _hasAlreadyBeenRaised: {
        value: function (error, parent) {
            var problems = (parent && parent.problems) ? parent.problems : null;

            if (Array.isArray(problems)) {
                for (var i = 0, length = problems.length; i < length; i++) {
                    if (problems[i] && problems[i].name === error.name && problems[i].type === error.type) {
                        return true;
                    }
                }
            }
        }
    },

    /**
     * Reports to the top level a dependency error.
     * @function
     * @param {Object} child, a dependency which shows an error.
     * @param {Number} type, represents the error type.
     * @param {String} message, a message related to the error.
     * @private
     */
    _reportTopLevel: {
        value: function (child, type, message) {
            var parent = this._findTopParent(child), // Get its "top level" dependency.
                error = {
                    name: child.name,
                    type: type,
                    message: message,
                    parent: (child.parent.name !== this._app.name) ? child.parent.name : 'app'
                };

            if (!this._hasAlreadyBeenRaised(error, parent)) { // Check if an similar error has already been raised to this top level.
                if (!Array.isArray(parent.problems)) {
                    parent.problems = [];
                }

                parent.problems.push(error);
            }
        }
    },

    /**
     * Tries to find an error for a dependency, priority:
     * 1: file missing or shows errors.
     * 2: dependency missing (just regular type)
     * 3: dependency extraneous
     * 4: version checking (need to be a valid version)
     * @function
     * @param {Object} parent, the current parent dependency.
     * @param {Object} dependency, one of the parent dependency.
     * @private
     */
    _reportEventualErrors: {
        value: function (parent, dependency) {
            if (!dependency.jsonFileError && !dependency.jsonFileMissing) { // If no file errors.
                if (dependency.missing && dependency.type === DEPENDENCY_TYPE_REGULAR) { // If the dependency is missing.
                    var substituteDependency = this._isParentHasDependency(dependency); // Check if one of its parents have it.

                    if (!substituteDependency) { // Parents don't have it.
                        this._reportTopLevel(dependency, ERROR_DEPENDENCY_MISSING, dependency.name + ' is missing' +
                            ((parent.name && parent.name !== this._app.name) ? ', required by ' + parent.name : ''));
                    } else { // Parents have it.
                        dependency.versionInstalled = substituteDependency.versionInstalled;

                        if (semver.validRange(dependency.version) &&
                            !semver.satisfies(dependency.versionInstalled, dependency.version, true)) {

                            dependency.invalid = true;
                            this._reportTopLevel(dependency, ERROR_VERSION_INVALID, dependency.name + ' version is invalid');
                        }
                    }
                } else if (dependency.extraneous && dependency.type !== DEPENDENCY_TYPE_BUNDLE) { // If not within the package.json file.
                    this._reportTopLevel(dependency, ERROR_DEPENDENCY_EXTRANEOUS, dependency.name + ' is extraneous');
                } else if (!dependency.missing && dependency.type !== DEPENDENCY_TYPE_DEV &&
                    semver.validRange(dependency.version) &&
                    !semver.satisfies(dependency.versionInstalled, dependency.version, true)) { // Check the version requirement.

                    dependency.invalid = true;
                    this._reportTopLevel(dependency, ERROR_VERSION_INVALID, dependency.name + ' version is invalid');
                }
            } else {
                this._reportTopLevel(dependency, ERROR_FILE_INVALID,'the package.json file of ' + dependency.name +
                    ((!!dependency.jsonFileError) ? 'shows a few errors' : ' is missing'));
            }
        }
    }

});
