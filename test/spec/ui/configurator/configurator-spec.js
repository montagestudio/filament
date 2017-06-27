/*global require,describe,it,expect,runs,waits */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Promise = require("montage/core/promise").Promise,
    ReelDocument = require("filament/core/reel-document").ReelDocument,
    documentDataSourceMock = require("mocks/document-data-source-mocks").documentDataSourceMock;

TestPageLoader.queueTest("configurator-test", function(testPage) {
    describe("configurator", function() {

        var test,
            dataSource = documentDataSourceMock({
                read: function (url) {
                    return require.async(url.slice(require.location.length))
                    .then(function (exports) {
                        return exports.content;
                    });
                },
                write: function (url) {
                    return Promise.resolve();
                }
            }),
            editingDocument,
            configurator;

        beforeEach(function() {
            test = testPage.test;
            configurator = test.configurator;
            editingDocument = new ReelDocument().init(require.location + "mocks/ui/complex.reel/", dataSource, require);
            return editingDocument.load().then(function () {
                configurator.editingDocument = editingDocument;
                configurator.ownerObject = editingDocument.editingProxyMap.owner;
            });
        });

        it("renders", function () {

        });

        it("has a properties tab", function () {
            var propertiesTab = testPage.document.querySelector("#configurator nav div:nth-child(1)");
            propertiesTab.dispatchEvent(new MouseEvent("click"));

            expect(propertiesTab).toBeTruthy();
            expect(propertiesTab.innerHTML.toLowerCase()).toContain("properties");
        });

        it("has a bindings tab", function () {
            var bindingsTab = testPage.document.querySelector("#configurator nav div:nth-child(2)");
            bindingsTab.dispatchEvent(new MouseEvent("click"));

            expect(bindingsTab).toBeTruthy();
            expect(bindingsTab.innerHTML.toLowerCase()).toContain("bindings");
        });

        it("has a listeners tab", function () {
            var listenersTab = testPage.document.querySelector("#configurator nav div:nth-child(3)");
            listenersTab.dispatchEvent(new MouseEvent("click"));

            expect(listenersTab).toBeTruthy();
            expect(listenersTab.innerHTML.toLowerCase()).toContain("listeners");
        });

        it("has a methods tab", function () {
            var methodsTab = testPage.document.querySelector("#configurator nav div:nth-child(4)");
            methodsTab.dispatchEvent(new MouseEvent("click"));

            expect(methodsTab).toBeTruthy();
            expect(methodsTab.innerHTML.toLowerCase()).toContain("methods");
        });

        it("has a style tab", function () {
            var styleTab = testPage.document.querySelector("#configurator nav div:nth-child(5)");
            styleTab.dispatchEvent(new MouseEvent("click"));

            expect(styleTab).toBeTruthy();
            expect(styleTab.innerHTML.toLowerCase()).toContain("style");
        });
    });
});

