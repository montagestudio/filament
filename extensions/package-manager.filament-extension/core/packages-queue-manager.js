var PackageTools = require('./package-tools'),
    Promise = require("montage/core/promise").Promise,
    Tools = PackageTools.ToolsBox,
    DependencyNames = PackageTools.DependencyNames,
    ACTION_INSTALLING = 0,
    ACTION_REMOVING = 1,
    TIME_WAITING_BEFORE_NEXT = 75;

exports.PackageQueueManager = Object.create(Object.prototype, {

    /**
     * Loads the package queue manager.
     * @function
     * @param {Object} packageDocument, a reference to the packageDocument.
     * @param {String} whenDone, represents the function name of the packageDocument to call,
     * once the package queue manager has finished its work.
     */
    load: {
        value: function (packageDocument, whenDone) {
            if (typeof packageDocument === 'object') {
                this._packageDocument = packageDocument;
                this._whenDone = (typeof whenDone === 'string' && whenDone.length > 0) ? whenDone : null;
                this._queueManagerLoaded = true;
            }
            return this._queueManagerLoaded;
        }
    },

    /**
     * Reference to the packageDocument.
     * @type {Object}
     * @default null
     * @private
     */
    _packageDocument: {
        value: null,
        writable: true
    },

    /**
     * Represents the function name to call once the package queue manager has finished its work.
     * @type {String}
     * @default null
     * @private
     */
    _whenDone: {
        value: null,
        writable: true
    },

    /**
     * Indicates if the package queue manager has been "loaded".
     * @type {Boolean}
     * @default false
     * @private
     */
    _queueManagerLoaded: {
        value: false,
        writable: true
    },

    _packageManagerPlugin: {
        value: null,
        writable: true
    },

    /**
     * Reference to the packageManagerPlugin propriety within the packageDocument.
     * @type {Object}
     * @default null
     */
    packageManagerPlugin: {
        get: function () {
            if (!this._packageManagerPlugin) {
                this._packageManagerPlugin = (this._packageDocument) ? this._packageDocument.packageManagerPlugin : null;
            }
            return this._packageManagerPlugin;
        }
    },

    _projectUrl: {
        value: null,
        writable: true
    },

    /**
     * Reference to the projectUrl propriety within the packageDocument.
     * @type {Object}
     * @default null
     */
    projectUrl: {
        get: function () {
            if (!this._projectUrl) {
                this._projectUrl = (this._packageDocument) ? this._packageDocument.projectUrl : null;
            }
            return this._projectUrl;
        }
    },

    /**
     * Run the main process,
     * will examine the queue and performed the related action to every element within the queue.
     * @function
     * @private
     */
    _run: {
        value: function () {
            if (!this._isRunning && !this.isQueueEmpty() && this.packageManagerPlugin && this.projectUrl) {
                this._modulesModified = [];
                this._isRunning = true;
                this._next();
            }
            return this._isRunning;
        }
    },

    /**
     * Decides either to perform an eventual action within the queue or to stop the main process.
     * @function
     * @private
     */
    _next: {
        value: function () {
            if (!this.isQueueEmpty()) {
                if (this._queue[0].action === ACTION_INSTALLING) {
                    this._install(this._queue[0]);
                } else {
                    this._remove(this._queue[0]);
                }
            } else {
                this._done();
            }
        }
    },

    /**
     * Decides either to perform an eventual action within the queue or to stop the main process.
     * @function
     * @private
     */
    _prepareForNext: {
        value: function (module, action, error) {
            this._modulesModified.push({
                name: module.name,
                version: module.version || module.versionInstalled || '',
                type: module.type,
                action: action,
                error: !!error
            });

            this._queue.shift();
            var self = this;

            setTimeout(function () {
                self._next();
            }, TIME_WAITING_BEFORE_NEXT);
        }
    },

    /**
     * Notify to the package queue manager, we would like to install a package
     * @function
     * @param {object|String} module, format accepted: "name" | "name[@version]" | { name:value }
     * @return {Promise.<Object>} Promise for the package to install.
     */
    installModule: {
        value: function (module, strict) {
            return this._prepareAddingModuleToQueue(module, ACTION_INSTALLING, strict);
        }
    },

    /**
     * Tries to install a given package.
     * @function
     * @param {object} module, format accepted: { name:value }
     * @private
     */
    _install: {
        value: function (module) {
            if (module) {
                var self = this;

                if (module.strict) {
                    this._packageManagerPlugin.invoke("installDependency", module.request).then(function (installed) {
                        if (installed && typeof installed === 'object' && installed.hasOwnProperty('name')) { // If the package has been installed.
                            installed = {
                                name: installed.name,
                                versionInstalled: installed.version,
                                type: module.type,
                                missing: false,
                                installed: true
                            };

                            module.deferred.resolve(installed);

                        } else {
                            module.deferred.reject(installed);
                        }

                        self._prepareForNext(installed, module.action); // Indicates to the package queue manager, it can perform the next action.
                    }, function (error) {
                        module.deferred.reject(error);
                        self._prepareForNext(module, module.action, true);
                    });
                } else {
                    module.deferred.resolve(true);
                    self._prepareForNext(module, module.action);
                }
            } else {
                this._done(new Error('An error has occurred'));
            }
        }
    },

    /**
     * Notify to the package queue manager, we would like to uninstall a package.
     * The strict mode can be used to simulate an uninstalling action.
     * @function
     * @param {object|String} module, format accepted: "name" | "name[@version]" | { name:value }
     * @param {Boolean} strict, if false => simulate an uninstalling action.
     * @return {Promise.<Object>} Promise for the package to remove.
     */
    uninstallModule: {
        value: function (module, strict) {
            return this._prepareAddingModuleToQueue(module, ACTION_REMOVING, strict);
        }
    },

    /**
     * Tries to remove a given package.
     * @function
     * @param {object} module, format accepted: { name:value }
     * @private
     */
    _remove: {
        value: function (module) {
            if (module) {
                var self = this;

                if (module.strict) {
                    this._packageManagerPlugin.invoke("removeDependency", module.name, this._projectUrl).then(function (removed) {
                        if (removed) { // If the package has been removed.
                            module.deferred.resolve(removed);

                        } else {
                            module.deferred.reject(new Error('An error has occurred while removing the dependency ' + module.name));
                        }

                        self._prepareForNext(module, module.action);
                    }, function (error) {
                        module.deferred.reject(error);
                        self._prepareForNext(module, module.action, true);
                    });
                } else {
                    module.deferred.resolve(true);
                    self._prepareForNext(module, module.action);
                }
            } else {
                this._done(new Error('An error has occurred'));
            }
        }
    },

    _addModuleToQueue: {
        value: function (module, action, strict, deferred) {
            var version = Tools.isVersionValid(module.version) ? module.version : null,
                request = Tools.isGitUrl(module.version) ? module.version :
                    version ? module.name + '@' + version : module.name;

            this._queue.push({
                name: module.name,
                type: (typeof module.type === 'string' && module.type.length > 0) ? module.type : DependencyNames.dependencies,
                version: version,
                deferred: deferred,
                request: request,
                strict: (typeof strict === 'boolean') ? strict : true,
                action: action
            });
        }
    },

    /**
     * Adds an action within the queue.
     * @function
     * @param {object|String} module, format accepted: "name" | "name[@version]" | { name:value }
     * @param {String} action, action accepted: ACTION_INSTALLING | ACTION_REMOVING
     * @param {Boolean} strict, if false => simulate an uninstalling action.
     * @private
     */
    _prepareAddingModuleToQueue: {
        value: function (module, action, strict) {
            var deferred = Promise.defer();

            if (this._queueManagerLoaded) {
                if (typeof module === 'string' && module.length > 0) { // GitUrl or name[@version].
                    var moduleNameFromGitUrl = Tools.findModuleNameFormGitUrl(module);

                    if (!moduleNameFromGitUrl) {
                        module = Tools.getModuleFromString(module);

                        // Keeps the invalid name in case of a removal, but in case of an installation
                        // an error will be raised by the install command.
                        if (module.name === '') {
                            module.name = module.dataParsed[0];
                        }
                    } else {
                        module = {
                            name: moduleNameFromGitUrl,
                            version: module
                        };
                    }
                }

                if (module && typeof module === 'object') { // module
                    this._addModuleToQueue(module, action, strict, deferred);

                    if (!this._isRunning) {
                        this._run();
                    }
                }
            } else {
                deferred.reject(new Error("PackageManager needs to be loaded first"));
            }

            return deferred.promise;
        }
    },

    /**
     * Contains all actions which will be performed once that the package queue manager will be running.
     * @type {Array}
     * @default empty array
     * @private
     */
    _queue: {
        value: [],
        writable: true
    },

    /**
     * Indicates if the queue is empty or not.
     * @function
     * @return {Boolean}
     */
    isQueueEmpty: {
        value: function () {
            return (this._queue.length === 0);
        }
    },

    /**
     * Contains all actions which has been executed.
     * @type {Array}
     * @default empty array
     * @private
     */
    _modulesModified: {
        value: [],
        writable: true
    },

    _isRunning: {
        value: false,
        writable: true
    },

    /**
     * Indicates if the package queue manager is running.
     * @type {Boolean}
     * @default false
     */
    isRunning: {
        get: function () {
            return this._isRunning;
        }
    },

    /**
     * Calls the specified function of the packageDocument when the package queue manager's job is done.
     * @function
     * @param {Error} error, if an error has been raised while the package queue manager is running.
     * @private
     */
    _done: {
        value: function (error) {
            if (this._isRunning && this.isQueueEmpty()) {
                this._isRunning = false;
                this._queue = [];

                if (this._whenDone) {
                    var callBack = this._packageDocument[this._whenDone];

                    if (typeof callBack === 'function') {
                        callBack.call(this._packageDocument, this._modulesModified, error);
                    }
                }
            }
        }
    }

});
