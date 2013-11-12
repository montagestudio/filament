var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.FlowTree = Montage.create(Component, {

    _scene: {
        value: null
    },

    scene: {
        get: function () {
            return this._scene;
        },
        set: function (value) {
            this._scene = value;
            if (value) {
                this._scene._data.addEventListener("selectionChange", this, false);
                this._scene._data.addEventListener("sceneChange", this, false);
            }
            this.needsDraw = true;
        }
    },

    handleCloseAction: {
        value: function () {
            this.isVisible = false;
        }
    },

    _isVisible: {
        value: true
    },

    isVisible: {
        get: function () {
            return this._isVisible;
        },
        set: function (value) {
            this._isVisible = value;
            this.needsDraw = true;
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    _windowPositionX: {
        value: 730
    },

    _windowPositionY: {
        value: 10
    },

    handleMousemove: {
        value: function (event) {
            this._windowPositionX = this._startX + event.pageX - this._pointerX;
            this._windowPositionY = this._startY + event.pageY - this._pointerY;
            this.needsDraw = true;
        }
    },

    handleMouseup: {
        value: function (event) {
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "auto";
        }
    },

    handleMousedown: {
        value: function (event) {
            this._startX = this._windowPositionX;
            this._startY = this._windowPositionY;
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
            document.addEventListener("mousemove", this, false);
            document.addEventListener("mouseup", this, false);
            document.body.style.pointerEvents = "none";
            event.preventDefault();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.label.addEventListener("mousedown", this, false);
                window.addEventListener("resize", this, false);
            }
        }
    },

    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleSelectionChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleSceneChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            this._width = this.element.offsetWidth;
            this._height = this.element.offsetHeight;
            this._bodyWidth = window.innerWidth;
            this._bodyHeight = window.innerHeight;
        }
    },

    _splineCounter: {
        value: 0
    },

    _helixCounter: {
        value: 0
    },

    addNode: {
        value: function (node, domNode) {
            var button,
                label,
                line,
                list,
                length = node.children.length,
                self = this,
                isSelected = true,
                knotCounter,
                i;

            button = document.createElement("span");
            button.className = "button";
            label = document.createElement("span");
            label.className = "text";
            if (node.isExpanded) {
                button.className = "button expanded";
            }
            if (node.name) {
                label.textContent = node.name;
            } else {
                switch (node._data.type) {
                    case "FlowSpline":
                        node.name = "Spline";
                        label.textContent = node.name;
                        break;
                    case "FlowHelix":
                        node.name = "Helix";
                        label.textContent = node.name;
                        break;
                    case "Vector3":
                        label.textContent = "Direction Point";
                        break;
                    default:
                        label.textContent = node._data.type;
                        break;
                }
            }
            domNode.appendChild(button);
            domNode.appendChild(label);
            for (i = 0; i < length; i++) {
                if (!node.children[i].isHiddenInInspector) {
                    if (node.type === "FlowSpline") {
                        node.children[i].name = "Control Point " + (i + 1);
                    }
                    if (!list) {
                        list = document.createElement("ul");
                        domNode.appendChild(list);
                    }
                    if (node.children[i].isSelected) {
                        isSelected = false;
                    }
                    line = document.createElement("li");
                    list.appendChild(line);
                    this.addNode(node.children[i], line);
                }
            }
            if (node.isSelected || (domNode === this.contentElement)) {
                if (!isSelected) {
                    label.classList.add("subselected");
                } else {
                    label.classList.add("selected");
                }
            }
            if (!list) {
                button.classList.add("leaf");
            } else {
                button.addEventListener("mousedown", function (event) {
                    node.isExpanded = node.isExpanded ? false : true;
                    self.needsDraw = true;
                }, false);
            }
            label.addEventListener("mousedown", function (event) {
                var path = node;

                self.viewport.unselect();
                do {
                    path.isSelected = true;
                } while (path = path.parent);
            }, false);
        }
    },

    draw: {
        value: function () {
            this.element.style.display = this._isVisible ? "block" : "none";
            if (this._windowPositionX > this._bodyWidth - this._width) {
                this._windowPositionX = this._bodyWidth - this._width;
            }
            if (this._windowPositionX < 0) {
                this._windowPositionX = 0;
            }
            if (this._windowPositionY > this._bodyHeight - this._height) {
                this._windowPositionY = this._bodyHeight - this._height;
            }
            if (this._windowPositionY < 0) {
                this._windowPositionY = 0;
            }
            this.element.style.left = this._windowPositionX + "px";
            this.element.style.top = this._windowPositionY + "px";
            if (this._isVisible && (this._width === 0)) {
                this.needsDraw = true;
            }
            if (this._scene) {
                while (child = this.contentElement.firstChild) {
                    this.contentElement.removeChild(child);
                }
                this.addNode(this._scene, this.contentElement);
            }
        }
    }

});
