var fs = require('fs'),
    semver = require("semver"),
    Q = require("q"),
    DEPENDENCY_TYPE_REGULAR = 'regular',
    DEPENDENCY_TYPE_OPTIONAL = 'optional',
    DEPENDENCY_TYPE_BUNDLE = 'bundle',
    DEPENDENCY_TYPE_DEV = 'dev',
    ERROR_DEPENDENCY_MISSING = 1000,
    ERROR_VERSION_INVALID = 1001,
    ERROR_FILE_INVALID = 1002,
    ERROR_DEPENDENCY_EXTRANEOUS = 1003;

exports.listCommand = Object.create(Object.prototype, {

    read: {
        value: function (dirPath, lite) {
            var deferred = Q.defer();

            if (typeof dirPath === 'string' && dirPath.length > 0) {
                this._app = {
                    name: '',
                    version: '',
                    problems: [],
                    path: (dirPath.charAt(dirPath.length-1) === '/') ? dirPath : dirPath + '/'
                };

                this._runProcess(deferred, lite);
            } else {
                deferred.reject(new Error("Path is missing"));
            }
            return deferred.promise;
        }
    },

    _app: {
        value: null,
        writable: true
    },

    _lite: {
        value: function () {
            var dependencies = Array.isArray(this._app.dependencies) ? this._app.dependencies : [];

            for (var i = 0; i < dependencies.length; i++) {
                dependencies[i].parent = dependencies[i].parent.name;
                delete dependencies[i].dependencies;
            }
            return dependencies;
        }
    },

    _complete: {
        value: function () {
            var dependencies = Array.isArray(this._app.dependencies) ? this._app.dependencies : [];
            return this._getComplete(dependencies);
        }
    },

    _getComplete: {
        value: function (dependencies) {

            for (var i = 0; i < dependencies.length; i++) {
                dependencies[i].parent = dependencies[i].parent.name;

                if (dependencies[i].dependencies.length > 0) {
                    this._getComplete(dependencies[i].dependencies);
                }
            }
            return dependencies;
        }
    },

    _runProcess: {
        value: function (deferred, lite) {
            var self = this;

            // Step 1: get all information
            this._readJsonFile(this._app.path, this._app, function (module) {
                if ((!self._app.jsonFileMissing && !self._app.jsonFileError)) { // if the App package.json file has no errors
                    self._app.name = module.name;
                    self._app.version = module.version;
                    delete self._app.parent; // Cleaning up

                    // Step 2: report eventual errors ... coming

                    if (!!lite) {
                        deferred.resolve(self._lite());
                    } else {
                        deferred.resolve(self._complete());
                    }
                } else {
                    deferred.reject(new Error("Json file is missing or shows a few errors"));
                }
            });
        }
    },

    // Step 1:

    _readJsonFile: {
        value: function (path, parent, callBack) {
            var self = this,
                file = path + 'package.json';

            fs.exists (file, function (exists) {
                var module = {};

                if (exists) {
                    fs.readFile(file, function (error, data) {
                        if (!error) { // If no errors while reading the file.
                            try {
                                module = JSON.parse(data);

                                if (typeof module.name === 'undefined' || typeof module.version === 'undefined') { // if the name or the version field are missing.
                                    parent.jsonFileError = true;
                                }
                            } catch (exception) {
                                parent.jsonFileError = true;
                            }

                        } else { // the file presents some errors.
                            parent.jsonFileError = true;
                        }

                        module.path = path;
                        (!!parent.jsonFileError) ? callBack(module) : self._handleJsonFile(module, parent, callBack); // if no errors, then format results.
                    });
                } else { // package.json file is missing.
                    parent.jsonFileMissing = true;
                    module.path = path;
                    callBack(module);
                }
            });
        }
    },

    _formatDependencies: {
        value: function  (dependencies, parent, path, type) {
            var container = [];

            if (dependencies && typeof dependencies === 'object') {
                var keys = Object.keys(dependencies);

                for (var i = 0, length = keys.length; i < length; i++) {
                    container.push({
                        name: keys[i],
                        version: dependencies[keys[i]],
                        missing: true, // by default all dependencies are missing, later they will be checked if they are in the file system.
                        dependencies: [],
                        parent: parent,
                        path: path,
                        type: type
                    });
                }
            }
            return container;
        }
    },

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

    _handleJsonFile: {
        value: function (module, parent, callBack) {
            module.dependencies = (module.dependencies) ? this._formatDependencies(module.dependencies, parent, module.path, DEPENDENCY_TYPE_REGULAR) : [];

            if (module.optionalDependencies) { // if optionalDependencies exists.
                this._mergeDependencies(module, this._formatDependencies(module.optionalDependencies, parent, module.path, DEPENDENCY_TYPE_OPTIONAL));
            }

            if (module.devDependencies) { // if devDependencies exists.
                this._mergeDependencies(module, this._formatDependencies(module.devDependencies, parent, module.path, DEPENDENCY_TYPE_DEV));
            }

            this._readInstalled(module, parent, callBack);
        }
    },

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

    _sortDependencies: {
        value: function (a, b) {
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            return 0; // a and b are equal
        }
    },

    _readInstalled: {
        value: function (module, parent, callBack) {
            var self = this,
                path = module.path + 'node_modules/';

            fs.readdir(path, function (error, files) {
                if (files) { // if no errors or a few files.
                    var modulesInstalled = files.filter(function (element) { // remove invisible folders or any kind of files.
                        return (element.charAt(0) !== '.' && fs.lstatSync(path + element).isDirectory());
                    });

                    for (var i = 0, length = modulesInstalled.length; i < length; i++) {
                        var index = self._getDependencyIndex(modulesInstalled[i], module.dependencies);

                        if (index < 0) { // if index < 0, then the dependency is missing within the package.json file.
                            module.dependencies.push({
                                name: modulesInstalled[i],
                                version: '',
                                missing: false,
                                dependencies: [],
                                parent: parent,
                                path: module.path,
                                type: DEPENDENCY_TYPE_REGULAR,
                                extraneous: true
                            });
                        } else { // not missing
                            module.dependencies[index].missing = false;
                        }
                    }
                }

                parent.dependencies = module.dependencies.sort(self._sortDependencies); // Sort dependencies by name.

                self._findChildren(module, function(children){ // try to find some children
                    callBack(children);
                });
            });
        }
    },

    _keepDependenciesLength: {
        value: function (length) {
            return function () {
                return --length;
            };
        }
    },

    _childHasBeenExamined: {
        value: function (parent, queue, callBack) {
            if (queue() < 1) { // check if there still are some children to examine.
                callBack(parent);
            }
        }
    },

    _examineChild: {
        value: function (parent, child, queue, callBack) {
            if (!child.missing) {
                var self = this;

                this._readJsonFile(child.path + 'node_modules/' + child.name + '/', child, function (childExamined) { // examine the package.json file of the current child
                    child.versionInstalled = childExamined.version;
                    self._childHasBeenExamined(parent, queue, callBack); // notify a child has been examined
                });
            } else {
                this._childHasBeenExamined(parent, queue, callBack);
            }
        }
    },

    _findChildren: {
        value: function (module, callBack) {
            var dependencies = module.dependencies;

            if (Array.isArray(dependencies)) {
                var length = dependencies.length;

                if (length > 0) { // children
                    var total = this._keepDependenciesLength(length); // keep the number of child.

                    for (var i = 0, len = length; i < len; i++) {
                        this._examineChild(module, dependencies[i], total, callBack);
                    }
                } else { // no children
                    callBack(module);
                }
            }
        }
    }

});
