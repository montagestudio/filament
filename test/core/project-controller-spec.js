var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    editorControllerMock = require("test/mocks/editor-controller-mocks").editorControllerMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise;

describe("core/project-controller-spec", function () {

    var bridge, viewController, editorController, projectController, mockMenu;

    beforeEach(function () {
        mockMenu = menuMock({
            menuItems: {
                "newComponent": Montage.create(),
                "newModule": Montage.create()
            }
        });

        bridge = environmentBridgeMock({
            list: function() {
                return Promise([]);
            },
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
