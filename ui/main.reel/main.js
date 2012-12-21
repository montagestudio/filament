var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ComponentInfo = require("core/component-info.js").ComponentInfo,
    LibraryItem = require("core/library-item.js").LibraryItem,
    Promise = require("montage/core/promise").Promise,
    Deserializer = require("montage/core/deserializer").Deserializer;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    _environmentBridge: {
        value: null
    },

    environmentBridge: {
        get: function () {
            return this._environmentBridge;
        },
        set: function (value) {
            if (value === this._environmentBridge) {
                return;
            }

            if (this._environmentBridge) {
                this._environmentBridge.mainComponentDidExitEnvironment(this);
            }

            this._environmentBridge = value;

            if (this._environmentBridge) {
                this._environmentBridge.mainComponentDidEnterEnvironment(this);
            }
        }
    },

    didCreate: {
        value: function () {

            var self = this;
            if (IS_IN_LUMIERES) {
                require.async("core/lumieres-bridge").then(function (exported) {
                    self.environmentBridge = exported.LumiereBridge.create();
                    self.awaitEditor();
                });
            } else {
                require.async("core/browser-bridge").then(function (exported) {
                    self.environmentBridge = exported.BrowserBridge.create();
                    self.awaitEditor();
                });
            }
        }
    },

    awaitEditor: {
        value: function () {
            document.application.addEventListener("canLoadReel", this);
        }
    },

    handleCanLoadReel: {
        value: function () {
            var self = this;

            //TODO we may be able to find available plugins even earlier,
            //but we shouldn't be able to open a project without knowing
            Promise.all([this.environmentBridge.availablePlugins, this.environmentBridge.projectInfo])
                .spread(function (pluginUrls, projectInfo) {
                    self.pluginUrls = pluginUrls;
                    self.deferredPlugins = {};
                    self.openProject(projectInfo);
                });
        }
    },

    packageUrl: {
        value: null
    },

    libraryItems: {
        value: null
    },

    components: {
        value: null
    },

    // TODO define projectInfo contract
    openProject: {
        value: function (projectInfo) {
            var reelUrl = projectInfo.reelUrl,
                app = document.application,
                self = this;

            this.packageUrl = projectInfo.packageUrl;

            if (projectInfo.componentUrls) {
                this.components = projectInfo.componentUrls.map(function (url) {
                    return ComponentInfo.create().initWithUrl(url);
                });
            }

            // Now that we have a project we're opening we know plugins we should activate
            // for the project itself, we may have activated others for filament itself earlier
            // This is a bit of an optimization to do this as soon as possible,
            // Seeing as the plugins are exposed as promises within filament nobody
            // should be waiting for them to be resolved before continuing.
            // Simply using a plugin should force you to consider that it may not
            // have been loaded yet. This should help keep everybody honest as
            // we'll eventually be loading plugins dynamically and will need to be
            // very used to new things coming and going at runtime.
            projectInfo.dependencies.forEach(function (dependency) {
                //TODO also pass along version of the package
                self.pluginForPackage(dependency.dependency);
            });

            this._populateLibrary(projectInfo.dependencies);

            this.addPropertyChangeListener("windowTitle", this, false);
            app.addEventListener("openComponent", this);
            app.addEventListener("addFile", this);

            if (reelUrl) {
                this.openComponent(reelUrl);
            }

            // Update title
            // TODO this should be unnecessary as the packageUrl has been changed...
            this.needsDraw = true;
        }
    },

    _objectNameFromModuleId: {
        value: function (moduleId) {
            //TODO this utility should live somewhere else (/baz/foo-bar.reel to FooBar)
            Deserializer._findObjectNameRegExp.test(moduleId);
            return RegExp.$1.replace(Deserializer._toCamelCaseRegExp, Deserializer._replaceToCamelCase);
        }
    },

    _populateLibrary: {
        value: function (dependencies) {
            var self = this,
                moduleId,
                objectName,
                libraryItems;

            this.libraryItems = [];

            dependencies.forEach(function (dependency) {
                self.environmentBridge.componentsInPackage(dependency.url).then(function (componentUrls) {
                    return componentUrls.map(function (componentUrl) {
                        moduleId = componentUrl.replace(/\S+\/node_modules\//, "");
                        objectName = self._objectNameFromModuleId(moduleId);

                        return self.libraryItemForModule(moduleId, objectName);
                    });
                }).spread(function () {
                    //TODO group by dependency in some way
                    libraryItems = Array.prototype.slice.call(arguments, 0);
                    self.libraryItems.push.apply(self.libraryItems, libraryItems);
                }).done();
            });
        }
    },

    libraryItemForModule: {
        value: function (moduleId, objectName) {

            var packageName = moduleId.substring(0, moduleId.indexOf("/")),
                item;

            return this.pluginForPackage(packageName).then(function (plugin) {

                if (plugin && plugin.libraryItems && plugin.libraryItems[moduleId]) {
                    item = plugin.libraryItems[moduleId].create();
                } else {
                    item = LibraryItem.create();

                    item.moduleId = moduleId;
                    item.name = objectName;
                    item.html = '<div data-montage-id=""></div>';
                }

                return item;
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
                pluginModuleId;

            if (!deferredPlugin) {
                candidatePluginModuleIds = this.pluginUrls.filter(function (pluginUrl) {
                    return pluginUrl.match(packageName);
                }).map(function (pluginUrl) {
                    //TODO not hardcode this knowledge about plugin locations
                    return pluginUrl.replace(/\S+\/filament\//, "");
                });

                //TODO consider the version among the various available
                pluginModuleId = candidatePluginModuleIds[0];
                this.deferredPlugins[pluginDeferredId] = require.async(pluginModuleId);
            }

            return deferredPlugin;
        }
    },

    handleOpenComponent: {
        value: function (evt) {
            console.log("open component", evt.detail.componentUrl);
            this.openComponent("fs:/" + evt.detail.componentUrl);
        }
    },

    openComponent: {
        value: function (reelUrl) {
            var self = this;
            //TODO if no packageUrl...well we shouldn't open a reel
            //TODO if we already have this reelUrl open, switch to it
            this.componentEditor.load(reelUrl, this.packageUrl).then(function (editingDocument) {
                self.currentDocument = editingDocument;
            });

        }
    },

    currentDocument: {
        value: null
    },

    windowTitle: {
        dependencies: ["packageUrl", "currentDocument.title"],
        get: function () {

            var projectTitle;

            if (this.packageUrl) {
                projectTitle = this.packageUrl.substring(this.packageUrl.lastIndexOf("/") + 1);
            }

            if (this.currentDocument) {
                projectTitle = this.currentDocument.title + " — " + projectTitle;
            }

            return projectTitle;
        }
    },

    handleAddFile: {
        value: function (evt) {
            //TODO present new file dialog
            console.log("main: add new file");
        }
    },

    handleChange: {
        value: function (notification) {
            if ("windowTitle" === notification.currentPropertyPath) {
                this.needsDraw = true;
            }
        }
    },

    prepareForDraw: {
        value: function () {
            document.addEventListener("save", this, false);
        }
    },

    draw: {
        value: function () {
            if (this.windowTitle) {
                document.title = this.windowTitle;
            }
        }
    },

    handleSave: {
        value: function (evt) {
            this.save(evt.detail.url);
        }
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
    }

});
