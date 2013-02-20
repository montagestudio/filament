var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-spec", function () {

    var bridge, viewController, projectController, mockMenu, newComponentMenuItem, newModuleMenuItem;

    beforeEach(function () {
        mockMenu = menuMock({
            menuItems: {
                "newComponent": (newComponentMenuItem = Montage.create()),
                "newModule": (newModuleMenuItem = Montage.create())
            }
        });

        bridge = environmentBridgeMock({
            mainMenu: mockMenu
        });

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController);
    });

    describe("creating new components", function () {

        it("must have the newComponent menuItem disabled without an open project while key", function () {
            expect(newComponentMenuItem.enabled).toBeFalsy();
        });

        it("must have the newComponent menuItem disabled with an open project but not being key", function () {
            return projectController.loadProject("projectUrl").then(function () {
                projectController.didResignKey();
                expect(newComponentMenuItem.enabled).toBeFalsy();
            });
        });

        it("should have the newComponent menuItem enabled with an open project while key", function () {
            return projectController.loadProject("projectUrl").then(function () {
                expect(newComponentMenuItem.enabled).toBeTruthy();
            });
        });

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

        it("must have the newModule menuItem disabled without an open project while key", function () {
            expect(newModuleMenuItem.enabled).toBeFalsy();
        });

        it("must have the newModule menuItem disabled with an open project but not being key", function () {
            return projectController.loadProject("projectUrl").then(function () {
                projectController.didResignKey();
                expect(newModuleMenuItem.enabled).toBeFalsy();
            });
        });

        it("should have the newModule menuItem enabled with an open project while key", function () {
            return projectController.loadProject("projectUrl").then(function () {
                expect(newModuleMenuItem.enabled).toBeTruthy();
            });
        });

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
