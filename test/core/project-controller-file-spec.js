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

        it("should open the current document if asked to open the same fileUrl", function () {
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
                    content = projectController.openDocumentsController.organizedContent;

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

    describe("closing a file", function () {
        var editorType, editingDocument;

        beforeEach(function () {

            var documents = {};
            documents[textUrl] = {fileUrl: textUrl};
            documents[reelUrl] = {fileUrl: reelUrl};
            documents["foo"] = {fileUrl: "foo"};

            editorType = editorMock({
                load: function (fileUrl) {
                    return Promise.resolve(documents[fileUrl]);
                },
                close: function (fileUrl) {
                    return Promise.resolve(documents[fileUrl]);
                }
            });

            viewController.registerEditorTypeForFileTypeMatcher(editorType, function () {
                return true;
            });
        });

        describe("that is not open", function () {

            it("must return a rejected promise", function () {
                var closedDocumentPromise = projectController.closeFileUrl("foo");

                expect(Promise.isPromiseAlike(closedDocumentPromise)).toBeTruthy();

                return closedDocumentPromise.fail(function (error) {
                    expect(error instanceof Error).toBeTruthy();
                });
            });

        });

        describe("that is open", function () {

            it("should return a promise for the closed document", function () {
                return projectController.openFileUrl(textUrl).then(function () {
                    var closedDocumentPromise =  projectController.closeFileUrl(textUrl);
                    expect(Promise.isPromiseAlike(closedDocumentPromise)).toBeTruthy();
                });

            });

            it("should allow the editor to close the document", function () {
                return projectController.openFileUrl(textUrl).then(function (loadInfo) {
                    var editor = loadInfo.editor;

                    spyOn(editor, "close").andCallThrough();

                    return projectController.closeFileUrl(textUrl).then(function (closedDocument) {
                        expect(editor.close).toHaveBeenCalled();
                    });
                });
            });

            it("should close the document associated with the specified fileUrl", function () {
                return projectController.openFileUrl(textUrl).then(function () {
                    return projectController.closeFileUrl(textUrl);
                }).then(function (closedDocument) {
                    expect(closedDocument.fileUrl).toBe(textUrl);
                });
            });

            it("must not consider a closed document open any more", function () {
                return projectController.openFileUrl(textUrl).then(function () {
                    return projectController.closeFileUrl(textUrl);
                }).then(function (closedDocument) {
                    expect(projectController.openDocumentsController.content.indexOf(closedDocument)).toBe(-1);
                });
            });

            describe("and is not the current document", function () {

                it("must not change the currentDocument", function () {
                    return projectController.openFileUrl(textUrl).then(function () {
                        return projectController.openFileUrl(reelUrl);
                    }).then(function () {
                        return projectController.closeFileUrl(textUrl);
                    }).then(function () {
                        expect(projectController.currentDocument.fileUrl).toBe(reelUrl);
                    });
                });

            });

            describe("and is the current document", function () {

                it("should leave no document open if there are no other documents to open", function () {
                    return projectController.openFileUrl(textUrl).then(function () {
                        return projectController.closeFileUrl(textUrl);
                    }).then(function () {
                        expect(projectController.currentDocument).toBeNull();
                    });
                });

                it("should leave the next document in order open if there is one", function () {
                    return projectController.openFileUrl(textUrl).then(function () {
                        return projectController.openFileUrl(reelUrl);
                    }).then(function () {
                        return projectController.openFileUrl(textUrl);
                    }).then(function () {
                        // [>>Text<<] [Reel]
                        return projectController.closeFileUrl(textUrl);
                    }).then(function () {
                        expect(projectController.currentDocument.fileUrl).toBe(reelUrl);
                    });
                });

                //TODO move out the determination of "next" document out to its own spec
                it("should leave the previous document in order open if this was the last document", function () {
                    return projectController.openFileUrl(reelUrl).then(function () {
                        return projectController.openFileUrl(textUrl);
                    }).then(function () {
                        // [Reel] [>>Text<<]
                        return projectController.closeFileUrl(textUrl);
                    }).then(function () {
                        expect(projectController.currentDocument.fileUrl).toBe(reelUrl);
                    });
                });

            });

        });

    });

});
