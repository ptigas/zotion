all:
	rm -f zotion.xpi
	zip -r zotion.xpi chrome/* defaults/* chrome.manifest install.rdf

clean:
	rm -f zotion.xpi