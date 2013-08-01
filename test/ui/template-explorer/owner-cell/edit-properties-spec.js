/*global require,exports,describe,it,expect,runs */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;

TestPageLoader.queueTest("edit-properties-test", function(testPage) {
    describe("ui/template-explorer/owner-cell/edit-properties", function() {

        var test, editor, blueprint, defaultGroup, editingDocument;
        beforeEach(function() {
            test = testPage.test;

            editor = test.editor;

            blueprint = new Blueprint();
            var a = new PropertyBlueprint().initWithNameBlueprintAndCardinality("a", blueprint, 1);
            var b = new PropertyBlueprint().initWithNameBlueprintAndCardinality("b", blueprint, 1);
            blueprint.addPropertyBlueprint(a);
            blueprint.addPropertyBlueprint(b);

            defaultGroup = blueprint.addPropertyBlueprintGroupNamed("default");
            defaultGroup.push(a, b);

            editor.ownerBlueprint = blueprint;

            editingDocument = {
                addOwnerBlueprintProperty: function () {},
                modifyOwnerBlueprintProperty: function () {},
                removeOwnerBlueprintProperty: function () {}
            };

            editor._ownerObject = {
                editingDocument: editingDocument
            };

            testPage.waitForDraw(1, true);
        });

        describe("add property button", function () {
            it("does nothing if no name given", function () {
                spyOn(editingDocument, "addOwnerBlueprintProperty");

                expect(defaultGroup.length).toBe(2);
                editor.templateObjects.addName.value = "";
                testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                    expect(editingDocument.addOwnerBlueprintProperty).not.toHaveBeenCalled();
                });
            });

            it("calls addOwnerBlueprintProperty to add the property", function () {
                spyOn(editingDocument, "addOwnerBlueprintProperty");

                expect(defaultGroup.length).toBe(2);
                editor.templateObjects.addName.value = "pass";
                testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                    expect(editingDocument.addOwnerBlueprintProperty).toHaveBeenCalled();
                    var arg = editingDocument.addOwnerBlueprintProperty.mostRecentCall.args[0];
                    expect(arg.name).toBe("pass");
                });
            });

            it("clears the name after adding", function () {
                expect(defaultGroup.length).toBe(2);
                editor.templateObjects.addName.value = "fail";
                testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                    expect(editor.templateObjects.addName.value).toBe("");
                });
            });
        });

        describe("remove button", function () {
            it("removes the property", function () {
                spyOn(editingDocument, "removeOwnerBlueprintProperty");

                runs(function () {
                    expect(defaultGroup.length).toBe(2);
                    testPage.clickOrTouch({target: editor.templateObjects.removeProperty[0].element}, function () {
                        expect(editingDocument.removeOwnerBlueprintProperty).toHaveBeenCalled();
                        var arg = editingDocument.removeOwnerBlueprintProperty.mostRecentCall.args[0];
                        expect(arg.name).toBe("a");
                    });
                });
            });
        });

        describe("valueType select", function () {
            it("changes to valueType of the property", function () {
                spyOn(editingDocument, "modifyOwnerBlueprintProperty");

                runs(function () {
                    expect(defaultGroup[0].valueType).toBe("string");

                    // simulate select
                    editor.templateObjects.valueType[0].element.value = "number";
                    editor.templateObjects.valueType[0].handleChange();

                    expect(editingDocument.modifyOwnerBlueprintProperty).toHaveBeenCalled();
                    var args = editingDocument.modifyOwnerBlueprintProperty.mostRecentCall.args;
                    expect(args[0].name).toBe("a");
                    expect(args[1]).toBe("valueType");
                    expect(args[2]).toBe("number");
                });
            });
        });
    });

});
