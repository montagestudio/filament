require("montage-testing").run(require, [
    // Please keep in alphabetical order

    //"test/blueprint-inspector/blueprint-inspector-spec", // This suite is completely broken

    "test/core/document-spec",
    "test/core/editing-document-spec",
    "test/core/document-controller-spec",
    "test/core/editing-proxy-spec",
    "test/core/template-formatter-spec"

    // "test/ui/editing-frame-spec" // Also out of date
]);
