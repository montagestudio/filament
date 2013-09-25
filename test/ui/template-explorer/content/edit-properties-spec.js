/*global require,exports,describe,it,expect,runs,waits */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;
var EventBlueprint = require("montage/core/meta/event-blueprint").EventBlueprint;
var Promise = require("montage/core/promise").Promise;

TestPageLoader.queueTest("edit-properties-test", function(testPage) {
    describe("ui/template-explorer/content/edit-properties", function() {

        var test, editor, blueprint, editingDocument;
        beforeEach(function() {
            test = testPage.test;

            editor = test.editor;

            blueprint = new Blueprint();

            editingDocument = {
                addOwnerBlueprintProperty: function (name) { return Promise(); },
                modifyOwnerBlueprintProperty: function (name, property, value) { return Promise(); },
                removeOwnerBlueprintProperty: function (name) { return Promise(); },
                addOwnerBlueprintEvent: function (name) { return Promise(); },
                // modifyOwnerBlueprintEvent: function (name) { return Promise(); },
                removeOwnerBlueprintEvent: function (name) { return Promise(); }
            };

            editor._ownerObject = {
                editingDocument: editingDocument,
                exportName: "Mock"
            };

            editor.ownerBlueprint = blueprint;
        });

        describe("properties", function () {

            var a, b, defaultGroup;
            beforeEach(function () {
                a = new PropertyBlueprint().initWithNameBlueprintAndCardinality("a", blueprint, 1);
                b = new PropertyBlueprint().initWithNameBlueprintAndCardinality("b", blueprint, 1);
                blueprint.addPropertyBlueprint(a);
                blueprint.addPropertyBlueprint(b);

                defaultGroup = blueprint.addPropertyBlueprintGroupNamed("Mock");
                defaultGroup.push(a, b);

                waits(50); // wait for a draw that may or may not happen
            });

            describe("add property button", function () {
                it("does nothing if no name given", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").andCallThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: ""});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintProperty).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });

                it("calls addOwnerBlueprintProperty to add the property", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").andCallThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "pass"});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintProperty).toHaveBeenCalled();
                    var args = editingDocument.addOwnerBlueprintProperty.mostRecentCall.args;
                    expect(args[0]).toBe("pass");
                    expect(event.defaultPrevented).toBe(false);
                });

                // it("clears the name after adding", function () {
                //     editor.templateObjects.addName.value = "fail";
                //     testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                //         expect(editor.templateObjects.addName.value).toBe("");
                //     });
                // });

                it("cannot be named the same as an existing blueprint", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").andCallThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "a"});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintProperty).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });
            });

            describe("remove button", function () {
                it("removes the property", function () {
                    spyOn(editingDocument, "removeOwnerBlueprintProperty").andCallThrough();

                    var event = new CustomEvent("remove", {bubbles: true, cancelable: true, detail: a});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.removeOwnerBlueprintProperty).toHaveBeenCalled();
                    var args = editingDocument.removeOwnerBlueprintProperty.mostRecentCall.args;
                    expect(args[0]).toBe("a");
                });
            });

            describe("valueType select", function () {
                it("changes to valueType of the property", function () {
                    spyOn(editingDocument, "modifyOwnerBlueprintProperty").andCallThrough();

                    runs(function () {
                        expect(defaultGroup[0].valueType).toBe("string");

                        // simulate select
                        editor.templateObjects.valueType[1].element.value = "number";
                        editor.templateObjects.valueType[1].handleChange();

                        expect(editingDocument.modifyOwnerBlueprintProperty).toHaveBeenCalled();
                        var args = editingDocument.modifyOwnerBlueprintProperty.mostRecentCall.args;
                        expect(args[0]).toBe("a");
                        expect(args[1]).toBe("valueType");
                        expect(args[2]).toBe("number");
                    });
                });

                it("calls modifyOwnerBlueprintProperty before the change is made", function () {
                    spyOn(editingDocument, "modifyOwnerBlueprintProperty")
                    .andCallFake(function (name, property, value) {
                        var propertyBlueprint = blueprint.propertyBlueprintForName(name);
                        expect(propertyBlueprint[property]).toBe("string");
                        expect(value).toBe("number");
                        return Promise();
                    });

                    runs(function () {
                        expect(defaultGroup[0].valueType).toBe("string");

                        // simulate select
                        editor.templateObjects.valueType[1].element.value = "number";
                        editor.templateObjects.valueType[1].handleChange();

                        expect(editingDocument.modifyOwnerBlueprintProperty).toHaveBeenCalled();
                    });
                });
            });

            describe("multi checkbox", function () {
                it("changes cardinality of the property", function () {
                    spyOn(editingDocument, "modifyOwnerBlueprintProperty").andCallThrough();

                    runs(function () {
                        expect(defaultGroup[0].cardinality).toBe(1);

                        // simulate select
                        editor.templateObjects.multiple[1].element.checked = true;
                        editor.templateObjects.multiple[1].handleChange();

                        expect(editingDocument.modifyOwnerBlueprintProperty).toHaveBeenCalled();
                        var args = editingDocument.modifyOwnerBlueprintProperty.mostRecentCall.args;
                        expect(args[0]).toBe("a");
                        expect(args[1]).toBe("cardinality");
                        expect(args[2]).toBe(Infinity);
                    });
                });
            });

        });

        describe("events", function () {
            var a, b;
            beforeEach(function () {
                a = new EventBlueprint().initWithNameAndBlueprint("a", blueprint);
                b = new EventBlueprint().initWithNameAndBlueprint("b", blueprint);
                blueprint.addEventBlueprint(a);
                blueprint.addEventBlueprint(b);

                waits(50); // wait for a draw that may or may not happen
            });

            describe("add event button", function () {
                it("does nothing if no name given", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").andCallThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: ""});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintEvent).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });

                it("calls addOwnerBlueprintEvent to add the event", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").andCallThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "pass"});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintEvent).toHaveBeenCalled();
                    var args = editingDocument.addOwnerBlueprintEvent.mostRecentCall.args;
                    expect(args[0]).toBe("pass");
                    expect(event.defaultPrevented).toBe(false);
                });

                // it("clears the name after adding", function () {
                //     var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "fail"});
                //     editor.templateObjects.events.dispatchEvent(event);

                //     expect(editor.templateObjects.addEventName.value).toBe("");
                // });

                it("cannot be named the same as an existing blueprint", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").andCallThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "a"});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintEvent).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });
            });

            describe("remove button", function () {
                it("removes the event", function () {
                    spyOn(editingDocument, "removeOwnerBlueprintEvent").andCallThrough();

                    var event = new CustomEvent("remove", {bubbles: true, cancelable: true, detail: a});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.removeOwnerBlueprintEvent).toHaveBeenCalled();
                    var args = editingDocument.removeOwnerBlueprintEvent.mostRecentCall.args;
                    expect(args[0]).toBe("a");
                });
            });

        });

    });

});
