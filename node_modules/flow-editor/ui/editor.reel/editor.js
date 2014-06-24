var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Flow = require("montage/ui/flow.reel").Flow,
    FlowBezierSpline = require("montage/ui/flow.reel/flow-bezier-spline").FlowBezierSpline,
    PenToolMath = require("ui/pen-tool-math"),
    FlowKnot = require("ui/flow-spline-handlers").FlowKnot,
    Vector3 = PenToolMath.Vector3,
    BezierCurve = PenToolMath.CubicBezierCurve,
    Scene = PenToolMath.Scene,
    FlowSpline = require("ui/flow-spline").FlowSpline,
    CanvasFlowSpline = require("ui/flow-spline").CanvasFlowSpline,
    FlowHelix = require("ui/flow-helix").FlowHelix,
    CanvasFlowHelix = require("ui/flow-helix").CanvasFlowHelix,
    Grid = require("ui/grid").Grid,
    CanvasGrid = require("ui/grid").CanvasGrid,
    Camera = require("ui/camera").Camera,
    CanvasCamera = require("ui/camera").CanvasCamera,
    Cross = require("ui/cross").Cross,
    CanvasCross = require("ui/cross").CanvasCross,
    EventHandler = require("core/event-handler").EventHandler,
    Application = require("montage/core/application").application,
    CanvasSplineAppendMark = require("ui/canvas-spline-append-mark").CanvasSplineAppendMark,
    Promise = require("montage/core/promise").Promise;

exports.Editor = Montage.create(Component, {

    flowEditorVersion: {
        value: 0.1
    },

    object: {
        value: null
    },

    hasSplineUpdated: {
        value: true
    },

    spline: {
        value: null
    },

    stage: {
        value: null
    },

    editingDocument: {
        value: null
    },

    viewPortShared: {
        value: null
    },

    viewPorts: {
        value: null
    },

    _splineCounter: {
        value: 0
    },

    _helixCounter: {
        value: 0
    },

    _blockHandleDidSetOwnedObjectProperties: {
        value: null
    },

    _eventHandler: {
        value: null
    },

    _currentObjectPropertiesSnap: {
        value: null
    },

    _currentShapeSelected: {
        value: null
    },

    _isEditing: {
        value: null
    },

    convertFlowToShape: {
        value: function () {
            var shape, spline, i, k, j, n, knot,
                paths = this.object.getObjectProperty("paths"),
                metadata = this.object.getObjectProperty("flowEditorMetadata"),
                grid,
                canvasGrid,
                cross,
                camera,
                canvasSpline,
                iShape,
                names = {},
                specialPaths = {},
                canvasHelix,
                self = this,
                ids = {},
                idHash = {},
                splineExists,
                updated;

            if (metadata && metadata.flowEditorVersion <= this.flowEditorVersion && metadata.shapes) {
                for (i = 0; i < metadata.shapes.length; i++) {
                    iShape = metadata.shapes[i];

                    if (iShape.type === "FlowHelix" && typeof iShape.pathIndex !== "undefined") {
                        specialPaths[iShape.pathIndex] = metadata.shapes[i];
                    }

                    if (typeof iShape.name !== "undefined" && typeof iShape.pathIndex !== "undefined") {
                        names[iShape.pathIndex] = iShape.name;
                    }

                    if (typeof iShape.id !== "undefined" && typeof iShape.pathIndex !== "undefined") {
                        ids[iShape.pathIndex] = iShape.id;
                        idHash[iShape.id] = true;
                    }
                }
            } // else, Could not parse metadata from newer versions of Flow Editor

            if (this.viewPortShared.scene) {
                canvasGrid = this.viewPortShared.scene;
                grid = canvasGrid._data;
                camera = this.camera._data;

                for (i = 0; i < canvasGrid.children.length; i++) {
                    var child = canvasGrid.children[i];

                    if (!idHash[child.id]) {
                        if (child.data.type === "FlowSpline") {
                            canvasGrid.removeCanvasFlowSpline(child);
                            i--;
                        } else if (child.data.type === "FlowHelix") {
                            canvasGrid.removeCanvasFlowHelix(child);
                            i--;
                        }
                    }
                }
            } else {
                grid = Grid.create().init();
                grid.nextTarget = true;
                canvasGrid = CanvasGrid.create().initWithData(grid);
                cross = CanvasCross.create().initWithData(Cross.create());
                camera = Camera.create().init();
                canvasGrid.appendMark = CanvasSplineAppendMark.create().initWithData(Vector3.create().initWithCoordinates([0, 0, 0]));
                canvasGrid.appendMark.isHiddenInInspector = true;
                canvasGrid.isExpanded = true;
                cross.zIndex = 2;
                cross.isHiddenInInspector = true;
                this.camera = CanvasCamera.create().initWithData(camera);
                canvasGrid.appendChild(cross);
                canvasGrid._data.pushShape(cross._data);
                canvasGrid.appendCamera(this.camera);
                canvasGrid.appendChild(canvasGrid.appendMark);
                canvasGrid._data.pushShape(canvasGrid.appendMark._data);
            }

            if (typeof this.object.getObjectProperty("cameraPosition") !== "undefined") {
                this.camera.cameraPosition = this.object.getObjectProperty("cameraPosition").slice(0);
            } else {
                this.camera.cameraPosition = Object.clone(Flow._cameraPosition);
            }

            if (typeof this.object.getObjectProperty("cameraTargetPoint") !== "undefined") {
                this.camera.cameraTargetPoint = this.object.getObjectProperty("cameraTargetPoint").slice(0);
            } else {
                this.camera.cameraTargetPoint = Object.clone(Flow._cameraTargetPoint);
            }

            if (typeof this.object.getObjectProperty("cameraFov") !== "undefined") {
                this.camera.cameraFov = this.object.getObjectProperty("cameraFov");
            } else {
                this.camera.cameraFov = Object.clone(Flow._cameraFov);
            }

            grid.isSelectionEnabled =
                this.object.getObjectProperty("isSelectionEnabled") ? true : false;
            grid.hasSelectedIndexScrolling =
                this.object.getObjectProperty("hasSelectedIndexScrolling") ? true : false;
            grid.scrollingTransitionTimingFunction =
                this.object.getObjectProperty("scrollingTransitionTimingFunction") ?
                this.object.getObjectProperty("scrollingTransitionTimingFunction") : "ease";
            grid.scrollingTransitionDuration =
                this.object.getObjectProperty("scrollingTransitionDuration") ?
                this.object.getObjectProperty("scrollingTransitionDuration") : 500;
            grid.selectedIndexScrollingOffset =
                this.object.getObjectProperty("selectedIndexScrollingOffset") ?
                this.object.getObjectProperty("selectedIndexScrollingOffset") : 0;
            grid.scrollVectorX =
                this.object.getObjectProperty("linearScrollingVector") ?
                this.object.getObjectProperty("linearScrollingVector")[0] : -300;
            grid.scrollVectorY =
                this.object.getObjectProperty("linearScrollingVector") ?
                this.object.getObjectProperty("linearScrollingVector")[1] : 0;

            for (j = 0; j < paths.length; j++) {
                splineExists = false;

                if (!specialPaths[j]) {
                    spline = paths[j];

                    if (!(this.viewPortShared.scene && (canvasSpline = this.viewPortShared.scene.getShapeById(ids[j])))) {
                        shape = FlowSpline.create().init();
                        canvasSpline = canvasGrid.insertFlowSpline(shape, j + 3);
                        canvasSpline.id = ids[j];
                    } else {
                        shape = canvasSpline._data;
                        splineExists = true;
                    }

                    shape.headOffset = spline.headOffset;
                    shape.tailOffset = spline.tailOffset;

                    if (names[j]) {
                        canvasSpline.name = names[j];
                    } else {
                        this._splineCounter++;
                        canvasSpline.name = "Spline " + this._splineCounter;
                    }

                    if (spline.knots.length !== canvasSpline.children.length) {
                        while (canvasSpline.children.length) {
                            canvasSpline.children[0].delete();
                        }

                        canvasSpline.children = [];

                        while (canvasSpline._data._data.length) {
                            canvasSpline._data.popBezierCurve();
                        }

                        canvasSpline._data._data = [];
                    }

                    for (i = 0; i < spline.knots.length; i++) {
                        if (i >= canvasSpline.children.length) {
                            if (!i) {
                                if (spline.knots[i].knotPosition) {
                                    canvasSpline.appendControlPoint(knot = FlowKnot.create().initWithCoordinates([
                                        spline.knots[i].knotPosition[0],
                                        spline.knots[i].knotPosition[1],
                                        spline.knots[i].knotPosition[2]
                                    ]));

                                    canvasSpline.appendControlPoint(Vector3.create().initWithCoordinates([
                                        spline.knots[i].nextHandlerPosition[0],
                                        spline.knots[i].nextHandlerPosition[1],
                                        spline.knots[i].nextHandlerPosition[2]
                                    ]));

                                    for (k in spline.units) {
                                        if (typeof spline.knots[i][k] !== "undefined") {
                                            knot[k] = spline.knots[i][k];
                                        }
                                    }

                                    if (typeof spline.knots[i].previousDensity !== "undefined") {
                                        knot.density = spline.knots[i].previousDensity;
                                    }
                                }
                            } else {
                                canvasSpline.appendControlPoint(Vector3.create().initWithCoordinates([
                                    spline.knots[i].previousHandlerPosition[0],
                                    spline.knots[i].previousHandlerPosition[1],
                                    spline.knots[i].previousHandlerPosition[2]
                                ]));

                                canvasSpline.appendControlPoint(knot = FlowKnot.create().initWithCoordinates([
                                    spline.knots[i].knotPosition[0],
                                    spline.knots[i].knotPosition[1],
                                    spline.knots[i].knotPosition[2]
                                ]));

                                if (spline.knots[i].nextHandlerPosition) {
                                    canvasSpline.appendControlPoint(Vector3.create().initWithCoordinates([
                                        spline.knots[i].nextHandlerPosition[0],
                                        spline.knots[i].nextHandlerPosition[1],
                                        spline.knots[i].nextHandlerPosition[2]
                                    ]));
                                }

                                for (k in spline.units) {
                                    if (typeof spline.knots[i][k] !== "undefined") {
                                        knot[k] = spline.knots[i][k];
                                    }
                                }

                                if (typeof spline.knots[i].previousDensity !== "undefined") {
                                    knot.density = spline.knots[i].previousDensity;
                                }
                            }
                        } else {
                            for (n = i; n < i + 2; n++) {
                                if (canvasSpline.children[n]) {
                                    if (canvasSpline.children[n].knot && spline.knots[n].knotPosition) {
                                        canvasSpline.children[n].knot.x = spline.knots[n].knotPosition[0];
                                        canvasSpline.children[n].knot.y = spline.knots[n].knotPosition[1];
                                        canvasSpline.children[n].knot.z = spline.knots[n].knotPosition[2];
                                    }

                                    if (canvasSpline.children[n].nextHandler && spline.knots[n].nextHandlerPosition) {
                                        canvasSpline.children[n].nextHandler.x = spline.knots[n].nextHandlerPosition[0];
                                        canvasSpline.children[n].nextHandler.y = spline.knots[n].nextHandlerPosition[1];
                                        canvasSpline.children[n].nextHandler.z = spline.knots[n].nextHandlerPosition[2];
                                    }

                                    if (canvasSpline.children[n].previousHandler && spline.knots[n].previousHandlerPosition) {
                                        canvasSpline.children[n].previousHandler.x = spline.knots[n].previousHandlerPosition[0];
                                        canvasSpline.children[n].previousHandler.y = spline.knots[n].previousHandlerPosition[1];
                                        canvasSpline.children[n].previousHandler.z = spline.knots[n].previousHandlerPosition[2];
                                    }

                                    if (canvasSpline.children[n].knot) {
                                        for (k in spline.units) {
                                            if (typeof spline.knots[n][k] !== "undefined") {
                                                canvasSpline.children[n].knot[k] = spline.knots[n][k];
                                            }
                                        }

                                        if (typeof spline.knots[n].previousDensity !== "undefined") {
                                            canvasSpline.children[n].knot.density = spline.knots[n].previousDensity;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (this._currentShapeSelected === j) {
                        canvasSpline.isSelected = true;
                        this.camera.isSelected = false;
                    } else {
                        canvasSpline.isSelected = false;
                    }

                } else {
                    switch (specialPaths[j].type) {
                        case "FlowHelix":
                            if (!(this.viewPortShared.scene && (canvasHelix = this.viewPortShared.scene.getShapeById(ids[j])))) {
                                canvasHelix = CanvasFlowHelix.create();
                                canvasHelix.id = ids[j];
                            } else {
                                shape = canvasHelix._data;
                                splineExists = true;
                            }
                            if (names[j]) {
                                canvasHelix.name = names[j];
                            } else {
                                this._helixCounter++;
                                canvasHelix.name = "Helix " + this._helixCounter;
                            }
                            if (specialPaths[j].axisOriginPosition) {
                                canvasHelix._x = specialPaths[j].axisOriginPosition[0];
                                canvasHelix._y = specialPaths[j].axisOriginPosition[1];
                                canvasHelix._z = specialPaths[j].axisOriginPosition[2];
                            }
                            if (specialPaths[j].radius) {
                                canvasHelix.radius = specialPaths[j].radius;
                            }
                            if (specialPaths[j].density) {
                                canvasHelix.density = specialPaths[j].density;
                            }
                            if (specialPaths[j].pitch) {
                                canvasHelix.pitch = specialPaths[j].pitch;
                            }
                            if (specialPaths[j].segments) {
                                canvasHelix.segments = specialPaths[j].segments;
                            }
                            canvasHelix.update();
                            if (!splineExists) {
                                canvasGrid.insertCanvasFlowHelix(canvasHelix, j + 3);
                            }

                            if (this._currentShapeSelected === j) {
                                canvasHelix.isSelected = true;
                                this.camera.isSelected = false;
                            } else {
                                canvasHelix.isSelected = false;
                            }

                            break;
                    }
                }
            }

            if (!this.viewPortShared.scene) {
                this.viewPortShared.scene = canvasGrid;
                this.camera.translate([0, 0, 0]);
            }
        }
    },

    _objectProperties: {
        value: {
            flowEditorMetadata: true,
            isSelectionEnabled: true,
            hasSelectedIndexScrolling: true,
            scrollingTransitionDuration: true,
            scrollingTransitionTimingFunction: true,
            selectedIndexScrollingOffset: true,
            scrollVectorX: true,
            scrollVectorY: true,
            paths: true,
            cameraPosition: true,
            cameraTargetPoint: true,
            cameraFov: true,
            linearScrollingVector: true
        }
    },

    /*getTree: {
        value: function (node) {
            var n = node ? node : this.viewPortShared.scene,
                children = [],
                length = n.children ? n.children.length: 0, i;

            for (i = 0; i < length; i++) {
                children.push(this.getTree(n.children[i]));
            }
            if (children.length) {
                return [n.id, children];
            } else {
                return [n.id];
            }
        }
    },*/

    convertShapeToFlow: {
        value: function () {
            var shape, bezier, i, spline, j, k = 0,
                paths, n,
                pathIndex = 0,
                selected = null;

            this._objectProperties.flowEditorMetadata = {
                flowEditorVersion: this.flowEditorVersion,
                shapes: []
            };

            for (j = 0; j < this.viewPortShared.scene.children.length; j++) {
                shape = this.viewPortShared.scene.children[j];

                if (shape.type === "FlowHelix") {
                    this._objectProperties.flowEditorMetadata.shapes.push({
                        type: "FlowHelix",
                        name: shape.name,
                        pathIndex: pathIndex,
                        axisOriginPosition: [shape._x, shape._y, shape._z],
                        radius: shape.radius,
                        pitch: shape.pitch,
                        density: shape.density,
                        segments: shape.segments,
                        id: shape.id
                    });

                    if (shape.isSelected) {
                        selected = pathIndex;
                    }

                    pathIndex++;

                } else if (shape.type === "FlowSpline") {
                    this._objectProperties.flowEditorMetadata.shapes.push({
                        type: "FlowSpline",
                        name: shape.name,
                        pathIndex: pathIndex,
                        id: shape.id
                    });

                    if (shape.isSelected) {
                        selected = pathIndex;
                    }

                    pathIndex++;
                }
            }

            if (selected !== null) {
                this._currentShapeSelected = selected;
            }

            paths = [];
            this._objectProperties.isSelectionEnabled = this.viewPortShared.scene._data.isSelectionEnabled;
            this._objectProperties.hasSelectedIndexScrolling = this.viewPortShared.scene._data.hasSelectedIndexScrolling;
            this._objectProperties.scrollingTransitionDuration = this.viewPortShared.scene._data.scrollingTransitionDuration;
            this._objectProperties.selectedIndexScrollingOffset = this.viewPortShared.scene._data.selectedIndexScrollingOffset;
            this._objectProperties.scrollingTransitionTimingFunction = this.viewPortShared.scene._data.scrollingTransitionTimingFunction;
            this._objectProperties.linearScrollingVector = [
                this.viewPortShared.scene._data.scrollVectorX,
                this.viewPortShared.scene._data.scrollVectorY
            ];

            for (j = 0; j < this.viewPortShared.scene.children.length; j++) {
                shape = this.viewPortShared.scene.children[j].data;

                if (shape.type === "FlowSpline" || shape.type === "FlowHelix") {
                    paths.push({
                        knots: [],
                        units: {}
                    });

                    spline = paths[k];
                    spline.units.rotateX = "";
                    spline.units.rotateY = "";
                    spline.units.rotateZ = "";
                    spline.units.opacity = "";
                    spline.headOffset = shape.headOffset;
                    spline.tailOffset = shape.tailOffset;
                    n = 0;

                    for (i = 0; i < shape.length; i++) {
                        bezier = shape.getBezierCurve(i);

                        if (bezier.getControlPoint(0)) {
                            if (!spline.knots[n]) {
                                spline.knots[n] = {};
                            }

                            if (!spline.knots[n].previousHandlerPosition) {
                                spline.knots[n].previousHandlerPosition = [];
                            }

                            if (!spline.knots[n].nextDensity) {
                                spline.knots[n].nextDensity = 10;
                            }

                            if (!spline.knots[n].previousDensity) {
                                spline.knots[n].previousDensity = 10;
                            }

                            if (bezier.getControlPoint(0)) {
                                if (!spline.knots[n].knotPosition) {
                                    spline.knots[n].knotPosition = [];
                                }

                                spline.knots[n].knotPosition[0] = bezier.getControlPoint(0).x;
                                spline.knots[n].knotPosition[1] = bezier.getControlPoint(0).y;
                                spline.knots[n].knotPosition[2] = bezier.getControlPoint(0).z;
                                spline.knots[n].rotateX = bezier.getControlPoint(0).rotateX;
                                spline.knots[n].rotateY = bezier.getControlPoint(0).rotateY;
                                spline.knots[n].rotateZ = bezier.getControlPoint(0).rotateZ;
                                spline.knots[n].opacity = bezier.getControlPoint(0).opacity;
                                spline.knots[n].nextDensity = bezier.getControlPoint(0).density;
                                spline.knots[n].previousDensity = bezier.getControlPoint(0).density;
                            }

                            if (bezier.getControlPoint(1)) {
                                if (!spline.knots[n].nextHandlerPosition) {
                                    spline.knots[n].nextHandlerPosition = [];
                                }

                                spline.knots[n].nextHandlerPosition[0] = bezier.getControlPoint(1).x;
                                spline.knots[n].nextHandlerPosition[1] = bezier.getControlPoint(1).y;
                                spline.knots[n].nextHandlerPosition[2] = bezier.getControlPoint(1).z;
                            }

                            if (bezier.getControlPoint(2) || bezier.getControlPoint(3)) {
                                if (!spline.knots[n + 1]) {
                                    spline.knots[n + 1] = {
                                        knotPosition: [],
                                        nextHandlerPosition: [],
                                        previousHandlerPosition: [],
                                        nextDensity: 10,
                                        previousDensity: 10
                                    };
                                }
                            }

                            if (bezier.getControlPoint(2)) {
                                spline.knots[n + 1].previousHandlerPosition[0] = (bezier.getControlPoint(2).x);
                                spline.knots[n + 1].previousHandlerPosition[1] = (bezier.getControlPoint(2).y);
                                spline.knots[n + 1].previousHandlerPosition[2] = (bezier.getControlPoint(2).z);
                            }

                            if (bezier.getControlPoint(3)) {
                                spline.knots[n + 1].knotPosition[0] = (bezier.getControlPoint(3).x);
                                spline.knots[n + 1].knotPosition[1] = (bezier.getControlPoint(3).y);
                                spline.knots[n + 1].knotPosition[2] = (bezier.getControlPoint(3).z);
                                spline.knots[n + 1].rotateX = bezier.getControlPoint(3).rotateX;
                                spline.knots[n + 1].rotateY = bezier.getControlPoint(3).rotateY;
                                spline.knots[n + 1].rotateZ = bezier.getControlPoint(3).rotateZ;
                                spline.knots[n + 1].opacity = bezier.getControlPoint(3).opacity;
                                spline.knots[n + 1].nextDensity = bezier.getControlPoint(3).density;
                                spline.knots[n + 1].previousDensity = bezier.getControlPoint(3).density;
                            }

                            n++;
                        }
                    }

                    k++;
                }
            }

            this._objectProperties.paths = paths;
            this._objectProperties.cameraPosition = this.camera.cameraPosition.slice(0);
            this._objectProperties.cameraTargetPoint = this.camera.cameraTargetPoint.slice(0);
            this._objectProperties.cameraFov = this.camera.cameraFov;
        }
    },

    enterDocument: {
        enumerable: false,
        value: function (firstTime) {
            if (firstTime) {
                Application.addEventListener("didSetOwnedObjectProperties", this, false);
                Application.addEventListener("exitModalEditor", this, true);
                Application.addEventListener("closeDocument", this, true);

                this._refresh();
            }
        }
    },

    _refresh: {
        value: function () {
            this.convertFlowToShape();
            this.convertShapeToFlow();
            this._currentObjectPropertiesSnap = JSON.stringify(this._objectProperties);
            this.stage.refresh();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._eventHandler = EventHandler.create().initWithDelegateAndViewPorts(this, this.viewPorts);
        }
    },

    _removeListeners: {
        value: function () {
            Application.removeEventListener("didSetOwnedObjectProperties", this, false);
            Application.removeEventListener("closeDocument", this, true);
            Application.removeEventListener("exitModalEditor", this, true);
        }
    },

    captureCloseDocument: {
        value: function () {
            this._removeListeners();
        }
    },

    captureExitModalEditor: {
        value: function () {
            this._removeListeners();
        }
    },

    handleDidSetOwnedObjectProperties: {
        value: function (event) {
            var detail = event.detail;

            if (detail && !this._isEditing) {
                var proxy = detail.proxy;

                if (proxy && /montage\/ui\/flow.reel/.test(proxy.exportId) && proxy.uuid === this.object.uuid) {
                    if (!this._blockHandleDidSetOwnedObjectProperties) {
                        this._refresh();
                    } else {
                        this._blockHandleDidSetOwnedObjectProperties = false;
                    }
                }
            }
        }
    },

    handleFlowEditing: {
        value: function (event) {
            this.convertShapeToFlow();
            this.stage.refresh(this._objectProperties);
            this._isEditing = true;

            this.object.setObjectProperties(this._objectProperties);

            this.editingDocument.dispatchEventNamed("didSetOwnedObjectProperties", true, false, {
                proxy: this.object,
                values: this._objectProperties
            });
        }
    },

    handleFlowEditingEnd: {
        value: function (event) {
            this.convertShapeToFlow();
            this._isEditing = false;

            var newValuesSnap = JSON.stringify(this._objectProperties);

            // check if the new properties are different from the latest that has been "saved".
            if (newValuesSnap !== this._currentObjectPropertiesSnap) {

                // fixme: (temporary fix)
                // Find why the convertShapeToFlow function breaks the editing of the viewport, when the add tool is selected.
                // (Moreover, that should explain why it's impossible to re-use the add tool after undo operations)
                this._blockHandleDidSetOwnedObjectProperties = true;

                var editingDocument = this.editingDocument,
                    newValues = JSON.parse(newValuesSnap),
                    undoArgs = [editingDocument.setOwnedObjectProperties, editingDocument, this.object, JSON.parse(this._currentObjectPropertiesSnap)];

                editingDocument.undoManager.register("Set Properties", Promise.resolve(undoArgs));

                this._currentObjectPropertiesSnap = newValuesSnap;
                this.object.setObjectProperties(newValues);

                editingDocument.dispatchEventNamed("didSetOwnedObjectProperties", true, false, {
                    proxy: this.object,
                    values: newValues
                });
            }
        }
    },

    draw: {
        enumerable: false,
        value: function () {
            //this.frontView.element.style.top = (this.topView.height + 1) + "px";
            /*this.removeClass(this._addButton, "selected");
            this.removeClass(this._moveButton, "selected");
            this.removeClass(this._weightButton, "selected");
            this.removeClass(this._zoomExtentsButton, "selected");
            this.addClass(this._selectedTool, "selected");*/

            /*this._frontViewContext.clearRect(0, 0, this._frontViewWidth, this._frontViewHeight);
            this._topViewContext.clearRect(0, 0, this._topViewWidth, this._topViewHeight);

            this._drawGrid(this._topViewContext, this._topViewWidth, this._topViewHeight, this._centerX, this._centerZ, this._scale, true);
            this._drawGrid(this._frontViewContext, this._frontViewWidth, this._frontViewHeight, this._centerX, this._centerY, this._scale, true);
            this._spline.transformMatrix = [
                this._scale, 0, 0, 0,
                0, 0, this._scale, 0,
                0, this._scale, 0, 0,
                this._topViewWidth / 2 - this.centerX * this._scale, this._topViewHeight / 2 - this.centerZ * this._scale, 0, 1
            ];
            this._spline.drawSpline(this._topViewContext);
            this._spline.drawKnots(this._topViewContext);
            if (this._selectedTool === this._weightButton) {
                this._spline.drawDensities(this._topViewContext);
            }
            if (this._drawHandlers) {
                this._spline.drawHandlers(this._topViewContext, [this._selectedKnot - 1, this._selectedKnot]);
            }
            this._spline.transformMatrix = [
                this._scale, 0, 0, 0,
                0, this._scale, 0, 0,
                0, 0, this._scale, 0,
                this._topViewWidth / 2 - this.centerX * this._scale, this._topViewHeight / 2 - this.centerY * this._scale, 0, 1
            ];
            this._spline.drawSpline(this._frontViewContext);
            this._spline.drawKnots(this._frontViewContext);
            if (this._selectedTool === this._weightButton) {
                this._spline.drawDensities(this._frontViewContext);
            }
            if (this._drawHandlers) {
                this._spline.drawHandlers(this._frontViewContext, [this._selectedKnot - 1, this._selectedKnot]);
            }*/
        }
    }

});
