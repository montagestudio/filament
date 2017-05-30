var Promise = require("montage/core/promise").Promise;
var ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor;
var PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor;
var EventDescriptor = require("montage/core/meta/event-descriptor").EventDescriptor;
var Template = require("montage/core/template").Template;
var mockReelDocument = require("mocks/reel-document-mocks").mockReelDocument;


describe("core/reel-blueprint-editing-spec", function () {

    var reelDocumentPromise, blueprint;

    beforeEach(function () {

        Template._templateCache = {
            moduleId: Object.create(null)
        };

        blueprint = new ObjectDescriptor();

        reelDocumentPromise = mockReelDocument("foo/bar/mock.reel", {
            "owner": {
                "properties": {
                    "element": {"#": "ownerElement"}
                }
            }
        },
        '<div id="ownerElement" data-montage-id="ownerElement"></div>')
        .then(function (reelDocument) {
            reelDocument.__ownerBlueprint = Promise.resolve(blueprint);
            reelDocument._propertyBlueprintConstructor = PropertyDescriptor;
            reelDocument._eventBlueprintConstructor = EventDescriptor;
            return reelDocument;
        });
    });

    describe("properies", function () {
        var a, b, defaultGroup;

        beforeEach(function () {
            a = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("a", blueprint, 1);
            b = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("b", blueprint, 1);
            blueprint.addPropertyDescriptor(a);
            blueprint.addPropertyDescriptor(b);

            defaultGroup = blueprint.addPropertyDescriptorGroupNamed("Mock");
            defaultGroup.push(a, b);
        });

        describe("adding a blueprint property", function () {

            it("works", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    return reelDocument.addOwnerBlueprintProperty("pass")
                    .then(function () {
                        expect(defaultGroup.length).toBe(3);
                        expect(defaultGroup[2].name).toBe("pass");
                    });
                });
            });

            it("adds a group named after the component if one doesn't exist", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    blueprint = new ObjectDescriptor();
                    reelDocument.__ownerBlueprint = Promise.resolve(blueprint);

                    return reelDocument.addOwnerBlueprintProperty("pass")
                    .then(function () {
                        defaultGroup = blueprint.propertyDescriptorGroupForName(reelDocument._exportName);
                        expect(defaultGroup.length).toBe(1);
                        expect(defaultGroup[0].name).toBe("pass");
                    });
                });
            });

        });

        describe("modifying a blueprint property", function () {
            it("works", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    return reelDocument.modifyOwnerBlueprintProperty("a", "valueType", "number")
                    .then(function () {
                        expect(a.valueType).toBe("number");
                    });
                });
            });
        });

        describe("removing a blueprint property", function () {

            it("works", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    return reelDocument.removeOwnerBlueprintProperty("a")
                    .then(function () {
                        expect(defaultGroup.length).toBe(1);
                        expect(defaultGroup[0].name).toBe("b");
                    });
                });
            });

            it("correctly undos", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    defaultGroup[1].valueType = "number";
                    return reelDocument.removeOwnerBlueprintProperty("b")
                    .then(function () {
                        return reelDocument.undoManager.undo();
                    })
                    .then(function () {
                        expect(defaultGroup.length).toBe(2);
                        expect(defaultGroup[1].name).toBe("b");
                        expect(defaultGroup[1].valueType).toBe("number");
                    });
                });
            });

        });
    });

    describe("events", function () {
        var a, b, eventBlueprints;

        beforeEach(function () {
            a = new EventDescriptor().initWithNameAndObjectDescriptor("a", blueprint);
            b = new EventDescriptor().initWithNameAndObjectDescriptor("b", blueprint);
            blueprint.addEventDescriptor(a);
            blueprint.addEventDescriptor(b);

            eventBlueprints = blueprint.eventDescriptors;
        });

        describe("adding a blueprint event", function () {

            it("works", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    return reelDocument.addOwnerBlueprintEvent("pass")
                    .then(function () {
                        expect(eventBlueprints.length).toBe(3);
                        expect(eventBlueprints[2].name).toBe("pass");
                    });
                });
            });

        });

        // describe("modifying a blueprint event", function () {
        //     it("works", function () {
        //         return reelDocumentPromise.then(function (reelDocument) {
        //             return reelDocument.modifyOwnerBlueprintEvent("a")
        //             .then(function () {
        //                 expect(a.valueType).toBe("number");
        //             });
        //         });
        //     });
        // });

        describe("removing a blueprint event", function () {

            it("works", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    return reelDocument.removeOwnerBlueprintEvent("a")
                    .then(function () {
                        expect(eventBlueprints.length).toBe(1);
                        expect(eventBlueprints[0].name).toBe("b");
                    });
                });
            });

            it("correctly undos", function () {
                return reelDocumentPromise.then(function (reelDocument) {
                    return reelDocument.removeOwnerBlueprintEvent("b")
                    .then(function () {
                        return reelDocument.undoManager.undo();
                    })
                    .then(function () {
                        expect(eventBlueprints.length).toBe(2);
                        expect(eventBlueprints[1].name).toBe("b");
                    });
                });
            });

        });
    });
});
