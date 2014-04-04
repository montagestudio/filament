var environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    editorControllerMock = require("test/mocks/editor-controller-mocks").editorControllerMock,
    extensionControllerMock = require("test/mocks/extension-controller-mocks").extensionControllerMock,
    applicationDelegateMock = require("test/mocks/application-delegate-mocks").applicationDelegateMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise;

describe("core/project-controller-extensions-spec", function () {

    var bridge, viewController, editorController, projectController, extensionController, applicationDelegate;

    beforeEach(function () {
        bridge = environmentBridgeMock({
            list: function() {
                return Promise([]);
            },
            componentsInPackage: function () {
                return Promise(["projectUrl/ui/pass.reel"]);
            },
            getExtensionsAt: function () {
                return Promise([{url: "fs:///projectUrl/projectUrl.filament-extension"}]);
            }
        });

        editorController = editorControllerMock();

        extensionController = extensionControllerMock();

        applicationDelegate = applicationDelegateMock();

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController, editorController, extensionController, null, applicationDelegate);
        projectController._deferredPackageRequireLoading.resolve();

        require.injectPackageDescription(require.location + "projectUrl/" , {
            name: "test"
        });
    });

    it("loads extensions in the package", function () {
        spyOn(extensionController, "loadExtension").andCallThrough();

        return projectController.loadProject("projectUrl").then(function () {
            expect(extensionController.loadExtension).toHaveBeenCalled();
            expect(extensionController.loadExtension.mostRecentCall.args[0]).toBe("fs:///projectUrl/projectUrl.filament-extension");
        });
    });

});
