/*global require,exports,describe,it,expect,runs */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;

TestPageLoader.queueTest("edit-properties-test", function(testPage) {
    describe("ui/template-explorer/owner-cell/edit-properties", function() {

        var test, editor, blueprint, defaultGroup;
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
            testPage.waitForDraw();
        });

        describe("add property button", function () {
            it("does nothing if no name given", function () {
                expect(defaultGroup.length).toBe(2);
                editor.templateObjects.addName.value = "";
                testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                    expect(defaultGroup.length).toBe(2);
                });
            });

            it("adds to the default group", function () {
                expect(defaultGroup.length).toBe(2);
                editor.templateObjects.addName.value = "pass";
                testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                    expect(defaultGroup.length).toBe(3);
                    expect(defaultGroup[2].name).toBe("pass");
                });
            });

            it("clears the name after adding", function () {
                expect(defaultGroup.length).toBe(2);
                editor.templateObjects.addName.value = "fail";
                testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                    expect(editor.templateObjects.addName.value).toBe("");
                });
            });

            it("adds a default group if one doesn't exist", function () {
                blueprint = new Blueprint();
                editor.ownerBlueprint = blueprint;

                editor.templateObjects.addName.value = "pass";
                testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                    defaultGroup = blueprint.propertyBlueprintGroupForName("default");
                    expect(defaultGroup.length).toBe(1);
                    expect(defaultGroup[0].name).toBe("pass");
                });
            });
        });

        describe("remove button", function () {
            it("removes the property", function () {
                runs(function () {
                    expect(defaultGroup.length).toBe(2);
                    testPage.clickOrTouch({target: editor.templateObjects.removeProperty[0].element}, function () {
                        expect(defaultGroup.length).toBe(1);
                        expect(defaultGroup[0].name).toBe("b");
                    });
                });
            });
        });

        describe("valueType select", function () {
            it("changes to valueType of the property", function () {
                runs(function () {
                    expect(defaultGroup[0].valueType).toBe("string");

                    // simulate select
                    editor.templateObjects.valueType[0].element.value = "number";
                    editor.templateObjects.valueType[0].handleChange();

                    expect(defaultGroup[0].valueType).toBe("number");
                });
            });
        });
    });

});
