require.inject("filament/adaptor/client/core/file-descriptor", require("mocks/file-descriptor-mocks"));

require("montage-testing").run(require, [
    // Please keep in alphabetical order
    "filament/extensions/package-manager.filament-extension/test/package-document-spec",
    "filament/extensions/package-manager.filament-extension/test/package-tools-spec",
    "core/asset-manager-spec",
    "core/code-editor-document-spec",
    "core/document-data-source-spec",
    "core/node-proxy-spec",
    // "core/object-references-spec", // TODO: Broken. Investigate collections/set
    "core/project-controller-extensions-spec",
    "core/project-controller-file-spec",
    "core/project-controller-filesystem-spec",
    "core/project-controller-spec",
    "core/reel-blueprint-editing-spec",
    "core/reel-context-spec",
    "core/reel-document-selected-elements-spec",
    "core/reel-document-spec",
    "core/reel-proxy-spec",
    "core/tree-controller-spec",
    "core/url-spec",
    "ui/template-explorer/content/edit-properties-spec",

    // TODO: Specs broken due to some issue with Montage serialization visitors
    // "core/reel-document-headless-editing-spec",
    // "core/reel-document-listener-editing-spec",
    // "core/reel-document-proxy-serialization-spec",
    // "core/reel-document-saving-spec",
    // "core/reel-document-template-editing-spec",
]);
