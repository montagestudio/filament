def findLumieres():
    if exists("1371596756905.png"):
        click(getLastMatch())

    elif exists(Pattern("1371597952876.png").similar(0.66)):
        doubleClick(Pattern("1371625485554.png").targetOffset(-9,0))
    
    elif exists("1371599372730.png"):
        doubleClick(Pattern("1371625510803.png").targetOffset(-8,-1))

#TODO use cmd-s to save, or have an option to do so
def save():
    click("1371628194913.png")
    click("1371628226102.png")
    sleep(1)

#TODO make a method for binding

# Begin Actual Application

findLumieres()

# Create a new application
click("1371596763802.png")

wait("1371769499689.png", 10)

lumieresRegion = getLastMatch().nearby(2)

type("d", Key.META)
type("todo")
type(Key.ENTER)
if exists("1371598405282.png"):
    overwriteSheet = getLastMatch()
    overwriteSheet.nearby(100).click("1371598422707.png")
    waitVanish(overwriteSheet, 2)           

sleep(2)
lumieresRegion.wait("1372143361142.png", 20)
explorer = lumieresRegion.find(Pattern("1371631581983.png").similar(0.60)).below(500)
explorer.click(Pattern("1371631430977.png").similar(0.88).targetOffset(-23,1))

explorer.wait("1371597025466.png")
explorer.click(Pattern("1371597060927.png").targetOffset(-26,-2))

sleep(1)

# Remove the placeholder text

hover("1371599934383.png")
click(Pattern("1371599999573.png").targetOffset(23,0))
templateExplorer = lumieresRegion.find("1372141940872.png")

digitPackageRegion = lumieresRegion.find("1372142584813.png")
# Add a title
dragDrop(digitPackageRegion.find(Pattern("1372142022209.png").similar(0.81)), "1371600526337.png")

wait(Pattern("1371600653629.png").targetOffset(20,12), 3)
doubleClick(getLastMatch())

type("Things Worth Doing")

# Add a rangeController to manage the collection of the owner's tasks

dragDrop(Pattern("1372142743355.png").similar(0.86), templateExplorer)


#TODO this is a temporary thing to create an array in the declaration
#TODO ideally this would rely on a binding to the @owner.tasks, but we have no UI to set that property right now
rangeControllerInspector = find("1371745473281.png").below()
rangeControllerInspector.find("1371745547975.png").right(100).nearby(10).click("1371745557967.png")
# Remove the default content, we want an empty list
rangeControllerInspector.click(Pattern("1371770852843.png").targetOffset(59,13))


# Add a list to present the tasks

dragDrop(digitPackageRegion.find(Pattern("1372142855514.png").exact()), Pattern("1371600794675.png").targetOffset(-60,7))

#Remove the placeholder list content
click("1371601059276.png")

#Set the list to receive its content from the rangeController we created
dragDrop(templateExplorer.find(Pattern("1372134591642.png").targetOffset(-57,2)), "1371601115096.png")

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

explorer.click(Pattern("1371631748330.png").exact().targetOffset(-22,0))

sleep(1)

explorer.wait("1371626266866.png", 1)
explorer.click(Pattern("1371626282274.png").targetOffset(-7,18))

wait("1371626327890.png", 2)

#Add a checkbox to complete tasks
dragDrop("1371626348331.png", "1371626362160.png")
checkboxCard = find("1371626902768.png")

# Bind the checkbox to the task's completed state
checkboxCard.inside().click("1371626918284.png")

sleep(1)

checkboxBindingJig = find("1372142979561.png")
checkboxBindingJig.inside().type("1372142993066.png", "checked")
checkboxBindingJig.inside().click("1371627538325.png")
checkboxBindingJig.inside().type("1372143003066.png", "@owner.task.completed")
checkboxBindingJig.inside().click("1371627635301.png")

sleep(1)


# Add a textfiled to edit the title of the task
dragDrop("1372143026732.png", Pattern("1371627827353.png").targetOffset(-5,-9))

taskTitleCard = find("1372143983577.png")
taskTitleCard.inside().click("1371627930530.png")
taskTitleBindingJig = find("1372143970651.png")

taskTitleBindingJig.inside().type(Pattern("1372144274781.png").similar(0.95).targetOffset(1,10), "value")
taskTitleBindingJig.inside().click("1371628013900.png")
taskTitleBindingJig.inside().type(Pattern("1372144393393.png").exact().targetOffset(0,8), "@owner.task.title")
taskTitleBindingJig.inside().click("1371628091766.png")

sleep(1)

#save this component so we can use it in the main component

save()    

#switch back to the main component

click("1371628279454.png")

sleep(2)
#add our task component to the list
dragDrop(Pattern("1371628340381.png").similar(0.73).targetOffset(1,-6), Pattern("1371632573099.png").targetOffset(-33,10))
sleep(1)

taskCard = find("1372143831108.png")
taskCard.inside().click("1371628453231.png")

sleep(1)

#bind the task property of the task component to the list's current iteration

taskBindingJig = find("1372143651028.png")

taskBindingJig.inside().type(Pattern("1372143661856.png").targetOffset(-4,9), "task")
sourceField = taskBindingJig.inside().find(Pattern("1372143672054.png").targetOffset(-3,8))
dragDrop(Pattern("1371628641092.png").targetOffset(-18,2), sourceField)

click(sourceField)
type(".objectAtCurrentIteration")

taskBindingJig.inside().click("1371628814715.png")


save()

#Add a new task button
dragDrop("1371708733359.png", "1371708794806.png")
doubleClick("1371708858768.png")
type("New Task")

#add an actionEventListener to call the addContent method on the rangeController

dragDrop("1371708937502.png", "1371708956807.png")
dragDrop(Pattern("1372143781851.png").targetOffset(-58,2), "1371709006343.png")
type("1371709026331.png", "addContent")

# Add the actionEventListener as listener of new Task button

wheel("1371710306724.png", WHEEL_DOWN, 50)
click(Pattern("1371710345995.png").targetOffset(205,21))

type(Pattern("1371710393901.png").targetOffset(-1,7), "action")
dragDrop(Pattern("1372134859539.png").targetOffset(-59,2), Pattern("1371710422598.png").targetOffset(4,4))
click("1371710441914.png")

#add a badge to count the remaining tasks
dragDrop("1371711022203.png", "1371711073673.png")

wheel("1371711149027.png", WHEEL_DOWN, 50)
click(Pattern("1371711173305.png").targetOffset(201,8))

badgeBindingJig = find("1372144621810.png")

badgeBindingJig.inside().type(Pattern("1372143709362.png").exact().targetOffset(-1,3), "value")
badgeBindingJig.inside().type(Pattern("1372143725807.png").exact().targetOffset(-4,8), "@rangeController1.organizedContent.filter{!completed}.length")
badgeBindingJig.inside().click("1371628091766.png")

save()

#TODO insert incomplete count
#TODO insert completed toggle
#TODO insert hr's for formatting
#TODO wire up a remove button






























