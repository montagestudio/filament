var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    editorMock = require("test/mocks/editor-mocks").editorMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-file-spec", function () {

    var bridge, viewController, projectController, mockMenu, textUrl, reelUrl,
        editor;

    beforeEach(function () {
        mockMenu = menuMock({
            menuItems: {
                "newComponent": Montage.create(),
                "newModule": Montage.create()
            }
        });

        bridge = environmentBridgeMock({
            mainMenu: mockMenu
        });

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController, []);

        textUrl = "foo.txt";
        reelUrl = "foo.reel";
    });

    describe("opening a file", function () {

        it("must return a promise for a document", function () {
            var openPromise = projectController.openFileUrl(textUrl);
            expect(Promise.isPromiseAlike(openPromise));
            openPromise.timeout(WAITSFOR_TIMEOUT).done();
        });

        it("must open the current document if asked to open the same fileUrl", function () {
            var doc = {fileUrl: textUrl};
            projectController.currentDocument = doc;

            return projectController.openFileUrl(textUrl).then(function (loadedInfo) {
                expect(loadedInfo.document).toBe(doc);
            });
        });

        it("must not open a document if no editor available for the specified file", function () {
            return projectController.openFileUrl(textUrl).then(function (loadedInfo) {
                expect(loadedInfo.document).toBeNull();
            });
        });

        describe("with an available editor", function () {

            var editorType, editingDocument;

            beforeEach(function () {

                editingDocument = Montage.create();

                editorType = editorMock({
                    load: function () {
                        return Promise.resolve(editingDocument);
                    }
                });

                viewController.registerEditorTypeForFileTypeMatcher(editorType, function () {
                    return true;
                });
            });

            it("should resolve the document when editor available for the specified file", function () {
                return projectController.openFileUrl("foo").then(function (loadedInfo) {
                    expect(loadedInfo.document).toBe(editingDocument);
                });
            });

            it("should resolve the editor instance when editor available for the specified file", function () {
                return projectController.openFileUrl("foo").then(function (loadedInfo) {
                    expect(Object.getPrototypeOf(loadedInfo.editor)).toBe(editorType);
                });
            });

            //TODO editors should probably opt-out of this and claim they only handle one document at a time
            //forcing use to create one per editor; this multiple document support in the editor is
            //a bit of a performance optimization
            it("should use the same editor instance to open multiple supported files", function () {
                var editor;

                return projectController.openFileUrl("foo")
                    .then(function (loadedInfo) {
                        editor = loadedInfo.editor;
                        return projectController.openFileUrl("bar");
                    }).then(function (loadedInfo) {
                        expect(loadedInfo.editor).toBe(editor);
                    });
            });

            it("should populate the openDocument controller", function () {
                var openDocuments = [],
                    content = projectController.openDocumentsController.visibleContent;

                return projectController.openFileUrl("foo")
                    .then(function (loadedInfo) {
                        openDocuments.push(loadedInfo.document);
                        return projectController.openFileUrl("bar");
                    }).then(function (loadedInfo) {
                        openDocuments.push(loadedInfo.document);
                    }).then(function () {
                        expect(openDocuments[0]).toBe(content[0]);
                        expect(openDocuments[1]).toBe(content[1]);
                        expect(content.length).toBe(2);
                    });
            });

        });

    });


});
