/* jshint camelcase: false */

var DEPENDENCIES_CACHE_NAMES = [
    'dependencies',
    'optionalDependencies',
    'devDependencies'
];

exports.ProjectFSMocksFactory = Object.create(Object.prototype, {

    build: {
        value: function (project) {
            this._browseTree(project);
            return this._fs;
        }
    },

    _fs: {
        value: null,
        writable: true
    },

    _browseTree: {
        value: function (project) {
            this._fs = {};
            this._fs[project.name] = this._getModule(project);
        }
    },

    _getBundledDependencies: {
        value: function (module, file) {
            var bundledDependencies = module.bundledDependencies;

            if (Array.isArray(bundledDependencies) && bundledDependencies.length > 0) {
                var bundle = file.bundledDependencies = [];

                for (var z = 0, l = bundledDependencies.length; z < l; z++) {
                    var dep = bundledDependencies[z];

                    if (typeof dep === "string" && dep.length > 0) {
                        bundle.push(dep);
                    }
                }
            }
        }
    },

    _getJsonFile: {
        value: function (module) {
            if (module && typeof module === 'object' && module.hasOwnProperty('name') && typeof module.name === 'string' &&
                module.hasOwnProperty('version') && typeof module.version === 'string' && (/^([0-9]+\.){2}[0-9]+$/).test(module.version)) {

                var file = {
                    name: module.name,
                    version: module.version
                };

                for (var j = 0, len = DEPENDENCIES_CACHE_NAMES.length; j < len; j++) {
                    var type = DEPENDENCIES_CACHE_NAMES[j],
                        dependencies = module[type];

                    if (Array.isArray(dependencies) && dependencies.length > 0) {
                        var container = file[type] = {};

                        for (var i = 0, length = dependencies.length; i < length; i++) {
                            var dependency = dependencies[i];

                            if (!dependency.extraneous) {
                                var isString = typeof dependency.version === 'string';
                                container[dependency.name] = (isString) ? dependency.version : '';

                                if (isString && dependency.invalid) {
                                    dependency.version = (parseInt(dependency.version[0], 10) + 1) + dependency.version.substr(1);
                                }
                            }
                        }
                    }
                }

                this._getBundledDependencies(module, file);
                return !module.jsonFileError ? JSON.stringify(file) : JSON.stringify(file) + "{";
            }
            return null;
        }
    },

    _getModule: {
        value: function (element) {
            var current = {},
                file = (!element.jsonFileMissing) ? this._getJsonFile(element) : null;

            if (file) {
                current['package.json'] = file;
                var nodeModules = current.node_modules = {};

                for (var j = 0, len = DEPENDENCIES_CACHE_NAMES.length; j < len; j++) {
                    var type = DEPENDENCIES_CACHE_NAMES[j],
                        dependencies = element[type];

                    if (Array.isArray(dependencies) && dependencies.length > 0) {
                        for (var i = 0, length = dependencies.length; i < length; i++) {
                            var dependency = dependencies[i];

                            if (!dependency.missing && typeof dependency.name === 'string'){
                                nodeModules[dependency.name] = this._getModule(dependency);
                            }
                        }
                    }
                }
            }
            return current;
        }
    }

});
