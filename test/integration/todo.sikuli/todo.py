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
wait("1371596821051.png", 10)
type("d", Key.META)
type("todo")

click("1371596907226.png")
if exists("1371598405282.png"):
    overwriteSheet = getLastMatch()
    overwriteSheet.nearby(100).click("1371598422707.png")
    waitVanish(overwriteSheet, 2)           

wait("1371596971575.png", 20)
sleep(1)
explorer = find(Pattern("1371631581983.png").similar(0.60))
explorer.below(500).click(Pattern("1371631430977.png").similar(0.88).targetOffset(-23,1))

wait("1371597025466.png")
click(Pattern("1371597060927.png").targetOffset(-26,-2))

sleep(1)

# Remove the placeholder text

hover("1371599934383.png")
click(Pattern("1371599999573.png").targetOffset(23,0))

# Press and hold to toggle the library open
wait(Pattern("1371599767730.png").similar(0.89), 2)

hover(Pattern("1371599860465.png").targetOffset(10,24))

mouseDown(Button.LEFT)
sleep(3)
mouseUp(Button.LEFT)

# Add a title

dragDrop("1371600498976.png", "1371600526337.png")
doubleClick(Pattern("1371600653629.png").targetOffset(20,12))
type("Things Worth Doing")

dragDrop("1371600714176.png", "1371600751835.png")

# Add a rangeController to manage the collection of the owner's tasks

rangeControllerCard = find("1371630604848.png")
rangeControllerCard.inside().click("1371630630447.png")

bindingJig = find("1371630762945.png")
bindingJig.inside().type("1371630794567.png", "content")
bindingJig.inside().type("1371630820987.png", "@owner.tasks")
bindingJig.inside().click("1371630842870.png")

# Add a list to present the tasks

dragDrop("1371600782704.png", Pattern("1371600794675.png").targetOffset(-60,7))

# TODO there's no list component in place, this next step is temporary

dragDrop("1371600919841.png", Pattern("1371632397402.png").targetOffset(14,-16))
hover("1371601037797.png")
#Remove the placeholder list content
click("1371601059276.png")

#Set the list to receive its content from the rangeController we created
dragDrop(Pattern("1371601090297.png").targetOffset(-60,-23), "1371601115096.png")

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

explorer.below(500).click(Pattern("1371631748330.png").exact().targetOffset(-22,0))

sleep(1)

wait("1371626266866.png", 1)
click(Pattern("1371626282274.png").targetOffset(-7,18))

wait("1371626327890.png", 2)

#Add a checkbox to complete tasks
dragDrop("1371626348331.png", "1371626362160.png")
checkboxCard = find("1371626902768.png")

# Bind the checkbox to the task's completed state
checkboxCard.inside().click("1371626918284.png")

sleep(1)

checkboxBindingJig = find("1371627465823.png")
checkboxBindingJig.inside().type("1371627497475.png", "checked")
checkboxBindingJig.inside().click("1371627538325.png")
checkboxBindingJig.inside().type(Pattern("1371627577807.png").targetOffset(-1,8), "@owner.task.completed")
checkboxBindingJig.inside().click("1371627635301.png")

sleep(1)


# Add a textfiled to edit the title of the task
dragDrop("1371709458142.png", Pattern("1371627827353.png").targetOffset(-5,-9))

taskTitleCard = find("1371709574949.png")
taskTitleCard.inside().click("1371627930530.png")
taskTitleBindingJig = find("1371709621783.png")

taskTitleBindingJig.inside().type("1371627997603.png", "value")
taskTitleBindingJig.inside().click("1371628013900.png")
taskTitleBindingJig.inside().type(Pattern("1371629918488.png").targetOffset(19,5), "@owner.task.title")
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

taskCard = find("1371628434865.png")
taskCard.inside().click("1371628453231.png")

sleep(1)

#bind the task property of the task component to the list's current iteration

taskBindingJig = find("1371628482036.png")

taskBindingJig.inside().type("1371628516679.png", "task")
sourceField = taskBindingJig.inside().find(Pattern("1371628597662.png").targetOffset(13,9))
dragDrop(Pattern("1371628641092.png").targetOffset(-18,2), sourceField)

click(sourceField)
type(".objectAtCurrentIteration")

taskBindingJig.inside().click("1371628814715.png")


save()

#click(Pattern("1371628769466.png").targetOffset(71,3))

#Add a new task button
dragDrop("1371708733359.png", "1371708794806.png")
doubleClick("1371708858768.png")
type("New Task")

#add an actionEventListener to call the addContent method on the rangeController

dragDrop("1371708937502.png", "1371708956807.png")
dragDrop(Pattern("1371709357887.png").targetOffset(-54,-1), "1371709006343.png")
type("1371709026331.png", "addContent")

# Add the actionEventListener as listener of new Task button

wheel("1371710306724.png", WHEEL_DOWN, 50)
click(Pattern("1371710345995.png").targetOffset(205,21))

type("1371710393901.png", "action")
dragDrop(Pattern("1371710416220.png").targetOffset(-61,-1), "1371710422598.png")
click("1371710441914.png")

#add a badge to count the remaining tasks
dragDrop("1371711022203.png", "1371711073673.png")

wheel("1371711149027.png", WHEEL_DOWN, 50)
click(Pattern("1371711173305.png").targetOffset(201,8))

badgeBindingJig = find("1371709621783.png")

badgeBindingJig.inside().type("1371627997603.png", "value")
badgeBindingJig.inside().type(Pattern("1371629918488.png").targetOffset(19,5), "@rangeController1.organizedContent.filter{!completed}.length")
badgeBindingJig.inside().click("1371628091766.png")

save()

#TODO insert incomplete count
#TODO insert completed toggle
#TODO insert hr's for formatting
#TODO wire up a remove button






























