/**
    @module "ui//inner-template-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Inspector = require("contextual-inspectors/base/ui/inspector.reel").Inspector;

var INSPECTOR_HEIGHT = 200;
var INSPECTOR_PADDING = 10;

/**
    Description TODO
    @class module:"ui//inner-template-inspector.reel".InnerTemplateInspector
    @extends module:montage/ui/component.Component
*/
exports.InnerTemplateInspector = Montage.create(Inspector, /** @lends module:"ui//inner-template-inspector.reel".InnerTemplateInspector# */ {

    _innerTemplateInstancePromise: {
        value: null
    },

    _object: {
        value: null
    },
    object: {
        get: function() {
            return this._object;
        },
        set: function(value) {
            if (this._object === value) {
                return;
            }

            this._object = value;
        }
    },

    templateDidLoad: {
        value: function () {
            var self = this;
            var value = this._object;
            var doc = value.stageObject.element.ownerDocument;
            value.stageObject.innerTemplate.instantiate(doc).then(function (part) {
                part.childComponents.forEach(function (component) {
                    self.templateObjects.innerTemplate.addChildComponent(component);
                    // component.attachToParentComponent();
                });
                return part.loadComponentTree().then(function() {
                    for (var i = 0, childComponent; (childComponent = part.childComponents[i]); i++) {
                        childComponent.needsDraw = true;
                    }
                    self.part = part;
                    self.needsDraw = true;
                });
            }).done();
        }
    },

    willDraw: {
        value: function() {
            if (!(this.object.stageObject && this.object.stageObject.element)) {
                this._top = this._left = this._height = this._width = 0;
                return;
            }

            var object = this.object.stageObject,
                el = "element" in object ? object.element : object;

            var rect = this._getBounds(el);

            this._top = rect.top - INSPECTOR_HEIGHT - INSPECTOR_PADDING;
            this._left = rect.left;
            this._height = INSPECTOR_HEIGHT;
            this._width = rect.right - rect.left;
        }
    },

    draw: {
        value: function() {
            this._element.style.position = "absolute";
            this._element.style.top = this._top + "px";
            this._element.style.left = this._left + "px";
            this._element.style.height = this._height + "px";
            this._element.style.width = this._width + "px";

            if (this.part) {
                var part = this.part;
                this.templateObjects.innerTemplate.element.appendChild(part.fragment);
            }
        }
    }

});
