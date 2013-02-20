var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-spec", function () {

    var bridge, viewController, projectController, mockMenu;

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
        projectController = ProjectController.create().init(bridge, viewController);
    });

    describe("creating new components", function () {

        it("must not create a component without an open project", function () {
            expect(function () { projectController.createComponent(); }).toThrow();
        });

        it("should try to create components inside the 'ui' directory", function () {
            return projectController.loadProject("projectUrl").then(function () {

                spyOn(bridge, "promptForSave").andCallFake(function (options) {
                    expect(options.defaultDirectory).toMatch(/\/ui$/);
                    return Promise.resolve();
                });

                return projectController.createComponent();
            }).then(function () {
                expect(bridge.promptForSave).toHaveBeenCalled();
            }).timeout(WAITSFOR_TIMEOUT);
        });
    });

    describe("creating modules", function () {

        it("must not create a module without an open project", function () {
            expect(function () { projectController.createModule(); }).toThrow();
        });

        it("should try to create components inside the 'core'' directory", function () {
            return projectController.loadProject("projectUrl").then(function () {

                spyOn(bridge, "promptForSave").andCallFake(function (options) {
                    expect(options.defaultDirectory).toMatch(/\/core$/);
                    return Promise.resolve();
                });

                return projectController.createModule();
            }).then(function () {
                    expect(bridge.promptForSave).toHaveBeenCalled();
                }).timeout(WAITSFOR_TIMEOUT);
        });
    });

});
