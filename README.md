Portic storymaps 2021 : "Commerce multi-échelles autour du port de La Rochelle au XVIIIe siècle"
===

![Screenshot of the website](https://github.com/medialab/portic-storymaps-2021/raw/main/public/larochelle-rs.png)

This repository hosts the source code of PORTIC research program's first case study (see [PORTIC homepage](https://anr.portic.fr/) for more information). Built by an interdisciplinary team of historians, engineers and designers, it proposes a detailed study of the economic history of the region of La Rochelle (France) in 1789.

Through a series of three "storymaps" aiming at combining text and visualization, this publication aims at telling the story of the decline of La Rochelle port after France's loss of Canada during the seven years war, and the consequences of this event on the region's trade structure at the dawn of french revolution. It also features an atlas allowing to browse separately all the visualizations crafted during this research.

Data rests on the shoulder of two existing digital history projects : [Toflit18](http://toflit18.medialab.sciences-po.fr/#/home) and [navigo](http://navigocorpus.org/).

# Installation

```bash
yarn install
pip install -r requirements.txt
yarn data:update
```

# Development

```bash
yarn start
```

# Useful scripts

The project is provided with diverse scripts aiming at updating data and contents.

## Data-related scripts

```bash
yarn data:load # fetches data from toflit18 and navigo sources
yarn data:build # builds derivated datasets from complete data given by data:load script
yarn data:update # orchestrates data fetching and building, then destroys the temp data folder
```

## Updating the thumbnails

Thumbnails making for the `atlas` view is automated. To update thumbnails, **in two different terminal tabs**, run :

```bash
yarn start
```

Then run:

```bash
yarn run thumbnails:make
```

# Contributing

## Suggested guidelines for commiting the repository

- the `main` branch is the principal branch for the website version under development. Suggested workflow for contributing to the code is to develop new features in a separated branch, then to merge it in `main` branch when it is ready.

- it is suggested to use imperative tense verbs and explicit features/bugs mentions in commit messages

- it is suggested to reference related issue in commit messages (example of commit message : `improve radar viz #8`) in order to keep track of commits related to an improvement or problem in particular.


## Technical architecture of this repo in relation to data sources

![Schema of the project architecture](https://github.com/medialab/portic-storymaps-2021/raw/main/architecture_schema.png)
## Detailed presentation of the organization of the repository

```
- .github # contains automated deployment workflow
- datascripts # contains python scripts that fetch and build web-oriented datasets and contents, putting them in public/data and src/contents folder
- datascripts_work_in_progress # WIP python scripts
- public # contains website's html, icons, datasets and other static assets
- src # the source code of the website
  - components # reusable components
  - contents # mdx files for website's content in 2 languages
  - helpers # various functions and utils
  - pages # page containers used directly for routes rendering
  - visualizations # components directly used in website's pages and atlas
  - App.js # entrypoint of the react application
  - App.scss # entrypoint of the scss code
  - colorPalettes.js # color palettes to be used accross visulizations
  - ...
  - summary.js # summary of routes and their titles in french and english
  - # visualizationsList.json # dynamically generated list of visualizations to be used in atlas and pages to retrieve titles, captions, & co.
```
## Guidelines concerning the code

- reusable components should go into `src/components` folder. Each component should have its own folder with an `index.js` file, plus as many files as you want (js subcomponent files, scss files, component-specific assets, ...)

- components aimed at being directly used in contents should go in the `src/visualizations` folder. They should use reusable components from `src/components` as much as possible.

- style is managed through scss files. It is suggested to use existing variables in `src/App.scss` as much as possible.

# Deployment

Deployment is automated to happen every day and each time a commit is pushed to the `prod` branch. The published website is then pushed on the `gh-pages` branch, which serves the site at https://medialab.github.io/portic-storymaps-2021/.

Therefore :

- Contents and data are updated every day
- To deploy a new version of the website code, it has to be pushed to the `prod` branch.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
