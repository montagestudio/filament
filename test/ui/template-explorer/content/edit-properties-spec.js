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

            var defaultGroup;
            beforeEach(function () {
                var a = new PropertyBlueprint().initWithNameBlueprintAndCardinality("a", blueprint, 1);
                var b = new PropertyBlueprint().initWithNameBlueprintAndCardinality("b", blueprint, 1);
                blueprint.addPropertyBlueprint(a);
                blueprint.addPropertyBlueprint(b);

                defaultGroup = blueprint.addPropertyBlueprintGroupNamed("Mock");
                defaultGroup.push(a, b);

                waits(100); // wait for a draw that may or may not happen
            });

            describe("add property button", function () {
                it("does nothing if no name given", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").andCallThrough();

                    editor.templateObjects.addName.value = "";
                    testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                        expect(editingDocument.addOwnerBlueprintProperty).not.toHaveBeenCalled();
                    });
                });

                it("calls addOwnerBlueprintProperty to add the property", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").andCallThrough();

                    editor.templateObjects.addName.value = "pass";
                    testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                        expect(editingDocument.addOwnerBlueprintProperty).toHaveBeenCalled();
                        var args = editingDocument.addOwnerBlueprintProperty.mostRecentCall.args;
                        expect(args[0]).toBe("pass");
                    });
                });

                it("clears the name after adding", function () {
                    editor.templateObjects.addName.value = "fail";
                    testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                        expect(editor.templateObjects.addName.value).toBe("");
                    });
                });

                it("cannot be named the same as an existing blueprint", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").andCallThrough();

                    editor.templateObjects.addName.value = "a";
                    testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                        expect(editingDocument.addOwnerBlueprintProperty).not.toHaveBeenCalled();
                        expect(editor.templateObjects.addName.value).toBe("a");
                    });
                });
            });

            describe("remove button", function () {
                it("removes the property", function () {
                    spyOn(editingDocument, "removeOwnerBlueprintProperty").andCallThrough();

                    runs(function () {
                        testPage.clickOrTouch({target: editor.templateObjects.removeProperty[0].element}, function () {
                            expect(editingDocument.removeOwnerBlueprintProperty).toHaveBeenCalled();
                            var args = editingDocument.removeOwnerBlueprintProperty.mostRecentCall.args;
                            expect(args[0]).toBe("a");
                        });
                    });
                });
            });

            describe("valueType select", function () {
                it("changes to valueType of the property", function () {
                    spyOn(editingDocument, "modifyOwnerBlueprintProperty").andCallThrough();

                    runs(function () {
                        expect(defaultGroup[0].valueType).toBe("string");

                        // simulate select
                        editor.templateObjects.valueType[0].element.value = "number";
                        editor.templateObjects.valueType[0].handleChange();

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
                        editor.templateObjects.valueType[0].element.value = "number";
                        editor.templateObjects.valueType[0].handleChange();

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
                        editor.templateObjects.multiple[0].element.checked = true;
                        editor.templateObjects.multiple[0].handleChange();

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
            beforeEach(function () {
                var a = new EventBlueprint().initWithNameAndBlueprint("a", blueprint);
                var b = new EventBlueprint().initWithNameAndBlueprint("b", blueprint);
                blueprint.addEventBlueprint(a);
                blueprint.addEventBlueprint(b);

                waits(100); // wait for a draw that may or may not happen
            });

            describe("add event button", function () {
                it("does nothing if no name given", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").andCallThrough();

                    editor.templateObjects.addEventName.value = "";
                    testPage.clickOrTouch({target: editor.templateObjects.addEvent.element}, function () {
                        expect(editingDocument.addOwnerBlueprintEvent).not.toHaveBeenCalled();
                    });
                });

                it("calls addOwnerBlueprintEvent to add the event", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").andCallThrough();

                    editor.templateObjects.addEventName.value = "pass";
                    testPage.clickOrTouch({target: editor.templateObjects.addEvent.element}, function () {
                        expect(editingDocument.addOwnerBlueprintEvent).toHaveBeenCalled();
                        var args = editingDocument.addOwnerBlueprintEvent.mostRecentCall.args;
                        expect(args[0]).toBe("pass");
                    });
                });

                it("clears the name after adding", function () {
                    editor.templateObjects.addEventName.value = "fail";
                    testPage.clickOrTouch({target: editor.templateObjects.addEvent.element}, function () {
                        expect(editor.templateObjects.addEventName.value).toBe("");
                    });
                });

                it("cannot be named the same as an existing blueprint", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").andCallThrough();

                    editor.templateObjects.addEventName.value = "a";
                    testPage.clickOrTouch({target: editor.templateObjects.addEvent.element}, function () {
                        expect(editingDocument.addOwnerBlueprintEvent).not.toHaveBeenCalled();
                        expect(editor.templateObjects.addEventName.value).toBe("a");
                    });
                });
            });

            describe("remove button", function () {
                it("removes the event", function () {
                    spyOn(editingDocument, "removeOwnerBlueprintEvent").andCallThrough();

                    runs(function () {
                        testPage.clickOrTouch({target: editor.templateObjects.removeEvent[0].element}, function () {
                            expect(editingDocument.removeOwnerBlueprintEvent).toHaveBeenCalled();
                            var args = editingDocument.removeOwnerBlueprintEvent.mostRecentCall.args;
                            expect(args[0]).toBe("a");
                        });
                    });
                });
            });

        });

    });

});
