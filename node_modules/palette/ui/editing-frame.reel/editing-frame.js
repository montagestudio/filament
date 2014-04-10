/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
    @module "montage/ui/editing-frame.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    Component = require("montage/ui/component").Component,
    getElementXPath = require("core/xpath").getElementXPath,
    Promise = require("montage/core/promise").Promise,
    sandboxMontageApp = require("core/sandbox-montage-app");

//TODO do we care about having various modes available?
var DESIGN_MODE = 0;
var RUN_MODE = 1;

// We maintain one window reference for each package that we see, and load all
// modules from that package in the window so all objects have the same
// window reference.
// TODO: Make a WeakMap?
var PACKAGE_WINDOWS = [];

var STAGE_CSS;
require.read(require.mappings.stage.location + "stage.css")
.then(function (contents) {
    STAGE_CSS = contents;
}).done();


/**
    @class module:"ui/editing-frame.reel".EditingFrame
    @extends module:ui/component.Component
*/
exports.EditingFrame = Montage.create(Component, /** @lends module:"montage/ui/editing-frame.reel".EditingFrame# */ {

    /**
     * @name update
     * @event
     * @description Fired whenever a draw cycle occurs in the root component
     * of the frame
     */

    _stageUrl: {
        value: null
    },

    reset: {
        value: function () {

            if (this._deferredEditingInformation) {
                this._deferredEditingInformation.reject(new Error("Editing frame reset"));
            }

            this._stageUrl = null;

            if (this._loadedTemplate) {
                var packageRequire = this._loadedTemplate._require;
                var packageMontageRequire = packageRequire.getPackage({name: "montage"});

                //jshint -W106
                var rootComponent = packageMontageRequire("ui/component").__root__;
                //jshint +W106

                // Really don't care about any errors that occur here as we're
                // blowing away the contents anyways
                try {
                    rootComponent.childComponents.forEach(function (child) {
                        rootComponent.removeChildComponent(child);
                    });
                } catch (e) {}

                var frameDocument = this.iframe.contentDocument;

                frameDocument.head.innerHTML = "";
                frameDocument.body.innerHTML = "";

                this._addStageStyle(frameDocument);

                // Clear any loaded resources in document resources
                packageMontageRequire("core/document-resources")
                .DocumentResources
                .getInstanceForDocument(frameDocument)
                .clear();

                this._loadedTemplate = null;
                this._ownerModule = null;
                this._ownerName = null;
            }

            this.needsDraw = true;
        }
    },

    _hookEventManager: {
        value: function (eventManager, document, location) {
            function hook(original) {
                return function (target, eventType, listener) {
                    if (target === document) {
                        // Oh goodness gracious this is quite the HACK
                        // Try and get the correct document from the
                        // listener...
                        if (
                            typeof listener === "object" &&
                            typeof listener.element === "object" &&
                            listener.element.ownerDocument
                        ) {
                            console.warn("Redirected " + original.name + " on package document for " + eventType + " in " + location + " package to ", listener.element.ownerDocument);
                            target = listener.element.ownerDocument;
                        } else {
                            console.warn("'Incorrect' " + original.name + " on package document for " + eventType + " in " + location + " package");
                        }
                    }

                    return original.apply(this, arguments);
                };
            }

            eventManager.registerEventListener = hook(eventManager.registerEventListener);
            eventManager.unregisterEventListener = hook(eventManager.unregisterEventListener);
        }
    },

    _getRequireForModuleLocation: {
        value: function (location, _require) {
            if (location.indexOf(_require.location) !== 0) {
                console.warn(location, "is not in package", _require.location, "Should be fine, but this function expects a URL");
            }
            var self = this;
            if (!(location in PACKAGE_WINDOWS)) {
                var iframe = document.createElement("iframe");
                // An iframe must be in a document for its `window` to be
                // created an valid, so insert it but hide it.
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                // Label for debugging
                iframe.dataset.packageFrame = _require.location;
                iframe.contentWindow.name = "packageFrame=" + _require.location;

                PACKAGE_WINDOWS[location] = sandboxMontageApp(_require.location, iframe.contentWindow)
                .spread(function (applicationRequire, montageRequire) {
                    var defaultEventManager = montageRequire("core/event/event-manager").defaultEventManager;
                    self._hookEventManager(defaultEventManager, iframe.contentDocument, _require.location);

                    return applicationRequire;
                });
            }

            return PACKAGE_WINDOWS[location];
        }
    },

    _isObjectFromPackageRequire: {
        value: function (object, packageRequire) {
            // Check that the require the object was loaded with is the our
            // require for the package. This ensures that they have the same
            // window reference.
            return Montage.getInfoForObject(object).require.config.mappings === packageRequire.config.mappings;
        }
    },

    _addStageStyle: {
        value: function (_document) {
            // Attach our stage styling
            var style = _document.createElement("style");
            style.textContent = STAGE_CSS;
            _document.head.appendChild(style);
        }
    },

    /**
     * Load the specified template and return enough information from the result to be able to
     * interact with the loaded template.
     *
     * @param {Template} template A template to load
     * @param {String} ownerModule The moduleId of the owner object
     * @param {String} ownerName The exportName of the owner object
     *
     * @return {Promise} A promise for the object containing the keys template, the template that was loaded;
     * documentPart, the document part from the template that was loaded;
     * and frame, a reference to this editingFrame
     */
    loadTemplate: {
        value: function (template, ownerModule, ownerName) {
            var self = this;

            // // If already loading finish off and then load again
            var deferredEditingInformation = this._deferredEditingInformation;
            if (deferredEditingInformation && deferredEditingInformation.promise.isPending()) {
                var newDeferredEditingInformation = this._deferredEditingInformation = Promise.defer();

                var next = function () {
                    // Clear out the defered editing info so that this
                    // loadTemplate call does not think there is a pending load
                    self._deferredEditingInformation = null;
                    return self.loadTemplate(template, ownerModule, ownerName);
                };

                deferredEditingInformation.promise
                // try and load the frame, regardless of whether the previous
                // load succeeded or failed
                .then(next, next)
                .then(newDeferredEditingInformation.resolve, newDeferredEditingInformation.reject);

                return newDeferredEditingInformation.promise;
            }

            this.reset();
            this._ownerModule = ownerModule;
            this._ownerName = ownerName;

            deferredEditingInformation = this._deferredEditingInformation = Promise.defer();

            var instances;

            var frameWindow = this.iframe.contentWindow;
            var frame = this.iframe;

            var packageRequire, packageMontageRequire;

            this._getRequireForModuleLocation(ownerModule, template._require)
            .then(function (_packageRequire) {
                packageRequire = _packageRequire;
                packageMontageRequire = packageRequire.getPackage({name: "montage"});

                template = packageMontageRequire("core/template").Template.clone.call(template);
                template._require = packageRequire;

                self._loadedTemplate = template;

                instances = template.getInstances();

                // check that all instances are from the packageRequire
                if (instances && Object.keys(instances).length) {
                    for (var label in instances) {
                        if (!self._isObjectFromPackageRequire(instances[label], packageRequire)) {
                            throw new Error("Template instance '" + label + "' was not loaded using the correct require");
                        }
                    }
                }

                frameWindow.name = "editingFrame=" + self._ownerModule + "[" + self.ownerName + "]";

                // We need to boot Montage in the frame so that all the shims
                // Montage needs get installed
                if (self.iframe.src !== "" || !frameWindow.montageRequire) {
                    // self.iframe.src = "";
                    return sandboxMontageApp(packageRequire.location, frameWindow)
                    .spread(function (_, frameMontageRequire) {
                        self._addStageStyle(frame.contentDocument);

                        frameMontageRequire("core/event/event-manager").defaultEventManager.unregisterWindow(frameWindow);

                        packageMontageRequire("core/event/event-manager").defaultEventManager.registerWindow(frameWindow);

                        //jshint -W106
                        var rootComponent = packageMontageRequire("ui/component").__root__;
                        //jshint +W106
                        rootComponent.element = frame.contentDocument;

                        // replace draw
                        var originalDrawIfNeeded = rootComponent.drawIfNeeded;
                        rootComponent.drawIfNeeded = function() {
                            originalDrawIfNeeded.call(rootComponent);
                            self.dispatchEventNamed("update", true, false);
                        };
                    });
                }
            })
            .then(function () {
                //jshint -W106
                var rootComponent = packageMontageRequire("ui/component").__root__;
                //jshint +W106
                return self._setupTemplate(template, packageRequire, rootComponent, ownerModule, ownerName);
            })
            .then(function (part) {
                deferredEditingInformation.resolve({
                    owner: part.objects.owner,
                    documentPart: part,
                    template: template,
                    frame: self
                });
            })
            .fail(deferredEditingInformation.reject);

            return deferredEditingInformation.promise;
        }
    },

    _setupTemplate: {
        value: function (template, packageRequire, rootComponent, ownerModule, ownerName) {
            if (!this.iframe.contentWindow.montageRequire) {
                throw new Error("Montage must have been initialized in the frame before setting up the template");
            }

            // set once the template has been initialized
            var documentPart;
            var drawn = Promise.defer();

            var frameDocument = this.iframe.contentDocument;
            var instances = template.getInstances();

            function firstDrawHandler() {
                // Strictly speaking this handler is only being called
                // because the event is bubbling up from its children and
                // so the stage may not be fully drawn. However the drawing
                // completes syncronously but the resolution of the
                // promise is async, so by the time the promise handler
                // is called, the drawing will be complete.
                rootComponent.removeEventListener("firstDraw", firstDrawHandler, false);
                drawn.resolve();
            }
            rootComponent.addEventListener("firstDraw", firstDrawHandler, false);

            var createOwner;
            if (!instances || !instances.owner) {
                // if the template has an owner then we need to
                // instantiate it
                createOwner = template.getObjectsString(template.document)
                .then(function (objectsString) {
                    var objects = JSON.parse(objectsString);
                    if (objects.owner) {
                        ownerName = ownerName || MontageReviver.parseObjectLocationId(ownerModule).objectName;

                        return packageRequire.async(ownerModule)
                        .get(ownerName)
                        .then(function (ownerPrototype) {
                            return ownerPrototype.create();
                        }).then(function (owner) {
                            // prevent owner from loading its own template
                            owner._isTemplateLoaded = true;
                            owner.hasTemplate = false;

                            instances = instances || {};
                            instances.owner = owner;
                            template.setInstances(instances);
                        });
                    }
                });
            } else {
                createOwner = Promise.resolve();
            }

            var documentPartPromise = createOwner.then(function () {
                return template.instantiate(frameDocument);
            })
            .then(function (part) {

                frameDocument.body.appendChild(part.fragment);

                // TODO does this exist when the template is an inner template?
                documentPart = part;

                return Promise.all(Object.keys(part.objects).map(function (label) {
                    var object = part.objects[label];
                    if (object.loadComponentTree) {
                        if (!object.parentComponent) {
                            object.attachToParentComponent();
                        }
                        return object.loadComponentTree();
                    }
                }));
            })
            .then(function () {
                return packageRequire.async("montage/core/document-resources");
            })
            .then(function (exports) {
                var documentResources = exports.DocumentResources.getInstanceForDocument(frameDocument);

                var resources = template.getResources(frameDocument);
                // Inserts scripts
                resources.loadScripts().done();
                // Inserts styles
                resources.createStylesForDocument(frameDocument).forEach(function (style) {
                    documentResources.addStyle(style);
                });

            });

            return Promise.all([documentPartPromise, drawn])
            .then(function () {
                return documentPart;
            })
            .timeout(10000, "Timeout waiting for template's first draw");
        }
    },

    // might not need this function, currently just used to clear the frame
    // but this should probably be part of loadTemplate
    _refresh: {
        value: function (template) {
            if (!this._loadedTemplate && !this._ownerModule) {
                throw new Error("Editing frame must have a loaded template before refreshing");
            }

            return this.loadTemplate(template, this._ownerModule, this._ownerName);
        }
    },

    // Delay the refresh method
    _refreshDefer: {
        value: null
    },
    refreshDelay: {
        value: 200
    },
    refresh: {
        value: function (template) {
            var self = this;

            if (this._refreshDefer) {
                return this._refreshDefer.promise;
            }
            else {
                this._refreshDefer = Promise.defer();
                setTimeout(function() {
                    self._refreshDefer.resolve(self._refresh(template));
                    self._refreshDefer = null;
                }, this.refreshDelay);
                return this._refreshDefer.promise;
            }
        }
    },

    // EditingFrame Methods

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {

                var iframe = this.iframe;

                if (null === this._height) {
                    this.height = iframe.offsetHeight;
                }

                if (null === this._width) {
                    this.width = iframe.offsetWidth;
                }

                // TODO this is a little dirty, we should accept whatever identifier we were given, not demand one
                // TODO why is this even necessary?
                iframe.identifier = "editingFrame";

                // At this point the editingFrame can now "load" a reel from a package
                this.dispatchEventNamed("canLoadReel", true, true);

                this.element.addEventListener("mousedown", this);
                this.element.addEventListener("mousemove", this);
            }
        }
    },

    draw: {
        value: function () {

            var iframe = this.iframe;

            if (this.currentMode === DESIGN_MODE) {
                this.element.classList.add("designMode");
            } else {
                this.element.classList.remove("designMode");
            }

            if (this._stageUrl && this._stageUrl !== iframe.src) {
                iframe.addEventListener("load", this, false);
                iframe.src = this._stageUrl;
            } else if (!this._stageUrl && iframe.src) {
                iframe.removeAttribute("src");
            }

            this.screen.width = iframe.width = this.width;
            this.screen.height = iframe.height = this.height;
        }
    },

    handleEditingFrameLoad: {
        value: function () {
            var iframe = this.iframe;
            iframe.removeEventListener("load", this, false);
            window.addEventListener("message", this);
        }
    },

    handleMessage: {
        value: function (evt) {

            var iframe = this.iframe,
                iFrameWindow = iframe.contentWindow,
                ownerComponent,
                self = this;

            if (evt._event.source === iFrameWindow && evt.data === "componentReady") {
                window.removeEventListener("message", this);
                iFrameWindow.defaultEventManager.delegate = this;

                this._replaceDraw(iFrameWindow);
                this._addDragAndDropEvents(iFrameWindow);

                ownerComponent = iFrameWindow.stageData.ownerComponent;

                // This is done to maintain compatibility with pre 0.13
                // versions of Montage where _loadTemplate did not return a
                // promise and used a callback instead.
                var deferredTemplate = Promise.defer();
                deferredTemplate = ownerComponent._loadTemplate(deferredTemplate.resolve) || deferredTemplate;

                deferredTemplate.then(function (template) {
                    self._deferredEditingInformation.resolve({owner:ownerComponent, template:template, frame:self});
                }).done();
            }

        }
    },

    _replaceDraw: {
        value: function(iFrameWindow) {
            var self = this;
            // inspired by frameLoad in Montage testpageloader
            iFrameWindow.montageRequire.async("ui/component")
            .get("__root__").then(function(root) {
                var originalDrawIfNeeded = root.drawIfNeeded;
                root.drawIfNeeded = function() {
                    originalDrawIfNeeded.call(root);
                    self.dispatchEventNamed("update", true, false);
                };
            }).done();
        }
    },

    _addDragAndDropEvents: {
        value: function(iFrameWindow) {
            var element = this.element;
            element.addEventListener("dragenter", this, false);
            element.addEventListener("dragleave", this, false);
            element.addEventListener("dragover", this, false);
            element.addEventListener("drop", this, false);
        }
    },

    // EditingFrame Delegate Methods

    handleMousedown: {
        value: function (evt) {

            if (RUN_MODE === this.currentMode || 0 !== evt.button) {
                return;
            }

            var x = evt.offsetX,
                y = evt.offsetY,
                frameDocument = this.iframe.contentDocument,
                selectionCandidate = frameDocument.elementFromPoint(x, y);

            this.dispatchEventNamed("select", true, true, {
                candidate: selectionCandidate,
                addToSelection: false,
                expandToSelection: false,
                removeFromSelection: false,
                retractFromSelection: false
            });
        }
    },

    _mousemoveLastThrottle: {
        value: 0
    },

    handleMousemove: {
        value: function (evt) {

            if (RUN_MODE === this.currentMode) {
                return;
            }

            var throttle = 100,
                now = (new Date()).getTime(),
                timeFrame = now - this._mousemoveLastThrottle;

            if (timeFrame < throttle) {
                return;
            }
            this._mousemoveLastThrottle = now;

            var x = evt.offsetX,
                y = evt.offsetY,
                frameDocument = this.iframe.contentDocument,
                element = frameDocument.elementFromPoint(x, y),
                nodeXPath = getElementXPath(element);

            // find the first parent component
            var node = element;
            var parentComponents = [];
            while (node.parentNode) {
                if (node.component) {
                    parentComponents.push(node.dataset.montageId);
                }
                node = node.parentNode;
            }

            this.dispatchEventNamed("elementHover", true, true, {
                xpath: nodeXPath,
                element: element,
                parentComponents: (parentComponents.length)? parentComponents : undefined,
                highlight: true
            });
        }
    },



    // EditingFrame Properties

    // The template we're in the process of loading
    _deferredEditingInformation: {
        value: null
    },

    _width: {
        value: null
    },

    width: {
        get: function () {
            return this._width;
        },
        set: function (value) {
            if (value === this._width) {
                return;
            }

            this._width = value;
            this.needsDraw = true;
        }
    },

    _height: {
        value: null
    },

    height: {
        get: function () {
            return this._height;
        },
        set: function (value) {
            if (value === this._height) {
                return;
            }

            this._height = value;
            this.needsDraw = true;
        }
    },

    _currentMode: {
        value: DESIGN_MODE
    },

    currentMode: {
        get: function () {
            return this._currentMode;
        },
        set: function (value) {
            if (value === this._currentMode) {
                return;
            }

            this._currentMode = value;
            this.needsDraw = true;
        }
    }
});
