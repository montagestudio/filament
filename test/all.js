require.inject("adaptor/client/core/file-descriptor", require("./mocks/file-descriptor-mocks"));

require("montage-testing").run(require, [
    // Please keep in alphabetical order
    // "extensions/package-manager.filament-extension/test/package-document-spec.js",
    // "extensions/package-manager.filament-extension/test/package-tools-spec.js",
    // "test/core/asset-manager-spec",
    // "test/core/code-editor-document-spec",
    "test/core/document-data-source-spec",
    "test/core/entity-proxy-spec",
    "test/core/node-proxy-spec",
    // "test/core/object-references-spec",
    // "test/core/project-controller-extensions-spec",
    // "test/core/project-controller-file-spec",
    // "test/core/project-controller-filesystem-spec",
    // "test/core/project-controller-spec",
    "test/core/reel-blueprint-editing-spec",
    "test/core/reel-context-spec",
    "test/core/reel-document-selected-elements-spec",
    "test/core/reel-document-spec",
    "test/core/reel-proxy-spec",
    "test/core/tree-controller-spec",
    "test/core/url-spec",
    "test/ui/template-explorer/content/edit-properties-spec",

    // Specs broken due to some internal issue with Montage serialization visitors
    // "test/core/reel-document-headless-editing-spec",
    // "test/core/reel-document-listener-editing-spec",
    // "test/core/reel-document-proxy-serialization-spec",
    // "test/core/reel-document-saving-spec",
    // "test/core/reel-document-template-editing-spec",
]);
