var Promise = require("montage/core/promise").Promise;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;
var Template = require("montage/core/template").Template;
var mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument;


describe("core/reel-blueprint-editing-spec", function () {

    var reelDocumentPromise, blueprint, a, b, defaultGroup;

    beforeEach(function () {

        Template._templateCache = {
            moduleId: Object.create(null)
        };

        blueprint = new Blueprint();
        a = new PropertyBlueprint().initWithNameBlueprintAndCardinality("a", blueprint, 1);
        b = new PropertyBlueprint().initWithNameBlueprintAndCardinality("b", blueprint, 1);
        blueprint.addPropertyBlueprint(a);
        blueprint.addPropertyBlueprint(b);

        defaultGroup = blueprint.addPropertyBlueprintGroupNamed("Mock");
        defaultGroup.push(a, b);

        reelDocumentPromise = mockReelDocument("foo/bar/mock.reel", {
            "owner": {
                "properties": {
                    "element": {"#": "ownerElement"}
                }
            }
        },
        '<div id="ownerElement" data-montage-id="ownerElement"></div>')
        .then(function (reelDocument) {
            reelDocument.__ownerBlueprint = Promise(blueprint);
            return reelDocument;
        });
    });

    describe("adding a blueprint property", function () {

        it("works", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                var property = new PropertyBlueprint().initWithNameBlueprintAndCardinality("pass", blueprint, 1);
                return reelDocument.addOwnerBlueprintProperty(property)
                .then(function () {
                    expect(defaultGroup.length).toBe(3);
                    expect(defaultGroup[2].name).toBe("pass");
                });
            });
        });

        it("adds a group named after the component if one doesn't exist", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                blueprint = new Blueprint();
                reelDocument.__ownerBlueprint = Promise(blueprint);

                var property = new PropertyBlueprint().initWithNameBlueprintAndCardinality("pass", blueprint, 1);
                return reelDocument.addOwnerBlueprintProperty(property)
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
                return reelDocument.modifyOwnerBlueprintProperty(a, "valueType", "number")
                .then(function () {
                    expect(a.valueType).toBe("number");
                });
            });
        });
    });

    describe("removing a blueprint property", function () {

        it("works", function () {
            return reelDocumentPromise.then(function (reelDocument) {
                return reelDocument.removeOwnerBlueprintProperty(a)
                .then(function () {
                    expect(defaultGroup.length).toBe(1);
                    expect(defaultGroup[0].name).toBe("b");
                });
            });

        });

    });
});
