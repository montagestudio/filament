Filament
========

Filament is the Montage Builder Web Application. It lives inside the Lumieres
shell and relies on the Palette library to enable users to build components
and assemble applications.

While most of the mechanics of editing is handled by the Palette library,
Filament presents the components from Palette in a useful manner. Filament
also serves as an extensible authoring platform that can accommodate loading
new functionality form packages provided at runtime.

Components and other other modules may start in Filament initially and end
up migrating to Palette for sharing with others, as necessary.

The Filament source code itself is not intended for public distribution.

While Filament may detect it's environment and adapt as necessary, it is
intended to be run inside Lumieres; though care should be taken to not assume
anything, lest it become difficult to accommodate future host environments.

Installation
============
1. Clone Filament
2. Build a Development build of Lumieres (See Lumieres Repository)

Testing
=======
`npm test` Tests server side portions of Filament
`FILAMENT_URL/run-tests.html` Tests the client-side portions of Filament

Functional Tests
=================
1. Install sikuli http://www.sikuli.org/index.html (You'll want Pack 1 and Pack 2) installed seperately)
3. Set an environment variable $SIKULI to point to the `runScript` built by the Sikuli installer
4. Set an environment variable $LUMIERES to point to the `Lumieres` binary inside the `Lumieres.app` bundle
5. Run the integration tests using `npm run lumieres`

You can also run individual tests manually or via the sikuli IDE

Contributing
============
- Run `jshint` on your code to ensure it conforms to Filament standards

- Make sure all commit messages follow the 50 character subject/72 character
body [formatting used throughout git](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)

- Make sure commit messages start with uppercase present tense commands
e.g. Prefer "Clear selection when clicking templateExplorer" over
"Cleared selection when clicking templateExplorer"

- When adding or updating dependencies list the EXACT version of the dependency
to minimize differences when building at different times.
i.e. treat package.json as a shrinkwrapped dependency specifier

Updating dependencies
=====================

To update a single dependency follow these steps:

* Change the version in `package.json`
* Remove that dependency from `node_modules`: `rm -rf node_modules/<name>`
* Run `npm run package-deps`
* The changes will be staged. Test and commit.

There are also two other commands:

* `npm run package-deps-clean`, to remove `node_modules` and install all dependencies again.
* `npm run package-deps-update`, to run `npm update`.

Debugging with Beacon
=====================
Open `http://localhost:9222` with your favourite browser, you should find a list of all open Beacon/Lumiere windows.