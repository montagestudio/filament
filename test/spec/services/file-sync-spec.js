var FileSyncService = require("filament/services/file-sync").FileSyncService;

describe("core/file-sync-spec", function() {
    it("should return false if displayed and model contents do not match", function() {
        var document = {
            isDirty: false,
            content: 'FOO',
            codeMirrorDocument: {
                getValue: function() {
                    return 'BAR';
                }
            }
        };
        var service = new FileSyncService();

        expect(service.isInSync(document)).toBeFalsy();
    });

    it("should return true if displayed and model contents match", function() {
        var document = {
            isDirty: false,
            content: 'FOO',
            codeMirrorDocument: {
                getValue: function() {
                    return 'FOO';
                }
            }
        };
        var service = new FileSyncService();

        expect(service.isInSync(document)).toBeTruthy();
    });

    it("should return true if document is already marked as dirty", function() {
        var document = {
            isDirty: true,
            content: 'FOO',
            codeMirrorDocument: {
                getValue: function() {
                    return 'BAR';
                }
            }
        };
        var service = new FileSyncService();

        expect(service.isInSync(document)).toBeTruthy();
    });
});
