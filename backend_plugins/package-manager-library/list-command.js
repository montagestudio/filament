var semver = require("semver"),
    Q = require("q"),
    DEPENDENCY_TYPE_REGULAR = 'regular',
    DEPENDENCY_TYPE_OPTIONAL = 'optional',
    DEPENDENCY_TYPE_BUNDLE = 'bundle',
    DEPENDENCY_TYPE_DEV = 'dev',
    QFS = require("q-io/fs"),
    ERROR_DEPENDENCY_MISSING = 1000,
    ERROR_VERSION_INVALID = 1001,
    ERROR_FILE_INVALID = 1002,
    ERROR_DEPENDENCY_EXTRANEOUS = 1003;

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
            var deferred = Q.defer();

            if (typeof dirPath === "string" && dirPath.length > 0) {
                this._app = {
                    name: '',
                    version: '',
                    file: null,
                    path: (dirPath.charAt(dirPath.length-1) === '/') ? dirPath : dirPath + '/'
                };

                this._runProcess(deferred, lite);
            } else {
                deferred.reject(new Error("Path is missing"));
            }
            return deferred.promise;
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
        value: function (deferred, lite) {
            var self = this;

            // Step 1: Get information.
            this._readJsonFile(this._app.path, this._app, true, function () {
                if (!self._app.jsonFileMissing && !self._app.jsonFileError) {
                    delete self._app.parent; // Cleaning up.

                    // Step 2: Find eventual errors.
                    self._findEventualErrors();
                    deferred.resolve((!!lite) ? self._lite() : self._complete());

                } else {
                    deferred.reject(new Error("Json file is missing or shows a few errors"));
                }
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
     * @param {Function} callBack, will used later in order to check the next dependency,
     * but once all information will have been gathered.
     * @private
     */
    _readJsonFile: {
        value: function (path, currentDependency, root, callBack) {
            var self = this,
                file = path + 'package.json';

            if (typeof root === 'function') {
                callBack = root;
                root = false;
            }

            QFS.exists(file).then(function (exists) {
                var moduleParsed = {};

                if (exists) {
                    QFS.read(file).then(function (data) {
                        try {
                            moduleParsed = JSON.parse(data);

                            if (typeof moduleParsed.name === 'undefined' || typeof moduleParsed.version === 'undefined' || (!root && moduleParsed.name !== currentDependency.name)) { // If the name or the version field are missing.
                                currentDependency.jsonFileError = true;
                            }

                            if (currentDependency.jsonFileError !== true && root === true) {
                                currentDependency.file = JSON.parse(data);
                                currentDependency.name = moduleParsed.name;
                                currentDependency.version = moduleParsed.version;
                            }

                        } catch (exception) {
                            currentDependency.jsonFileError = true;
                        }

                        moduleParsed.path = path;

                        if (currentDependency.jsonFileError) {
                            callBack(moduleParsed);
                        } else {
                            currentDependency.versionInstalled = moduleParsed.version;
                            self._handleJsonFile(moduleParsed, currentDependency, callBack); // If no errors, then format results.
                        }

                    }, function () {
                        currentDependency.jsonFileError = true;
                        callBack();
                    });
                } else { // The package.json file is missing.
                    currentDependency.jsonFileMissing = true;
                    callBack();
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
     * @param {Function} callBack, will used later in order to check the next dependency,
     * @private
     */
    _handleJsonFile: {
        value: function (moduleParsed, currentDependency, callBack) {

            if (moduleParsed.optionalDependencies) { // if optionalDependencies exists
                var temp = {dependencies: this._formatDependencies(moduleParsed.optionalDependencies, currentDependency, moduleParsed.path, DEPENDENCY_TYPE_OPTIONAL) };
                this._mergeDependencies(temp, (moduleParsed.dependencies) ? this._formatDependencies(moduleParsed.dependencies, currentDependency, moduleParsed.path, DEPENDENCY_TYPE_REGULAR) : []);
                moduleParsed.dependencies = temp.dependencies;
            } else {
                moduleParsed.dependencies = (moduleParsed.dependencies) ? this._formatDependencies(moduleParsed.dependencies, currentDependency, moduleParsed.path, DEPENDENCY_TYPE_REGULAR) : [];
            }

            if (moduleParsed.devDependencies) { // if devDependencies exists.
                this._mergeDependencies(moduleParsed, this._formatDependencies(moduleParsed.devDependencies, currentDependency, moduleParsed.path, DEPENDENCY_TYPE_DEV));
            }

            this._formatBundledDependencies(currentDependency, (moduleParsed.bundleDependencies || moduleParsed.bundledDependencies || null));
            this._readInstalled(moduleParsed, currentDependency, callBack);
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
                        missing: true, // By default all dependencies are missing, later they will be checked whether they are in the file system.
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

    _shouldKeepFile: {
        value: function (element, path) {
            var deferred = Q.defer();

            if (element.charAt(0) !== '.') {
                QFS.stat(path + element).then(function (stats) {
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
            var deferred = Q.defer(),
                container = [];

            if (Array.isArray(list) && list.length > 0) {
                var queue = this._keepDependenciesLength(list.length);

                for (var i = 0, length = list.length; i < length; i++) {
                    this._shouldKeepFile(list[i], path).then(function (data) {
                        if (data[0]) {
                            container.push(data[1]);
                        }

                        if (queue() < 1) {
                            deferred.resolve(container);
                        }
                    });
                }
            } else {
                deferred.resolve(container);
            }

            return deferred.promise;
        }
    },

    /**
     * Reads dependencies in the file system, in order to make sure the dependency are well installed,
     * Besides, sets as extraneous every dependency which are not within the package.json file.
     * @function
     * @param {Object} moduleParsed, represents the raw data from the package.json file.
     * @param {Object} currentDependency, represents the current dependency which is analyzing.
     * @param {Function} callBack, will used later in order to check the next dependency,
     * @private
     */
    _readInstalled: {
        value: function (moduleParsed, currentDependency, callBack) {
            var self = this,
                path = moduleParsed.path + "node_modules/";

            QFS.list(path).then(function (files) {
                self._filterListFiles(files, path).then(function (modulesInstalled) {

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
                                type: (currentDependency.bundledDependencies && currentDependency.bundledDependencies[moduleName]) ? DEPENDENCY_TYPE_BUNDLE : DEPENDENCY_TYPE_REGULAR,
                                extraneous: true
                            });
                        } else { // not missing
                            moduleParsed.dependencies[index].missing = false;
                        }
                    }

                    currentDependency.dependencies = moduleParsed.dependencies.sort(self._sortDependencies);

                    self._findChildren(currentDependency, function () { // Tries to find some children.
                        callBack();
                    });
                });
            }, function () {
                currentDependency.dependencies = moduleParsed.dependencies.sort(self._sortDependencies);
                self._findChildren(currentDependency, function () { // Tries to find some children.
                    callBack();
                });
            });
        }
    },

    /**
     * Tries to find some dependency children.
     * @function
     * @param {Object} parent, represents the current dependency which is analyzing.
     * @param {Function} callBack, will used later in order to check the next dependency,
     * @private
     */
    _findChildren: {
        value: function (parent, callBack) {
            var dependencies = parent.dependencies;

            if (Array.isArray(dependencies)) {
                var length = dependencies.length;

                if (length > 0) { // Has children.
                    var total = this._keepDependenciesLength(length); // keep the number of children.

                    for (var i = 0; i < length; i++) {
                        this._examineChild(dependencies[i], total, callBack);
                    }
                } else { // no children
                    callBack();
                }
            }
        }
    },

    /**
     * Keeps the length of dependencies to examine at a given level,
     * which is shared and decremented asynchronously.
     * @function
     * @param {Number} length, the length of dependencies to examine at a given level.
     * @return {Integer}
     * @private
     */
    _keepDependenciesLength: {
        value: function (length) {
            return function () {
                return --length;
            };
        }
    },

    /**
     * Examines a dependency child at a given level.
     * @function
     * @param {Object} child, the child to examine at a given level.
     * @param {Number} queue, the shared queue at a given level.
     * @param {Function} callBack, will used later in order to check the next dependency,
     * @private
     */
    _examineChild: {
        value: function (child, queue, callBack) {
            if (!child.missing) {
                var self = this;

                this._readJsonFile(child.path + 'node_modules/' + child.name + '/', child, function () { // Examines the package.json file of the current child
                    self._childHasBeenExamined(queue, callBack); // Notifies a child has been examined
                });
            } else {
                this._childHasBeenExamined(queue, callBack);
            }
        }
    },

    /**
     * Checks if there still are some children to examine.
     * @function
     * @param {Number} queue, the shared queue at a given level.
     * @param {Function} callBack, will used later in order to check the next dependency,
     * @private
     */
    _childHasBeenExamined: {
        value: function (queue, callBack) {
            if (queue() < 1) {
                callBack();
            }
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
            return (element.parent) ? this._findTopParent(element.parent, element) : (typeof previous === 'undefined') ? element : previous;
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
            return this._searchDependencyFromParent(dependency.parent, dependency.name); // At least one parent, The deepest "parent level" has already been checked by the readInstalled function.
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
                        this._reportTopLevel(dependency, ERROR_DEPENDENCY_MISSING, dependency.name + ' is missing' + ((parent.name && parent.name !== this._app.name) ? ', required by ' + parent.name : ''));
                    } else { // Parents have it.
                        dependency.versionInstalled = substituteDependency.versionInstalled;

                        if (semver.validRange(dependency.version) && !semver.satisfies(dependency.versionInstalled, dependency.version, true)) {
                            dependency.invalid = true;
                            this._reportTopLevel(dependency, ERROR_VERSION_INVALID, dependency.name + ' version is invalid.');
                        }
                    }
                } else if (dependency.extraneous && dependency.type !== DEPENDENCY_TYPE_BUNDLE) { // If not within the package.json file.
                    this._reportTopLevel(dependency, ERROR_DEPENDENCY_EXTRANEOUS, dependency.name + ' is extraneous.');
                } else if (!dependency.missing && dependency.type !== DEPENDENCY_TYPE_DEV && semver.validRange(dependency.version) && !semver.satisfies(dependency.versionInstalled, dependency.version, true)) { // Check the version requirement.
                    dependency.invalid = true;
                    this._reportTopLevel(dependency, ERROR_VERSION_INVALID, dependency.name + ' version is invalid');
                }
            } else {
                this._reportTopLevel(dependency, ERROR_FILE_INVALID,'the package.json file ' + ((!!dependency.jsonFileError) ? 'shows a few errors' : ' is missing.'));
            }
        }
    }

});
