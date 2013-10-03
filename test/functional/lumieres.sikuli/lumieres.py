from sikuli import *
import logging
import math

# Find the Lumieres welcome screen and click on it to bring it to the front
def focusLumieres():
    try:
        click("1379460790475.png")
    except FindFailed, exception:
        logging.error("Could not find Lumieres Welcome Screen")
        raise exception

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

    # Wait for the application to be ready to actually use
    try:
        lumieresRegion.wait(Pattern("1379476862102.png").similar(0.91), 10)
    except FindFailed, exception:
        logging.error("Failed to find application created success message")
        raise exception

    try:
        lumieresRegion.wait("1379478367947.png", 10)
    except FindFailed, exception:
        logging.error("Failed to find opened main component in templateExplorer")
        raise exception

    try:
        lumieresRegion.wait("1380777365223.png", 10)
    except FindFailed, exception:
        logging.error("Failed to find expected DOM tree in DomExplorer")
        raise exception

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
    
def insertDomObject(object, targetNode, relationship="self"):
    drag(object)
    hover(targetNode)

    if ("child" == relationship):
        destination = Pattern("1380777706858.png").similar(0.95)
    elif ("next" == relationship):
        destination = Pattern("1380777751082.png").similar(0.95)
    elif ("previous" == relationship):
        destination = Pattern("1380777788841.png").similar(0.95)
    else:
        destination = targetNode
        
    dropAt(destination)

def resizeDomExplorerY(distance):
    divider = find("1380836949088.png").nearby(100).above().find("1380836989677.png")
    drag(divider)

    triggerDragDistance = 5

    if (distance < 0):
        triggerDragDistance = -5
    
    triggerDragTarget = divider.getTarget().offset(0, triggerDragDistance)
    mouseMove(triggerDragTarget)

    destination = divider.getTarget().offset(0, int(distance - math.fabs(triggerDragDistance)))
    dropAt(destination)
    