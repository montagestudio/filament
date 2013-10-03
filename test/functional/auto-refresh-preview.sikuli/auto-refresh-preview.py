import lumieres
reload(lumieres)

lumieres.focusLumieres();
lumieresRegion = lumieres.makeNewApplication("focus")

click(Pattern("1379635114233.png").targetOffset(62,2))

browserLaunched = False
maxAttemptCount = 10
attemptCount = 0
browserRegion = None

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

type(Key.TAB, Key.META)

#Edit the applications
lumieres.insertDomObject("1379636068715.png", "1379636076570.png", "child")
lumieres.save()

# Meanwhile, back in the browser we should see the result
type(Key.TAB, Key.META)
browserRegion.wait("1379636165608.png", 1)
