var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    editorMock = require("test/mocks/editor-mocks").editorMock,
    editorControllerMock = require("test/mocks/editor-controller-mocks").editorControllerMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-spec", function () {

    var bridge, viewController, editorController, projectController, mockMenu, textUrl, reelUrl,
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

        editorController = editorControllerMock();

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController, editorController);
    });

    describe("canEdit status", function () {

        it("must not be considered editable when it has no project loaded", function () {
            expect(projectController.canEdit).toBeFalsy();
        });

        it("should be considered editable when it has a loaded project", function () {
            return projectController.loadProject("url").then(function () {
                expect(projectController.canEdit).toBeTruthy();
            });
        });

    });

});
