/*global require,exports,describe,it,expect,runs */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;
var Promise = require("montage/core/promise").Promise;

TestPageLoader.queueTest("edit-properties-test", function(testPage) {
    describe("ui/template-explorer/content/edit-properties", function() {

        var test, editor, blueprint, defaultGroup, editingDocument;
        beforeEach(function() {
            test = testPage.test;

            editor = test.editor;

            blueprint = new Blueprint();
            var a = new PropertyBlueprint().initWithNameBlueprintAndCardinality("a", blueprint, 1);
            var b = new PropertyBlueprint().initWithNameBlueprintAndCardinality("b", blueprint, 1);
            blueprint.addPropertyBlueprint(a);
            blueprint.addPropertyBlueprint(b);

            defaultGroup = blueprint.addPropertyBlueprintGroupNamed("Mock");
            defaultGroup.push(a, b);

            editingDocument = {
                addOwnerBlueprintProperty: function (name) { return Promise(); },
                modifyOwnerBlueprintProperty: function (name, property, value) { return Promise(); },
                removeOwnerBlueprintProperty: function (name) { return Promise(); }
            };

            editor._ownerObject = {
                editingDocument: editingDocument,
                exportName: "Mock"
            };

            editor.ownerBlueprint = blueprint;

            testPage.waitForDraw(1, true);
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
    });

});
