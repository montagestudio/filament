Filament
========

Filament is the Montage editing application. It lives inside the lumieres shell
and relies on the palette library to enable users to build components and
compose applications.

While most of the mechanics of editing is handled by the palette library filament
presents the components from palette in a useful manner. Components and other
other prototypes may start in filament initially and end up migrating to palette
for sharing with others.

The filament source code itself is not intended for public distribution.

While filament may detect it's environment and adapt as necessary, it is intended
to be run inside lumieres; though care should be taken to not assume anything.

To run filament you'll need to provide the following dependencies:

node_modules/montage
node_modules/palette

You'll probably fulfill these with symlinks to your local repositories.
Other dependencies can be fulfilled by running: npm install