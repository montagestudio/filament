var mockReelDocument = require("mocks/reel-document-mocks").mockReelDocument;

describe("core/node-proxy-spec", function () {
    var reelDocument;

    beforeEach(function (done) {
        var reelDocumentPromise = mockReelDocument("foo/bar/mock.reel", {
            "owner": {
                "properties": {
                    "element": {"#": "ownerElement"}
                }
            },
            "foo": {
                "prototype": "ui/foo.reel",
                "properties": {
                    "element": {"#": "foo"}
                }
            },
            "bar": {
                "prototype": "ui/bar.reel",
                "properties": {
                }
            }
        }, '<div data-montage-id="ownerElement"><div data-montage-id="foo" id="foo"></div><div data-montage-id="bar" id="bar"></div></div>');
        reelDocumentPromise.then(function (reelDoc) {
            reelDocument = reelDoc;
        }).then(done);
    });

    describe("component property", function() {
        it("should reference the component that references the node as the element property", function() {
            var nodeProxy = reelDocument.nodeProxyForMontageId("foo"),
                reelProxy = reelDocument.editingProxyMap.foo;

            expect(reelProxy.properties.get("element")).toBe(nodeProxy);
        });

        it("should update when the component stops referencing the node", function() {
            var nodeProxy = reelDocument.nodeProxyForMontageId("foo"),
                reelProxy = reelDocument.editingProxyMap.foo,
                barNodeProxy = reelDocument.nodeProxyForMontageId("bar");

            reelProxy.properties.set("element", barNodeProxy);

            expect(nodeProxy.component).toBeUndefined();
        });

        it("should update when the a component starts referencing the node", function() {
            var nodeProxy = reelDocument.nodeProxyForMontageId("bar"),
                reelProxy = reelDocument.editingProxyMap.bar;

            reelProxy.properties.set("element", nodeProxy);

            expect(nodeProxy.component).toBe(reelProxy);
        });
    });

    describe("tagName", function () {

        it("changes the tagName", function () {
            var nodeProxy = reelDocument.nodeProxyForMontageId("foo");

            nodeProxy.tagName = "span";
            expect(nodeProxy._templateNode.tagName).toEqual("SPAN");
        });

        it("copies attributes", function () {
            var nodeProxy = reelDocument.nodeProxyForMontageId("foo");

            nodeProxy.tagName = "span";
            expect(nodeProxy._templateNode.getAttribute("data-montage-id")).toEqual("foo");
        });

        it("moves children", function () {
            var nodeProxy = reelDocument.nodeProxyForMontageId("ownerElement");
            var fooProxy = reelDocument.nodeProxyForMontageId("foo");

            nodeProxy.tagName = "span";
            expect(nodeProxy._templateNode.childNodes[0]).toBe(fooProxy._templateNode);
        });
    });
});
