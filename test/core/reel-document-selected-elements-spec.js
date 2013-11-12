var Template = require("montage/core/template").Template,
    mockReelDocument = require("test/mocks/reel-document-mocks").mockReelDocument,
    WAITSFOR_TIMEOUT = 2500;

describe("core/reel-document-template-editing-spec", function () {

    var reelDocumentPromise;

    beforeEach(function () {

        Template._templateCache = {
            moduleId: Object.create(null)
        };

        reelDocumentPromise = mockReelDocument("foo/bar/mock.reel", {
            "owner": {
                "properties": {
                    "element": {"#": "ownerElement"}
                }
            },
            "foo": {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": {"#": "foo"}
                },
                "bindings": {
                    "targetValue": {"<-": "@bar.sourceValue"}
                },
                "listeners": [
                    {
                        "type": "fooEvent",
                        "listener": {"@": "owner"}
                    }
                ]
            },
            "testDomAttribute": {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": {"#": "testDomAttribute"}
                }
            },
            "bar": {
                "prototype": "bar-exportId",
                "properties": {
                    "elReference": {"#": "removeLastNode"}
                }
            }
        },
        '<div id="ownerElement" data-montage-id="ownerElement">'+
        '   <section id="removeSubTree">'+
        '       <p id="removeMe"></p>'+
        '       <div id="foo" data-montage-id="foo">'+
        '           <p id="removeLastNode" data-montage-id="removeLastNode"></p>'+
        '       </div>'+
        '       <div data-arg="readOnly" data-param="display" id="testDomAttribute" data-montage-id="testDomAttribute"></div>'+
        '   </section>'+
        '</div>');
    });

    describe("selecting an element", function () {

        it("should select an element", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeSubTree");
                var nodeProxy = reelDocument.nodeProxyForNode(element);
                reelDocument.selectElement(nodeProxy, true);
                expect(reelDocument.selectedElements.length).toBe(1);
                expect(reelDocument.selectedElements[0]).toBe(nodeProxy);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should select multiple elements", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element1 = reelDocument.htmlDocument.getElementById("foo");
                var nodeProxy1 = reelDocument.nodeProxyForNode(element1);
                reelDocument.selectElement(nodeProxy1);

                var element2 = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy2 = reelDocument.nodeProxyForNode(element2);
                reelDocument.selectElement(nodeProxy2);

                expect(reelDocument.selectedElements.length).toBe(2);
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should not delete an element", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element1 = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy1 = reelDocument.nodeProxyForNode(element1);
                var element2 = reelDocument.htmlDocument.getElementById("testDomAttribute");
                var nodeProxy2 = reelDocument.nodeProxyForNode(element2);

                reelDocument.selectElement(nodeProxy1);
                reelDocument.selectObject(nodeProxy2.component);
                reelDocument.deleteSelected();

                expect(reelDocument.htmlDocument.getElementById("removeMe")).toBeTruthy();
                expect(element1.dataset.montageId).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });

        it("should delete an element", function() {
            return reelDocumentPromise.then(function (reelDocument) {
                var element = reelDocument.htmlDocument.getElementById("removeMe");
                var nodeProxy = reelDocument.nodeProxyForNode(element);
                reelDocument.selectElement(nodeProxy);
                reelDocument.deleteSelected();

                expect(reelDocument.htmlDocument.getElementById("removeMe")).toBeFalsy();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });
});
