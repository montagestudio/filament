var Montage = require("montage").Montage;
var Promise = require("montage/core/promise").Promise;
var Binder = require("montage/core/meta/binder").Binder;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var EditingDocument = require("palette/core/editing-document").EditingDocument;
var BlueprintObjectProxy = require("./blueprint-object-proxy").BlueprintObjectProxy;
var BlueprintEditor = require("ui/blueprint-editor.reel").BlueprintEditor;
var SORTERS = require("palette/core/sorters");
var Serializer = require("montage/core/serialization").Serializer;
var BlueprintSerializer = require("core/serialization/blueprint-serializer").BlueprintSerializer;
var BlueprintReviver = require("core/serialization/blueprint-reviver").BlueprintReviver;
var BlueprintContext = require("core/serialization/blueprint-context").BlueprintContext;

var BlueprintDocument = exports.BlueprintDocument = EditingDocument.specialize({

    constructor: {
        value: function BlueprintDocument() {
            this.super();
        }
    },

    __existOnDisk: {
        value: true
    },

    init: {
        value: function (fileUrl, packageRequire, currentObject, isBlueprint, needsSave) {
            var self = EditingDocument.init.call(this, fileUrl, packageRequire);

            //            var proxy = BlueprintObjectProxy.create().init("blueprint", currentObject, "root", self);
            //            self.dispatchBeforeOwnPropertyChange("currentProxyObject", self._currentProxyObject);
            //            self._currentProxyObject = proxy;
            //            self.dispatchOwnPropertyChange("currentProxyObject", proxy);

            self.dispatchBeforeOwnPropertyChange("isBlueprint", self._isBlueprint);
            self._isBlueprint = isBlueprint;
            self.dispatchOwnPropertyChange("isBlueprint", isBlueprint);

            self._packageRequire = packageRequire;
            self.__existOnDisk = (needsSave ? false : true);

            try {
                var serialization = Serializer.create().initWithRequire(this.packageRequire).serializeObject(currentObject);
                var serializationObjects = JSON.parse(serialization);
                var context = this.deserializationContext(serializationObjects);
                self._addProxies(context.getObjects());
            } catch (e) {

                var error = {
                    file: self.fileUrl,
                    error: {
                        id: "serializationError",
                        reason: e.message
                    }
                };

                self.errors.push(error);
            }

            return self;
        }
    },

    reviverConstructor: {
        value: BlueprintReviver
    },

    contextConstructor: {
        value: BlueprintContext
    },

    serializerConstructor: {
        value: BlueprintSerializer
    },

    _buildSerializationObjects: {
        value: function () {
            var serializationObjects = {};

            Object.keys(this._editingProxyMap).sort(SORTERS.labelComparator).forEach(function (label) {
                serializationObjects[label] = this.serializationForProxy(this._editingProxyMap[label]);
            }, this);

            return serializationObjects;
        }
    },


    save: {
        value: function (location, dataWriter) {
            // we need to be sur to use the right require.
            var serializer = Serializer.create().initWithRequire(this.packageRequire);
            var serializedDescription = serializer.serializeObject(this.currentProxyObject.proxiedObject);
            this.__existOnDisk = true;
            return dataWriter(serializedDescription, location);
        }
    },

    canClose: {
        value: function (location) {
            // TODO PJYF This message needs to be localized
            if (!this.__existOnDisk) {
                return "This document was never saved.";
            }
            return EditingDocument.canClose.call(this, location);
        }
    },

    _isBlueprint: {
        value: false
    },

    isBlueprint: {
        get: function () {
            return this._isBlueprint;
        }
    },

    _currentProxyObject: {
        value: null
    },

    currentProxyObject: {
        get: function () {
            return this._currentProxyObject;
        }
    },

    _packageRequire: {
        value: null
    },

    packageRequire: {
        get: function () {
            return this._packageRequire;
        }
    },

    title: {
        dependencies: ["url"],
        get: function () {
            return this.url.substring(this.url.lastIndexOf("/") + 1, this.url.lastIndexOf("."));
        }
    }

}, {

    load: {
        value: function (fileUrl, packageUrl) {
            var deferredDoc = Promise.defer();
            var blueprintModuleId = fileUrl;
            if (fileUrl.indexOf(packageUrl) > -1) {
                blueprintModuleId = fileUrl.substring(packageUrl.length + 1);
            }

            require.loadPackage(packageUrl).then(function (packageRequire) {
                packageRequire.async(blueprintModuleId).then(function (serializationObjects) {
                    if (serializationObjects.root && serializationObjects.root.prototype) {
                        if (serializationObjects.root.prototype.indexOf("blueprint") > -1) {
                            Blueprint.getBlueprintWithModuleId(blueprintModuleId, packageRequire).then(function (blueprint) {
                                deferredDoc.resolve(BlueprintDocument.create().init(fileUrl, packageRequire, blueprint, true));
                            }, function () {
                                deferredDoc.reject(new Error("Could not open file at " + fileUrl));
                            });
                        } else {
                            Binder.getBinderWithModuleId(blueprintModuleId, packageRequire).then(function (binder) {
                                deferredDoc.resolve(BlueprintDocument.create().init(fileUrl, packageRequire, binder, false));
                            }, function () {
                                deferredDoc.reject(new Error("Could not open file at " + fileUrl));
                            });
                        }
                    } else {
                        // The blueprint file is invalid lets use the default blueprint.
                        var desc = BlueprintReviver.parseObjectLocationId(blueprintModuleId.substring(0, blueprintModuleId.lastIndexOf("/")));
                        packageRequire.async(desc.moduleId).get(desc.objectName).get("blueprint").then(function (blueprint) {
                            deferredDoc.resolve(BlueprintDocument.create().init(fileUrl, packageRequire, blueprint, true, true));
                        }, function () {
                            deferredDoc.reject(new Error("Could not open file at " + fileUrl));
                        });
                    }
                }, function (error) {
                    // The blueprint file does not exist yet lets use the default blueprint.
                    var desc = BlueprintReviver.parseObjectLocationId(blueprintModuleId.substring(0, blueprintModuleId.lastIndexOf("/")));
                    packageRequire.async(desc.moduleId).get(desc.objectName).get("blueprint").then(function (blueprint) {
                        deferredDoc.resolve(BlueprintDocument.create().init(fileUrl, packageRequire, blueprint, true, true));
                    }, function () {
                        deferredDoc.reject(new Error("Could not open file at " + fileUrl));
                    });
                });
            });
            return deferredDoc.promise;
        }
    },

    editorType: {
        get: function () {
            return BlueprintEditor;
        }
    }

});
