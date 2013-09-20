import lumieres
reload(lumieres)

lumieres.focusLumieres();
lumieresRegion = lumieres.makeNewApplication("focus")

click(Pattern("1379635114233.png").targetOffset(62,2))

browserLaunched = False
maxAttemptCount = 10
attemptCount = 0

while not browserLaunched or attemptCount > maxAttemptCount:
    sleep(1)
    attemptCount = attemptCount + 1
    browserRegion = App.focusedWindow()
    browserLaunched = (
            lumieresRegion.w != browserRegion.w or
            lumieresRegion.h != browserRegion.h or
            lumieresRegion.x != browserRegion.x or
            lumieresRegion.y != browserRegion.y)
    
type(Key.TAB, Key.META)

dragDrop("1379636068715.png", "1379636076570.png")
lumieres.save()
wait(browserRegion.find("1379636165608.png"))
