tell application "System Events"
	set runningCount to count (every process whose name is "Lumieres")
	
	# NOTE simply telling Lumieres to quit doesn't work
	# https://code.google.com/p/chromium/issues/detail?id=44965
	
	if runningCount > 0 then
		tell application id "com.declarativ.Lumieres"
			activate
			tell application "System Events" to keystroke "q" using command down
		end tell
	end if
end tell
