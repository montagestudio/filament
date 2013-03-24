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
    });

    describe("closing a file", function () {

        describe("that is not open", function () {

            var unopenedDocument;

            beforeEach(function () {
                unopenedDocument = Montage.create();
                unopenedDocument.url = "notOpen";
            });

            it("must return a rejected promise", function () {
                var closedDocumentPromise = projectController.closeDocument(unopenedDocument);

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
