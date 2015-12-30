var Promise = require("montage/core/promise").Promise;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;
var EventBlueprint = require("montage/core/meta/event-blueprint").EventBlueprint;
var Template = require("montage/core/template").Template;
var mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument;


describe("core/reel-blueprint-editing-spec", function () {

    var reelDocumentPromise, blueprint;

    beforeEach(function () {

        Template._templateCache = {
            moduleId: Object.create(null)
        };

        blueprint = new Blueprint();

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
            reelDocument._propertyBlueprintConstructor = PropertyBlueprint;
            reelDocument._eventBlueprintConstructor = EventBlueprint;
            return reelDocument;
        });
    });

    describe("properies", function () {
        var a, b, defaultGroup;

        beforeEach(function () {
            a = new PropertyBlueprint().initWithNameBlueprintAndCardinality("a", blueprint, 1);
            b = new PropertyBlueprint().initWithNameBlueprintAndCardinality("b", blueprint, 1);
            blueprint.addPropertyBlueprint(a);
            blueprint.addPropertyBlueprint(b);

            defaultGroup = blueprint.addPropertyBlueprintGroupNamed("Mock");
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
                    blueprint = new Blueprint();
                    reelDocument.__ownerBlueprint = Promise.resolve(blueprint);

                    return reelDocument.addOwnerBlueprintProperty("pass")
                    .then(function () {
                        defaultGroup = blueprint.propertyBlueprintGroupForName(reelDocument._exportName);
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
            a = new EventBlueprint().initWithNameAndBlueprint("a", blueprint);
            b = new EventBlueprint().initWithNameAndBlueprint("b", blueprint);
            blueprint.addEventBlueprint(a);
            blueprint.addEventBlueprint(b);

            eventBlueprints = blueprint.eventBlueprints;
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
