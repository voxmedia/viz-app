# Vizier

A GUI for ai2html projects. Vizier makes it easy to use the [New York Times' ai2html plugin for Adobe Illustrator](http://ai2html.org/).

#### How to use it

- [Download the most recent release](https://github.com/voxmedia/viz-app/releases).
- Make sure you adjust your [Mac OS X Gatekeeper settings to allow applications from anywhere](https://support.apple.com/en-us/HT202491).
- The first time you run the app, you will be prompted to install ai2html. This will replace any
previously installed ai2html.js script. If you installed Illustrator to a non-standard location
you may be asked to find the install folder.
- Open the preference panel to specify the default project folder (where Vizier
will try to create new projects). You will also need to provide AWS settings if
you plan to publish anything.
- Click new project. You will be prompted to specify a name and save the new
project. This will create a new folder containing an ai file and a `src` folder.
- Open the ai file by double clicking the project in Vizier.
- Make an awesome graphic.
- Run ai2html to export your graphic. File > Scripts > ai2html.
- By default ai2html will export every artboard. Ai2html looks at the pixel size
of every artboard and the artboard will be displayed if the window is large enough.
If you want to exempt an artboard from export, adjust the artboard name to begin
with a minus `-artboardname`.
- Once the ai2html export completes, return to Vizier, highlight the project
and click deploy.
- Once deploy is complete (green check will appear), right click on the project
and click copy embed code.
- Paste the embed code into your story and publish!

#### Caveats

Vizier's ai2html was originally customized for Vox.com and probably does not
support all the fonts you want to use. If you want your own fonts supported, you
may have to fork and customize this app. If there are standard web fonts, or
free fonts you would like to use, open a github issue to ask for the font to
be added.

#### Developing

This app uses Electron, Vue.js. Recommend using `yarn` instead of `npm`.

Clone this repo, then:

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:9080
yarn run dev

# build electron application for production
yarn run build

# run unit & end-to-end tests
yarn test

# lint all JS/Vue component files in `src/`
yarn run lint
```

#### Contributing

Fork this repo, create a new branch on your fork, and make your changes there.
Open a pull request on this repo for consideration.

If its a small bugfix, feel free making the changes and opening a PR. If it's a
feature addition or a more substantial change, please open a github issue
outlining the feature or change. This is just to save you time and make sure
your efforts can get aligned with other folks' plans.

#### Customizing

You can produce custom builds of Vizier for yourself or your colleagues.

Replace or customize the included ai2html script in `static/ai2htmljs`. Most of
the settings are configured to work with Vizier, but you will probably want to
adjust the font settings to include fonts that you plan to use in your graphics.

Replace or customize the default layout in `static/project-template/src/layout.ejs`.
This file is used to wrap the html output of ai2html. It includes css to load
custom webfonts and js to enable image lazyloading and hiding/showing artboards based on
the window size. The js also sets up the page to do iframe resizing with pym.js and
AMP.

You may want to adjust the embed code format. You can adjust that in the file
`src/main/embedcode.js`.

Finally change the version in `package.json` and append your organization name.
It should look something like `1.0.0-orgname` or `1.0.0-orgname.1`. You may want to disable
autoupdate by commenting out the lines at the end of `src/main/index.js`.

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[7c4e3e9](https://github.com/SimulatedGREG/electron-vue/tree/7c4e3e90a772bd4c27d2dd4790f61f09bae0fcef) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
