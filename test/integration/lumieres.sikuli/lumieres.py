from sikuli import *

# Find the Lumieres welcome screen and click on it to bring it to the front
def focusLumieres():
    if exists("1379460790475.png"):
        click(getLastMatch())
    else:
        print "Could not find Lumieres Welcome Screen"

# Create a new application
def makeNewApplication(name):
    #TODO not assume we have the welcome screen
    click("1371596763802.png")

    wait("1379462893447.png", 5)

    type("d", Key.META)
    type(name)
    type(Key.ENTER)
    
    if exists("1379462931252.png"):
        type(Key.SPACE)

    lumieresRegion = App.focusedWindow()

    # Wait for the application ot be ready to actually use
    lumieresRegion.wait(Pattern("1379476862102.png").similar(0.91), 20)
    lumieresRegion.wait("1379478367947.png", 20)
    lumieresRegion.wait("1379478388607.png", 20)

    return lumieresRegion 

# Save the current file
def save(useShortcut=False):
    if useShortcut:
        type(KeyModifier.CMD, "S")
    else:
        mainMenu = find("1379461140195.png").right()
        editMenuItem = mainMenu.find("1379462158739.png")
        click(editMenuItem)
        editMenu = editMenuItem.below(300).left(150).right(300)
        editMenu.click("1379462376737.png")               
    sleep(1)

# Define a new binding with the specified parameters
def bind(targetPath, oneway, sourcePath):
    sleep(1)
    checkboxBindingJig = find("1376294958706.png")
    checkboxBindingJig.inside().type(Pattern("1374616220841.png").targetOffset(0,6), targetPath)
    if (not oneway):
        checkboxBindingJig.inside().click("1371627538325.png")
    checkboxBindingJig.inside().type(Pattern("1374616197093.png").targetOffset(0,6), sourcePath)
    checkboxBindingJig.inside().click("1371627635301.png")
    sleep(1)