def findLumieres():
    if exists("1371596756905.png"):
        click(getLastMatch())

    elif exists(Pattern("1371597952876.png").similar(0.66)):
        doubleClick(Pattern("1371625485554.png").targetOffset(-9,0))
    
    elif exists("1371599372730.png"):
        doubleClick(Pattern("1371625510803.png").targetOffset(-8,-1))

# Begin Actual Application

findLumieres()

# Create a new application
click("1371596763802.png")

wait("1371769499689.png", 10)

lumieresRegion = getLastMatch().nearby(2)

type("d", Key.META)
type("SIKULI-package-manager-test")

lumieresRegion.click("1371596907226.png")
if exists("1372109195387.png"):
    overwriteSheet = getLastMatch()
    overwriteSheet.nearby(100).click("1371598422707.png")
    waitVanish(overwriteSheet, 2)           

sleep(2)
lumieresRegion.wait("1372108987838.png", 20)
explorer = lumieresRegion.find("1372109004734.png").below(500)
explorer.click(Pattern("1372109107321.png").exact().targetOffset(-37,2))
lumieresRegion.wait("1372109150425.png", 5)
