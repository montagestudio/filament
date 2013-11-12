var moduleId = window.stageData.moduleId,
    packageUrl = window.stageData.packageUrl;


if (packageUrl && moduleId) {

    var _findObjectNameRegExp = /([^\/]+?)(\.reel)?$/;
    var _toCamelCaseRegExp = /(?:^|-)([^-])/g;
    var _replaceToCamelCase = function (_, g1) {
        return g1.toUpperCase();
    };

    _findObjectNameRegExp.test(moduleId);
    var objectName = RegExp.$1.replace(_toCamelCaseRegExp, _replaceToCamelCase),
        ownerComponent;

    // Load the specified package
    require.loadPackage(packageUrl)
        .then(function (packageRequire) {
            return packageRequire.async(moduleId);
        })
        .then(function (exports) {
            ownerComponent = exports[objectName].create();

            // Now with an instance of what will be our owner component,
            // we need a reference to the rootComponent
            //TODO would we rather do this ahead of time?
            return require.async("montage/ui/component");
        })
        .then(function (exports) {
            //jshint -W106
            var rootComponent = exports.__root__;
            //jshint +W106

            //TODO how do we know what kind of element to use?
            ownerComponent.element = document.createElement("div");
            ownerComponent.setElementWithParentComponent(ownerComponent.element, rootComponent);
            document.body.appendChild(ownerComponent.element);
            ownerComponent.ownerComponent = rootComponent;
            ownerComponent.attachToParentComponent(rootComponent);

            document.title = objectName + " (" + moduleId + ") - Stage";

            ownerComponent.needsDraw = true;

            //TODO better communicate that the ownerComponent is available
            ownerComponent.addEventListener("firstDraw", function () {
                window.stageData.ownerComponent = ownerComponent;

                // Palette expects to be told when the stage is ready with a drawn component
                // that can be interacted with
                if (window.parent) {
                    window.parent.postMessage("componentReady", "*");
                }
            });
        })
        .done();
} else {
    document.title = packageUrl.substring(packageUrl.lastIndexOf("/") + 1);
    console.debug("Not enough information provided to load stage.");
}
