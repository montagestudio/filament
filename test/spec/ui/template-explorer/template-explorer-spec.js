/*global require,describe,it,expect,runs,waits */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Promise = require("montage/core/promise").Promise,
    ReelDocument = require("filament/core/reel-document").ReelDocument,
    documentDataSourceMock = require("mocks/document-data-source-mocks").documentDataSourceMock;

TestPageLoader.queueTest("template-explorer-test", function(testPage) {
    describe("ui/template-explorer", function() {

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
            templateExplorer;

        beforeEach(function (done) {
            test = testPage.test;
            templateExplorer = test.templateExplorer;
            editingDocument = new ReelDocument().init(require.location + "mocks/ui/complex.reel/", dataSource, require);
            return editingDocument.load().then(done);
        });

        it("renders", function () {
            templateExplorer.editingDocument = editingDocument;
            templateExplorer.ownerObject = editingDocument.editingProxyMap.owner;
        });
    });
});

