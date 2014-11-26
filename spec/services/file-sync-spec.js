var FileSyncService = require("../../services/file-sync").FileSyncService,
    Q = require("q");

describe("core/file-sync-spec", function() {
    it("should return false if displayed and model contents do not match", function(done) {
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

        service.isInSync(document)
            .then(function(isInSync) {
                expect(isInSync).toBeFalsy();
                done();
            });

    });

    it("should return true if displayed and model contents match", function(done) {
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

        service.isInSync(document)
            .then(function(isInSync) {
                expect(isInSync).toBeTruthy();
                done();
            });

    });

    it("should return true if document is already marked as dirty", function(done) {
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

        service.isInSync(document)
            .then(function(isInSync) {
                expect(isInSync).toBeTruthy();
                done();
            });

    });
});