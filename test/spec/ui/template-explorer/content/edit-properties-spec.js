/*global require,describe,it,expect */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor;
var EventDescriptor = require("montage/core/meta/event-descriptor").EventDescriptor;
var Promise = require("montage/core/promise").Promise;

TestPageLoader.queueTest("edit-properties-test", function(testPage) {
    describe("ui/template-explorer/content/edit-properties", function() {

        var test, editor, blueprint, editingDocument;
        beforeEach(function() {
            test = testPage.test;

            editor = test.editor;

            blueprint = new Blueprint();

            editingDocument = {
                addOwnerBlueprintProperty: function (name) { return Promise.resolve(); },
                modifyOwnerBlueprintProperty: function (name, property, value) { return Promise.resolve(); },
                removeOwnerBlueprintProperty: function (name) { return Promise.resolve(); },
                addOwnerBlueprintEvent: function (name) { return Promise.resolve(); },
                // modifyOwnerBlueprintEvent: function (name) { return Promise.resolve(); },
                removeOwnerBlueprintEvent: function (name) { return Promise.resolve(); },
                registerFile: function (type, cb, editor) { return Promise.resolve(); },
                unregisterFile: function (type) { return Promise.resolve(); },
                _ownerBlueprint: Promise.resolve(blueprint)
            };

            editor.editingDocument = editingDocument;

            editor.ownerObject = {
                editingDocument: editingDocument,
                exportName: "Mock"
            };
        });

        describe("properties", function () {

            var a, b, defaultGroup;
            beforeEach(function (done) {
                a = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("a", blueprint, 1);
                b = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("b", blueprint, 1);
                blueprint.addPropertyDescriptor(a);
                blueprint.addPropertyDescriptor(b);

                defaultGroup = blueprint.addPropertyDescriptorGroupNamed("Mock");
                defaultGroup.push(a, b);

                Promise.delay(50).then(done); // wait for a draw that may or may not happen
            });

            describe("add property button", function () {
                it("does nothing if no name given", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").and.callThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: ""});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintProperty).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });

                it("calls addOwnerBlueprintProperty to add the property", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").and.callThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "pass"});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintProperty).toHaveBeenCalledWith("pass");
                    expect(event.defaultPrevented).toBe(false);
                });

                // it("clears the name after adding", function () {
                //     editor.templateObjects.addName.value = "fail";
                //     testPage.clickOrTouch({target: editor.templateObjects.addProperty.element}, function () {
                //         expect(editor.templateObjects.addName.value).toBe("");
                //     });
                // });

                it("cannot be named the same as an existing blueprint", function () {
                    spyOn(editingDocument, "addOwnerBlueprintProperty").and.callThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "a"});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintProperty).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });
            });

            describe("remove button", function () {
                it("removes the property", function () {
                    spyOn(editingDocument, "removeOwnerBlueprintProperty").and.callThrough();

                    var event = new CustomEvent("remove", {bubbles: true, cancelable: true, detail: a});
                    editor.templateObjects.properties.dispatchEvent(event);

                    expect(editingDocument.removeOwnerBlueprintProperty).toHaveBeenCalledWith("a");
                });
            });

            describe("valueType select", function () {
                it("changes to valueType of the property", function (done) {
                    spyOn(editingDocument, "modifyOwnerBlueprintProperty").and.callThrough();

                    var aSelect;

                    expect(defaultGroup[0].valueType).toBe("string");

                    // simulate select
                    aSelect = editor.templateObjects.valueType.filter(function (valueType) {
                        return valueType.propertyBlueprint && valueType.propertyBlueprint.name === "a";
                    })[0];
                    aSelect.element.value = "number";
                    aSelect.handleChange();

                    expect(editingDocument.modifyOwnerBlueprintProperty)
                        .toHaveBeenCalledWith("a", "valueType", "number");
                    done();
                });

                it("calls modifyOwnerBlueprintProperty before the change is made", function (done) {
                    spyOn(editingDocument, "modifyOwnerBlueprintProperty")
                    .and.callFake(function (name, property, value) {
                        var propertyBlueprint = blueprint.propertyDescriptorForName(name);
                        expect(propertyBlueprint[property]).toBe("string");
                        expect(value).toBe("number");
                        return Promise.resolve();
                    });

                    var aSelect;

                    expect(defaultGroup[0].valueType).toBe("string");

                    // simulate select
                    aSelect = editor.templateObjects.valueType.filter(function (valueType) {
                        return valueType.propertyBlueprint && valueType.propertyBlueprint.name === "a";
                    })[0];
                    aSelect.element.value = "number";
                    aSelect.handleChange();

                    expect(editingDocument.modifyOwnerBlueprintProperty).toHaveBeenCalled();
                    done();
                });
            });

            describe("multi checkbox", function () {
                it("changes cardinality of the property", function (done) {
                    spyOn(editingDocument, "modifyOwnerBlueprintProperty").and.callThrough();

                    var aCheckbox;

                    expect(defaultGroup[0].cardinality).toBe(1);

                    // simulate select
                    aCheckbox = editor.templateObjects.multiple.filter(function (valueType) {
                        return valueType.propertyBlueprint && valueType.propertyBlueprint.name === "a";
                    })[0];
                    aCheckbox.element.checked = true;
                    aCheckbox.handleChange();

                    expect(editingDocument.modifyOwnerBlueprintProperty)
                        .toHaveBeenCalledWith("a", "cardinality", Infinity);
                    done();
                });
            });

        });

        describe("events", function () {
            var a, b;
            beforeEach(function (done) {
                a = new EventDescriptor().initWithNameAndObjectDescriptor("a", blueprint);
                b = new EventDescriptor().initWithNameAndObjectDescriptor("b", blueprint);
                blueprint.addEventDescriptor(a);
                blueprint.addEventDescriptor(b);

                Promise.delay(50).then(done); // wait for a draw that may or may not happen
            });

            describe("add event button", function () {
                it("does nothing if no name given", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").and.callThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: ""});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintEvent).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });

                it("calls addOwnerBlueprintEvent to add the event", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").and.callThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "pass"});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintEvent).toHaveBeenCalledWith("pass");
                    expect(event.defaultPrevented).toBe(false);
                });

                // it("clears the name after adding", function () {
                //     var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "fail"});
                //     editor.templateObjects.events.dispatchEvent(event);

                //     expect(editor.templateObjects.addEventName.value).toBe("");
                // });

                it("cannot be named the same as an existing blueprint", function () {
                    spyOn(editingDocument, "addOwnerBlueprintEvent").and.callThrough();

                    var event = new CustomEvent("add", {bubbles: true, cancelable: true, detail: "a"});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.addOwnerBlueprintEvent).not.toHaveBeenCalled();
                    expect(event.defaultPrevented).toBe(true);
                });
            });

            describe("remove button", function () {
                it("removes the event", function () {
                    spyOn(editingDocument, "removeOwnerBlueprintEvent").and.callThrough();

                    var event = new CustomEvent("remove", {bubbles: true, cancelable: true, detail: a});
                    editor.templateObjects.events.dispatchEvent(event);

                    expect(editingDocument.removeOwnerBlueprintEvent).toHaveBeenCalledWith("a");
                });
            });

        });

    });

});
