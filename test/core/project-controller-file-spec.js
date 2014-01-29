var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    editorMock = require("test/mocks/editor-mocks").editorMock,
    editorControllerMock = require("test/mocks/editor-controller-mocks").editorControllerMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise;

describe("core/project-controller-file-spec", function () {

    var bridge, viewController, editorController, projectController, mockMenu;

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

        editorController = editorControllerMock();

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController, editorController);
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

            var openedDocument, editor;

            beforeEach(function () {
                var editorType = editorMock;

                editor = editorType({
                    close: Function.noop
                });

                openedDocument = new (Montage.specialize({

                    constructor: {
                        value: function mockDocument() {
                            this.super();
                        }
                    },

                    url: {
                        value: "opened"
                    },

                    canClose: {
                        value: Function.noop
                    }
                }, {
                    editorType: {
                        value: editorType
                    }
                }))();

                // Sneaky mock "opening"
                projectController._editorTypeInstanceMap.set(editorType, editor);
                projectController.addDocument(openedDocument);
            });

            it("should return a promise for the closed document", function () {
                var closedDocumentPromise =  projectController.closeDocument(openedDocument);
                expect(Promise.isPromiseAlike(closedDocumentPromise)).toBeTruthy();
                closedDocumentPromise.done();
            });

            it("should allow the editor to close the document", function () {

                spyOn(editor, "close");

                return projectController.closeDocument(openedDocument).then(function (closedDocument) {
                    expect(editor.close).toHaveBeenCalled();
                });
            });

            it("should hide the editor when the last document is closed", function () {

                spyOn(editorController, "hideEditors");

                return projectController.closeDocument(openedDocument).then(function (closedDocument) {
                    expect(editorController.hideEditors).toHaveBeenCalled();
                });
            });

            it("should resolve the close promise as the specified document", function () {
                return projectController.closeDocument(openedDocument)
                    .then(function (closedDocument) {
                        expect(closedDocument).toBe(openedDocument);
                    });
            });

            it("must not consider a closed document open any more", function () {
                return projectController.closeDocument(openedDocument)
                    .then(function (closedDocument) {
                        expect(projectController.documents.indexOf(closedDocument)).toBe(-1);
                    });
            });

            describe("with multiple open documents", function () {

                var fooDocument, barDocument;

                beforeEach(function () {
                    var editorType = editorMock;

                    fooDocument = new (Montage.specialize({

                        constructor: {
                            value: function mockDocument() {
                                this.super();
                            }
                        },

                        url: {
                            value: "other"
                        },

                        canClose: {
                            value: Function.noop
                        }
                    }, {
                        editorType: {
                            value: editorType
                        }
                    }))();

                    projectController.addDocument(fooDocument);

                    barDocument = new (Montage.specialize({

                        constructor: {
                            value: function mockDocument() {
                                this.super();
                            }
                        },

                        url: {
                            value: "current"
                        },

                        canClose: {
                            value: Function.noop
                        }
                    }, {
                        editorType: {
                            value: editorType
                        }
                    }))();

                    projectController.addDocument(barDocument);
                    //Note currentDocument needs to be opened as part of each test
                });

                it("should not hide the editor when closed and a document remains", function () {
                    spyOn(editorController, "hideEditors");

                    return projectController.openUrlForEditing(fooDocument.url).then(function () {
                        return projectController.closeDocument(fooDocument);
                    }).then(function () {
                        expect(editorController.hideEditors).not.toHaveBeenCalled();
                    });
                });

                describe("and is not the current document", function () {

                    it("must not change the currentDocument", function () {
                        return projectController.openUrlForEditing(barDocument.url)
                            .then(function () {
                                return projectController.closeDocument(openedDocument);
                            }).then(function () {
                                expect(projectController.currentDocument).toBe(barDocument);
                            });
                    });

                    it("should not hide the editor when closed and a document remains", function () {
                        spyOn(editorController, "hideEditors");

                        return projectController.openUrlForEditing(fooDocument.url).then(function () {
                            return projectController.closeDocument(barDocument);
                        }).then(function () {
                            expect(editorController.hideEditors).not.toHaveBeenCalled();
                        });
                    });

                });

                describe("and is the current document", function () {

                    it("should leave the next document in order open if there is one", function () {
                        return projectController.openUrlForEditing(fooDocument.url).then(function () {
                            return projectController.closeDocument(fooDocument);
                        }).then(function () {
                            expect(projectController.currentDocument).toBe(barDocument);
                        });
                    });

                    //TODO move out the determination of "next" document out to its own spec
                    it("should leave the previous document in order open if this was the last document", function () {
                        return projectController.openUrlForEditing(barDocument.url).then(function () {
                            return projectController.closeDocument(barDocument);
                        }).then(function () {
                            expect(projectController.currentDocument).toBe(fooDocument);
                        });
                    });

                });

            });

            describe("being the only document open", function () {

                it("should leave no document as the current document if there are no other documents to open", function () {
                    return projectController.openUrlForEditing(openedDocument.url).then(function () {
                        return projectController.closeDocument(openedDocument);
                    }).then(function () {
                        expect(projectController.currentDocument).toBeNull();
                    });
                });
            });

            describe("that is in the process of being closed", function () {

                it("must return a promise for document being closed", function () {
                    var firstClosePromise =  projectController.closeDocument(openedDocument);
                    var secondClosePromise = projectController.closeDocument(openedDocument);
                    expect(secondClosePromise).toBe(firstClosePromise);
                    firstClosePromise.done();
                    secondClosePromise.done();
                });

                it("must return a promise for document being closed", function () {
                    return Promise.all([
                        projectController.closeDocument(openedDocument),
                        projectController.closeDocument(openedDocument)
                    ]).spread(function (firstDocument, secondDocument) {
                        expect(secondDocument).toBe(openedDocument);
                        expect(secondDocument).toBe(firstDocument);
                    });
                });

            });

        });

    });

});
