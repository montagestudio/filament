/**
 @module "ui/main.reel"
 @requires montage
 @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,

    FLOW_TEMPLATE = require("ui/main.reel/flow-template.json");

/**
 Description TODO
 @class module:"ui/main.reel".Main
 @extends module:montage/ui/component.Component
 */
exports.Main = Montage.create(Component, /** @lends module:"ui/main.reel".Main# */ {

    _flow: {
        value: null
    },

    _loadEditor: {
        value: function (properties) {
            var self = this;

            this.editor.object = {
                _stageObject: this._flow,

                stageObject: this._flow,

                getObjectProperty: function (property) {
                    return self._flow[property];
                },

                setObjectProperties: function (values) {
                    for (var name in values) {
                        if (values.hasOwnProperty(name)) {
                            self._flow[name] = values[name];
                        }
                    }
                },

                getObjectProperties: function (values) {
                    var result = {};

                    for (var name in values) {
                        if (values.hasOwnProperty(name)) {
                            result[name] = self._flow[name];
                        }
                    }
                    return result;
                },

                editingDocument: {
                    undoManager: {
                        register: function () {}
                    },
                    getOwnedObjectProperties: function (proxy, values) {
                        return proxy.getObjectProperties(values);
                    },
                    setOwnedObjectProperties: function (proxy, values, previousValues) {
                        /*var undoManager = this.undoManager,
                         undoneValues = (previousValues ? previousValues : proxy.getObjectProperties(values));*/

                        proxy.setObjectProperties(values);

                        var previousValuesString = JSON.stringify(previousValues),
                            valuesString = JSON.stringify(proxy.getObjectProperties(values)),
                            i = 0, j = 0;

                        while (
                            (i < previousValuesString.length) &&
                                (i < valuesString.length) &&
                                (previousValuesString[i] === valuesString[i])) {
                            i++;
                        }
                        valuesString = valuesString.substr(i);
                        previousValuesString = previousValuesString.substr(i);

                        while (
                            (j < previousValuesString.length) &&
                                (j < valuesString.length) &&
                                (previousValuesString[previousValuesString.length - 1 - j] === valuesString[valuesString.length - 1 - j])) {
                            j++;
                        }
                        valuesString = valuesString.substr(0, valuesString.length - j);
                        previousValuesString = previousValuesString.substr(0, previousValuesString.length - j);

                        if (valuesString.length || previousValuesString.length) {
                            console.log(previousValuesString, "--------", valuesString);
                        } else {
                            console.log("no changes");
                        }
                        //undoManager.register("Set Properties", Promise.resolve([this.setOwnedObjectProperties, this, proxy, values, undoneValues]));
                    },

                    setOwnedObjectProperty: function (foo, property, value) {
                        self._flow[property] = value;
                    }
                },

                _dispatchDidSetOwnedObjectProperties: {
                    value: function () {

                    }
                }
            };

            this.editor.object.setObjectProperties(properties);
        }
    },

    enterDocument: {
        value: function (firstime) {
            if (firstime) {
                var properties = null;

                if (FLOW_TEMPLATE && typeof FLOW_TEMPLATE === "object") {
                    properties = FLOW_TEMPLATE.properties;
                }

                this._flow = this.editor.stage.templateObjects.flow;
                this._loadEditor(properties);
            }
        }
    }
});
