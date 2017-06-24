Filament
========

Filament is the Montage Builder Web Application. It lives inside the Firefly
shell and relies on the Palette library to enable users to build components
and assemble applications.

Originally, Palette was intended as a container for the guts of the builder
application, such that third parties could build their own interfaces using
the core editing tools provided by Palette. Extracting such editing mechanics
so that third parties can build their own Filament-like applications is no
longer the goal, and new editing mechanics should be implemented in Filament
instead. Palette now primarily contains property inspectors, and other
functionality will be merged into Filament over time.

Palette may be useful in the future for providing reusable Filament interfaces,
so that users can build their own inspectors inside Montage Studio.

Filament also serves as an extensible authoring platform that can accommodate loading
new functionality form packages provided at runtime.

The Filament source code itself is not intended for public distribution.

Installation
============
1. Clone Filament
2. [Install a local Firefly environment](https://github.com/montagestudio/firefly)
3. Visit Montage Studio at https://local-aurora.montagestudio.com:2440

Developing
==========

Testing
-------
* `npm test` Tests functional portions of Filament inside a Node.js environment
* `npm run test:karma` Tests most client-side portions of Filament inside a Karma environment
* `npm run test:karma-dev` Same as above, but reruns every time the filesystem changes
* `minit serve &` and `FILAMENT_URL/test/run.html` Tests all client-side portions of Filament in the browser


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

Misc
====

Lumieres
--------
Lumieres was the old shell for Filament. It has since been deprecated in favor of Firefly, and is no longer maintained
or generally accessible. Filament should now live exclusively alongside Firefly, for both development and production.

Functional Tests
----------------
While Lumieres was the designated environment for Filament, the project contained integration tests run through
Sikuli. These tests have not been maintained and are likely impossible to run now that Lumieres has been deprecated.
The original instructions for running these tests are included below:

1. Install sikuli http://www.sikuli.org/index.html (You'll want Pack 1 and Pack 2) installed seperately)
3. Set an environment variable $SIKULI to point to the `runScript` built by the Sikuli installer
4. Set an environment variable $LUMIERES to point to the `Lumieres` binary inside the `Lumieres.app` bundle
5. Run the integration tests using `npm run lumieres`

You can also run individual tests manually or via the sikuli IDE
