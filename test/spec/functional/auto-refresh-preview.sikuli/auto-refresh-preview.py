# This verifies that a preview in a user agent updates whenever the project is updated
# Precondition: The instance of lumieres you want to use is up and running with is welcome screen visible
# Postcondition: A project will be created, the default browser will be opened, the project will be
# updated, and the preview should reflect that without user intervention
import lumieres
reload(lumieres)

# Activate lumieres
lumieres.focusLumieres();
lumieresRegion = lumieres.makeNewApplication("focus")

#Open the preview
click(Pattern("1383084350025.png").targetOffset(77,3))

browserLaunched = False
maxAttemptCount = 10
attemptCount = 0
browserRegion = None

# Look for the browser
while not browserLaunched or attemptCount > maxAttemptCount:
    sleep(1)
    attemptCount = attemptCount + 1
    browserRegion = App.focusedWindow()
    browserLaunched = (
            lumieresRegion.w != browserRegion.w or
            lumieresRegion.h != browserRegion.h or
            lumieresRegion.x != browserRegion.x or
            lumieresRegion.y != browserRegion.y)
    if (not browserLaunched):
        browserRegion = None

if (not browserRegion):
    raise Exception("Could not find Browser")

# Switch back to Lumieres
type(Key.TAB, Key.META)

#Edit the application
lumieres.insertDomObject("1379636068715.png", "1379636076570.png", "child")
lumieres.save()

# Meanwhile, back in the browser we should see the result, switch to it and verify
type(Key.TAB, Key.META)
browserRegion.wait("1387523152393.png", 5)
