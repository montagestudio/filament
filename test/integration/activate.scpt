tell application "System Events"
	set runningCount to count (every process whose name is "Lumieres")
	
	if runningCount > 0 then
		tell application id "com.declarativ.Lumieres" to activate
	end if
end tell
