# This will build the basic todo application
# Precondition: The instance of lumieres you want touse is up and running with is welcome screen visible
# Postcondition: A `todo` application will be successfully assembled on the desktop

import lumieres
reload(lumieres)

lumieres.focusLumieres();
lumieresRegion = lumieres.makeNewApplication("todo")
explorer = lumieresRegion.find(Pattern("1371631581983.png").similar(0.60)).below(500)
sleep(1)
templateExplorer = lumieresRegion.find("1376294075874.png")

digitPackageRegion = find("1372142584813.png")
# Add a title
lumieres.insertDomObject(digitPackageRegion.find(Pattern("1372142022209.png").similar(0.81)), "1380786943201.png", "child")

wait(Pattern("1371600653629.png").targetOffset(20,12), 3)
doubleClick(getLastMatch())

type("Things Worth Doing")

# Add a rangeController to manage the collection of the owner's tasks

dragDrop("1372142743355.png", templateExplorer)

# Add a list to present the tasks

lumieres.insertDomObject(digitPackageRegion.find("1372142855514.png"), "1380787051214.png", "next")

#Set the list to receive its content from the rangeController we created
dragDrop(Pattern("1379357122124.png").similar(0.51), Pattern("1379357187665.png").targetOffset(33,59))

#Remove the placeholder list content
hover("1380787922104.png")
click(Pattern("1379348525259.png").similar(0.54).targetOffset(43,0))

# Create a component to encapsulate the presentation of a task in the list
#TODO why does click not work?
click("1371601177036.png")
sleep(1)
mouseDown(Button.LEFT)
mouseUp(Button.LEFT)
wait("1371612473343.png", 2)
type("task")
click("1371601213234.png")
sleep(1)
explorer.wait("1371626266866.png", 1)
wait("1376294233084.png", 2)
#Add a checkbox to complete tasks
lumieres.insertDomObject("1371626348331.png", "1380787145595.png", "child")
checkboxCard = find("1376294261916.png")

# Bind the checkbox to the task's completed state
checkboxCard.inside().find("1376294281054.png").right().click("1376294297971.png")
lumieres.bind("checked", False, "@owner.task.completed")

# Add a textfiled to edit the title of the task
lumieres.insertDomObject("1372143026732.png", "1380787195094.png", "next")

taskTitleCard = find("1376294350349.png")
taskTitleCard.inside().find("1376294281054.png").right().click("1376294297971.png")
lumieres.bind("value", False, "@owner.task.title")


#save this component so we can use it in the main component

lumieres.save()    

#switch back to the main component

click("1371628279454.png")

sleep(2)
#add our task component to the list
lumieres.insertDomObject(Pattern("1371628340381.png").similar(0.73).targetOffset(1,-6), "1380787254026.png", "child")
sleep(1)

taskCard = find("1376295091372.png")
taskCard.find("1376294281054.png").right().click("1376294297971.png")

#bind the task property of the task component to the list's current iteration
lumieres.bind("task", True, "@list1.objectAtCurrentIteration")

lumieres.save()

#Add a new task button
lumieres.insertDomObject("1371708733359.png", "1380787319604.png", "next")
doubleClick("1371708858768.png")
type("New Task")

#add an actionEventListener to call the addContent method on the rangeController

dragDrop("1371708937502.png", templateExplorer)
wheel(templateExplorer, WHEEL_UP, 100)
dragDrop("1376294527604.png", "1371709006343.png")
type("1371709026331.png", "addContent")

# Add the actionEventListener as listener of new Task button

wheel(templateExplorer, WHEEL_DOWN, 100)

buttonCard = find("1379358342966.png")
buttonEvent = buttonCard.find("1376294601972.png").right().find("1376294614002.png")
actionListenerCard = "1379358548521.png"
dragDrop(buttonEvent, actionListenerCard)
click("1379358296330.png")

#add a badge to count the remaining tasks
lumieres.insertDomObject("1371711022203.png", "1380787370986.png", "next")

badgeCard = find("1376295271102.png")
badgeCard.find("1376294281054.png").right().click("1376294297971.png")
lumieres.bind("value", True, "@rangeController1.organizedContent.filter{!completed}.length")

lumieres.save()

#TODO insert completed toggle
#TODO insert hr's for formatting
#TODO wire up a remove button






























