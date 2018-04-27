# Changelog for Viz.app

## 1.0.0-beta.4

* Fix deploy not updating html files sometimes

## 1.0.0-beta.3

* Support for opening existing projects
* Drag project folders to the project list to add a project
* Added Mac OS X menu option File -> Open
* Add validation to make sure no projects are created or added with and existing
  title or project path
* Handle accidental drag and drops to other parts of the GUI
* Enable autoupdate through S3

## 1.0.0-beta.2

* Safari bugfixes for the embed. changes in layout.ejs

## 1.0.0-beta.1

* Inital release
* Mac OS X support
* Incomplete Windows support
* Experimental autoupdate support
* Install custom included ai2html script to local Adobe Illustrator install
* ai2html script install or update detection, prompting
* Create new project: scaffold out a project folder
* Delete a project: remove from app and/or delete local files
* Building a project from ai2html output and scaffolded layout.ejs
* Deploy a project to S3
