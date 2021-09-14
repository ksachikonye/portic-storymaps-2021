
/* import external libraries */
import React, { useState, useEffect } from "react";
import {
  // HashRouter as Router,
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useHistory,
  useLocation,
  Link,
} from "react-router-dom";
import uniq from 'lodash/uniq';
import { csvParse, tsvParse } from 'd3-dsv';
import axios from 'axios';

/* import pages */
import Home from './pages/Home';
import Atlas from "./pages/Atlas";
import StandaloneVisualization from "./pages/StandaloneVisualization";
import PlainPage from './pages/PlainPage';

/* import components */
import HeaderNav from './components/HeaderNav';
import Loader from './components/Loader/Loader';
import Footer from "./components/Footer";

/* import utils */
import { DatasetsContext } from './helpers/contexts';

/* import other assets */
import './App.scss';

import visualizationsList from './visualizationsList';
import {homepage} from '../package.json';
import routes from './summary';

const LANGUAGES = ['fr', 'en'];

function App() {

  const history = useHistory();
  const location = useLocation();

  const [datasets, setDatasets] = useState({})
  const [loadingFraction, setLoadingFraction] = useState(0);

  /**
   * loading all datasets
   */
  useEffect(() => {
    // loading all datasets from the atlas
    // @todo do this on a page-to-page basis if datasets happens to be too big/numerous
    const datasetsNames = uniq(visualizationsList.filter(d => d.datasets).reduce((res, d) => [...res, ...d.datasets.split(',').map(d => d.trim())], []));
    datasetsNames.reduce((cur, datasetName, datasetIndex) => {
      return cur.then((res) => new Promise((resolve, reject) => {
        const url = datasetName ? `${process.env.PUBLIC_URL}/data/${datasetName}` : undefined;
        if (url) {
          axios.get(url, {
            onDownloadProgress: progressEvent => {
              let status = progressEvent.loaded / progressEvent.total;
              status = status > 1 ? 1 : status;
              const globalFraction = datasetIndex / datasetsNames.length;
              setLoadingFraction(globalFraction + status / datasetsNames.length);
            }
          })
            .then(({ data: inputData }) => {
              setTimeout(() => {
                let loadedData = inputData;
                if (url.split('.').pop() === 'csv') {
                  loadedData = csvParse(inputData);
                } else if (url.split('.').pop() === 'tsv') {
                  loadedData = tsvParse(inputData);
                }
                resolve({ ...res, [datasetName]: loadedData })
              })
            })
            // make get errors non-blocking to get all available datasets in the app even if some are broken
            .catch(err => {
              console.error(err);
              return resolve(res);
            })
        } else return resolve(res);

      }))
    }, Promise.resolve({}))
      .then(newDatasets => {
        setLoadingFraction(1);
        setDatasets(newDatasets)
      })
      .catch(console.error)
  }, [])

  const onLangChange = (ln) => {
    const otherLang = ln === 'fr' ? 'en' : 'fr';

    const { pathname } = location;
    // @todo refactor this to be handled based on the routes config JSON ?
    if (pathname.includes('atlas')) {
      const visualizationId = pathname.split('/atlas/').pop();
      history.push(`/${ln}/atlas/${visualizationId || ''}`);
    } else {
      const pathOtherLang = history.location.pathname.split('/').pop();
      const routeItem = routes.find(route => {
        return route.routes[otherLang] === pathOtherLang;
      });
      if (routeItem) {
        history.push(`/${ln}/page/${routeItem.routes[ln]}`);
      } else {
        history.push(`/${ln}/`);
      }
    }
  }
  const renderRoute = ({
    Content,
    ContentSync,
    ThatComponent = PlainPage,
    title,
    lang,
  }) => (
    <>
      <ThatComponent
        {
        ...{
          Content,
          ContentSync,
          title,
          lang
        }
        }
      />
    </>

  );
  return (
    <DatasetsContext.Provider value={datasets}>
      <div id="wrapper">
        <header>
          <HeaderNav {...{ onLangChange, routes }} />
        </header>
        <main>
          <Switch>
            {// looping through the page
              LANGUAGES.map(lang => {
                return routes
                .map(({
                  titles,
                  routes: inputRoute,
                  contents,
                  Component: ThatComponent,
                  contentsProcessed
                }, index) => {
                  const route = `/${lang}/page/${inputRoute[lang]}`
                  const title = titles[lang];
                  // @todo remove Content as it is not used anymore ? (importing md content with React.lazy did not play nice with scrollytelling-related features)
                  const Content = React.lazy(() => import(`!babel-loader!mdx-loader!./contents/${contents[lang]}`));
                  const ContentSync = contentsProcessed[lang];
                  return (
                    <Route key={index} path={route} exact>
                      {renderRoute({ Content, ThatComponent, title, ContentSync, lang })}
                    </Route>
                  )
                })
              })
            }
            {
              LANGUAGES.map(lang => {
                return visualizationsList
                .map(({
                  id
                }, index) => {
                  const route = `/${lang}/visualization/${id}`;
                  return (
                    <Route key={index} path={route} exact component={() => <StandaloneVisualization {...{id, lang}} />} />
                  )
                })
              })
            }
            <Route path="/:lang/atlas/:visualizationId?" component={Atlas} />
            <Route path="/:lang" exact component={Home} />
            <Redirect to={`/fr/`} />
          </Switch>
          {
            loadingFraction < 1 ?
              <Loader percentsLoaded={loadingFraction * 100} />
              : null
          }
        </main>
        <Footer
          lang={'fr'}
        />


      </div>
      {/* following react fragment is aimed at allowing react-snap to parse all the pages that have a dynamic URL */}
      <React.Fragment>
        {// looping through the pages to add a blank link to all of them
          LANGUAGES.map(lang => {
            return routes
            // @todo this is dirty and should be removed at some point (test page is not exported in prod, so no need for react-snap)
            .filter(({routes}) => routes[lang] && !routes[lang].includes('test'))
            .map(({
              titles,
              routes: inputRoute,
              contents,
              Component: ThatComponent,
              contentsProcessed
            }, index) => {
              const route = `/${lang}/page/${inputRoute[lang]}`;
              return (
                <Link to={route} exact />
              )
            })
          })
        }
      </React.Fragment>
    </DatasetsContext.Provider>
  );
}

/**
 * the following variable is aimed at allowing browser-router to function
 * for deployments on gh-pages (prefixing all routes with the repo name to match ghp URL pattern e.g. https://username.github.io/projectname/)
 */
const BASE_NAME =
  process.env.NODE_ENV === 'development'
    ? undefined
    : `/${homepage.split('/').pop()}`;


export default function Wrapper() {
  return (
    <Router basename={BASE_NAME}>
      <App />
    </Router>
  )
}