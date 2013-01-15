var Montage = require("montage/core/core").Montage,
    ComponentInfo = require("core/component-info.js").ComponentInfo,
    Promise = require("montage/core/promise").Promise,
    LibraryItem = require("core/library-item.js").LibraryItem,
    Deserializer = require("montage/core/deserializer").Deserializer;

exports.ProjectController = Montage.create(Montage, {

    initWithEnvironmentBridgeAndComponentEditor: {
        value: function (bridge, editor) {
            this._environmentBridge = bridge;
            this._componentEditor = editor;

            this.setupMenuItems();

            var self = this,
                deferredEditor = Promise.defer();

            document.application.addEventListener("canLoadReel", function () {
                deferredEditor.resolve(true);
            });
            //TODO timeout the promise in some reasonable window

            // discover available plugins as soon as possible,
            // subsequent activity may rely on us knowing them
            this._pluginPromise = this.environmentBridge.availablePlugins
                .then(function (pluginUrls) {
                    self.pluginUrls = pluginUrls;
                    self.deferredPlugins = {}; //TODO why this is needed/setup here is not obvious
                });

            Promise.all([this._pluginPromise, deferredEditor]).then(function () {
                self.dispatchEventNamed("canLoadProject", true, true);
            }).done();

            return this;
        }
    },

    _environmentBridge: {
        value: null
    },

    environmentBridge: {
        get: function () {
            return this._environmentBridge;
        }
    },

    _componentEditor: {
        value: null
    },

    componentEditor: {
        get: function () {
            return this._componentEditor;
        }
    },

    _pluginPromise: {
        value: null
    },

    // The project url as provided by the environment
    // Typically, if a url is provided by the environment this would be the url
    // to try and load.
    projectUrl: {
        get: function () {
            return this.environmentBridge.projectUrl;
        }
    },

    // The url of the package of the open project
    packageUrl: {
        value: null
    },

    // The collection of components available within the open package
    // This is actually a collection of descriptive ComponentInfo objects
    components: {
        value: null
    },

    dependencies: {
        value: null
    },

    // The collection of all library items available to this package
    // TODO preserve the groups of the libraryItems somehow for nicer presentation
    libraryItems: {
        value: null
    },

    loadProject: {
        value: function (url) {
            var self = this;

            this._pluginPromise.then(function () {
                return self.environmentBridge.projectInfo(url);
            }).then(function (projectInfo) {
                self.openProject(projectInfo);
            }).done();
        }
    },

    // TODO define projectInfo contract
    openProject: {
        enumerable: false,
        value: function (projectInfo) {
            var reelUrl = projectInfo.reelUrl,
                self = this;

            this.dispatchEventNamed("willOpenPackage", true, true, {
                packageUrl: projectInfo.packageUrl,
                reelUrl: reelUrl
            });

            this.packageUrl = projectInfo.packageUrl;
            this.dependencies = projectInfo.dependencies;

            this.watchForFileChanges();

            Promise.all([this.populateComponents(), this.populateLibrary()])
                .then(function () {
                    self.dispatchEventNamed("didOpenPackage", true, true, {
                        packageUrl: self.packageUrl,
                        reelUrl: reelUrl
                    });
                }).done();
        }
    },

    openComponent: {
        value: function (reelUrl) {
            var self = this;
            // TODO if we already have this reelUrl open, switch to it,
            // preserving the selectedObjects
            this.componentEditor.workbench.selectedObjects = null;
            this.componentEditor.load(reelUrl, this.packageUrl).then(function (editingDocument) {
                self.currentDocument = editingDocument;
            });

        }
    },

    deferredPlugins: {
        enumerable: false,
        value: null
    },

    pluginForPackage: {
        value: function (packageName, packageVersion) {
            //TODO I want this API to be available to be able to answer what plugin would be used for this package at this version
            // That said, you shouldn't ever use plugins for multiple versions of the same package
            // So I'm not sure what to make of that all just yet; I probably want query and registry APIs
            // I could refuse to give a package for a version if I already have a plugin for another version, but
            // that would mean this wouldn't be queryable and would have that side-effect
            var pluginDeferredId = packageName + "-" + (packageVersion || "*"),
                deferredPlugin = this.deferredPlugins[pluginDeferredId],
                candidatePluginModuleIds,
                pluginPromise,
                pluginModuleId;

            if (!deferredPlugin) {
                candidatePluginModuleIds = this.pluginUrls.filter(function (pluginUrl) {
                    return pluginUrl.match(packageName);
                }).map(function (pluginUrl) {
                    //TODO not hardcode this knowledge about plugin locations
                    return pluginUrl.replace(/\S+\/filament\//, "");
                });

                if (candidatePluginModuleIds && candidatePluginModuleIds.length > 0) {
                    //TODO consider the version among the various available
                    pluginModuleId = candidatePluginModuleIds[0];
                    pluginPromise = require.async(pluginModuleId)
                        .fail(function () {
                            return null;
                        });
                } else {
                    //TODO should this be considered a rejection?
                    pluginPromise = Promise.resolve(null);
                }

                deferredPlugin = this.deferredPlugins[pluginDeferredId] = pluginPromise;
            }

            return deferredPlugin;
        }
    },

    _objectNameFromModuleId: {
        value: function (moduleId) {
            //TODO this utility should live somewhere else (/baz/foo-bar.reel to FooBar)
            Deserializer._findObjectNameRegExp.test(moduleId);
            return RegExp.$1.replace(Deserializer._toCamelCaseRegExp, Deserializer._replaceToCamelCase);
        }
    },

    //TODO cache this promise, clear cache when we detect a change?
    findLibraryItems: {
        value: function (dependencies) {
            var self = this,
                moduleId,
                objectName,
                dependencyLibraryPromises,
                dependencyLibraryEntry;

            dependencyLibraryPromises = dependencies.map(function (dependency) {

                return self.environmentBridge.componentsInPackage(dependency.url)
                    .then(function (componentUrls) {

                        dependencyLibraryEntry = {
                            dependency: dependency.dependency
                        };

                        if (componentUrls) {
                            dependencyLibraryEntry.libraryItems = componentUrls.map(function (componentUrl) {
                                moduleId = componentUrl.replace(/\S+\/node_modules\//, "");
                                objectName = self._objectNameFromModuleId(moduleId);
                                return self.libraryItemForModule(moduleId, objectName);
                            });
                        } else {
                            dependencyLibraryEntry.libraryItems = [];
                        }

                        return dependencyLibraryEntry;
                    });
            });

            return Promise.all(dependencyLibraryPromises);
        }
    },

    libraryItemForModule: {
        enumerable: false,
        value: function (moduleId, objectName) {

            var packageName = moduleId.substring(0, moduleId.indexOf("/")),
                item;

            return this.pluginForPackage(packageName).then(function (plugin) {

                if (plugin && plugin.libraryItems && plugin.libraryItems[moduleId]) {
                    item = plugin.libraryItems[moduleId].create();
                } else {
                    item = LibraryItem.create();

                    item.serialization = {prototype: moduleId};
                    item.name = objectName;
                    item.html = '<div></div>';
                }

                return item;
            });
        }
    },

    currentDocument: {
        value: null
    },

    documents: {
        value: null
    },

    save: {
        value: function (url) {

            if (!this.currentDocument) {
                return;
            }

            if (!this.environmentBridge) {
                throw new Error("Cannot save without an environment bridge");
            }

            //TODO use either the url specified (save as), or the currentDoc's reelUrl
            //TODO improve this, we're reaching deeper than I'd like to find the reelUrl
            this.environmentBridge.save(this.currentDocument, this.currentDocument.reelUrl).done();
        }
    },

    installDependencies: {
        value: function () {
            var self = this,
                config = {
                    prefix : this.environmentBridge.convertBackendUrlToPath(this.packageUrl)
                };

            this._isInstallingDependencies = true;
            this.environmentBridge.installDependencies(config).then(function () {
                //TODO update this.dependencies, they've possibly changed
                self._isInstallingDependencies = false;
                self.populateLibrary();
            }).done();
        }
    },

    createApplication: {
        value: function () {
            var options = {
                    displayAsSheet: true,
                    defaultName: "my-app", // TODO localize the default app-name
                    prompt: "Create" //TODO localize this
                },
                self = this;

            this.environmentBridge.promptForSave(options).then(function (destination) {
                var destinationDividerIndex = destination.lastIndexOf("/"),
                    appName = destination.substring(destinationDividerIndex + 1),
                    packageHome = destination.substring(0, destinationDividerIndex).replace("file://localhost", "");

                return self.environmentBridge.createApplication(appName, packageHome);
            }).then(function (applicationUrl) {
                self.loadProject(applicationUrl);
            }, function (fail) {
                window.close();
            }).done();
        }
    },

    createComponent: {
        value: function () {

            if (!this.canCreateComponents) {
                throw new Error("Cannot create components without an open project");
            }

            var packagePath = this.environmentBridge.convertBackendUrlToPath(this.packageUrl),
                options = {
                    defaultDirectory: "file://localhost" + packagePath,
                    defaultName: "my-component", // TODO localize this
                    prompt: "Create" //TODO localize this
                },
                self = this;

            this.environmentBridge.promptForSave(options)
                .then(function (destination) {
                    var destinationDividerIndex = destination.lastIndexOf("/"),
                        componentName = destination.substring(destinationDividerIndex + 1),
                        //TODO complain if packageHome does not match this.packageUrl?
                        packageHome = destination.substring(0, destinationDividerIndex).replace("file://localhost", ""),
                        relativeDestination = destination.substring(0, destinationDividerIndex).replace(packageHome, "").replace(/^\//, "");

                    return self.environmentBridge.createComponent(componentName, packageHome, relativeDestination);
                }).done();
            //TODO handle a cancelled creation vs some error
        }
    },

    _windowIsKey: {
        value: true //TODO not assume our window is key
    },

    didBecomeKey: {
        value: function (evt) {
            this._windowIsKey = true;
        }
    },

    didResignKey: {
        value: function (evt) {
            this._windowIsKey = false;
        }
    },

    canCreateComponents: {
        dependencies: ["_windowIsKey", "packageUrl"],
        get: function () {
            return !!(this._windowIsKey && this.packageUrl);
        }
    },

    setupMenuItems: {
        enumerable: false,
        value: function () {

            var newComponentMenuItem,
                self = this;

            this.environmentBridge.mainMenu.then(function (mainMenu) {
                newComponentMenuItem = mainMenu.menuItemForIdentifier("newComponent");

                Object.defineBinding(newComponentMenuItem, "enabled", {
                    boundObject: self,
                    boundObjectPropertyPath: "canCreateComponents",
                    oneway: true
                });
            }).done();
        }
    },

    watchForFileChanges: {
        enumerable: false,
        value: function () {
            var self = this,
                changeHandler = function (changeType, filePath) {
                    self.handleFileSystemChange(changeType, filePath);
                };

            this.environmentBridge.watch(this.packageUrl, changeHandler).done();
        }
    },

    handleFileSystemChange: {
        value: function (change, filePath) {
            //TODO do we only care about certain changes...what about files inside the reel?
            if (/\.reel$/.test(filePath)) {
                console.log("component changed on filesystem", change, filePath);
                //TODO this is heavy handed, but really more of a proof of concept than anything else
                if (!this._isInstallingDependencies) {
                    this.populateLibrary().done();
                }

                if (!/\/node_modules\//.test(filePath)) {
                    this.populateComponents().done();
                }
            }
        }
    },

    populateComponents: {
        value: function () {
            var self = this,
                packagePath = this.environmentBridge.convertBackendUrlToPath(this.packageUrl);

            return this.environmentBridge.componentsInPackage(packagePath).then(function (componentUrls) {
                self.components = componentUrls.map(function (url) {
                    return ComponentInfo.create().initWithUrl(url);
                });
            });
        }
    },

    populateLibrary: {
        value: function () {
            var self = this;
            return this.findLibraryItems(this.dependencies).then(function (dependencyLibraryEntries) {

                // TODO not flatten out the dependency-grouped libraryItems
                return Promise.all(dependencyLibraryEntries.map(function (entry) {
                    return entry.libraryItems;
                }).reduce(function (a, b) {
                    return a.concat(b);
                }));

            }).then(function (libraryItems) {
                self.libraryItems = libraryItems;
            });
        }
    }

});
