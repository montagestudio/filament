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

#Remove the placeholder list content
lumieres.resizeDomExplorerY(-100)

# Add a title
lumieres.insertDomObject(digitPackageRegion.find(Pattern("1372142022209.png").similar(0.81)), "1380786943201.png", "child")

wait(Pattern("1371600653629.png").targetOffset(20,12), 3)
doubleClick(getLastMatch())

type("Things Worth Doing")

# Add a rangeController to manage the collection of the owner's tasks

dragDrop("1384285662628.png", templateExplorer)

# Add a list to present the tasks

lumieres.insertDomObject(digitPackageRegion.find("1372142855514.png"), "1380787051214.png", "next")

#Set the list to receive its content from the rangeController we created
dragDrop("1384285693714.png", Pattern("1379357187665.png").targetOffset(33,59))

#Add a new task button
lumieres.insertDomObject("1371708733359.png", "1380787319604.png", "next")
doubleClick("1371708858768.png")
type("New Task")

buttonCard = find("1379358342966.png")
buttonEvent = buttonCard.find("1376294601972.png").right().find("1376294614002.png")
rangeControllerCard = "1384285722421.png"
dragDrop(buttonEvent, rangeControllerCard)
type(Pattern("1380790176150.png").targetOffset(-1,8), "addContent")
click("1379358296330.png")

lumieres.save();

hover("1383083483378.png")
click(Pattern("1383083500744.png").similar(0.90).targetOffset(59,1))

lumieres.save();

# Create a component to encapsulate the presentation of a task in the list
#TODO why does click not work?
hover("1371601177036.png")
sleep(1)
mouseDown(Button.LEFT)
mouseUp(Button.LEFT)
wait("1371612473343.png", 2)
type("task")
click("1371601213234.png")
sleep(3)
wait(Pattern("1383083649632.png").similar(0.89), 2)
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
lumieres.insertDomObject(Pattern("1371628340381.png").similar(0.73).targetOffset(1,-6), Pattern("1383084062319.png").similar(0.90), "child")
sleep(1)

taskCard = find("1376295091372.png")
taskCard.find("1376294281054.png").right().click("1376294297971.png")

#bind the task property of the task component to the list's current iteration
lumieres.bind("task", True, "@list1.objectAtCurrentIteration")

lumieres.save()

#add a badge to count the remaining tasks
lumieres.insertDomObject("1371711022203.png", Pattern("1384286331253.png").similar(0.91), "previous")

badgeCard = find("1376295271102.png")
badgeCard.find("1376294281054.png").right().click("1376294297971.png")
lumieres.bind("value", True, "@rangeController1.organizedContent.filter{!completed}.length")

lumieres.save()

#TODO insert completed toggle
#TODO insert hr's for formatting
#TODO wire up a remove button






























