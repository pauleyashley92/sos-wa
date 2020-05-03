import React, { useState } from "react";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch, Stats } from "react-instantsearch-dom";
import Map from "./Map";
import Sidebar from "./Sidebar";

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_API_KEY
);

const index = searchClient.initIndex(process.env.REACT_APP_ALGOLIA_INDEX_NAME);

const initialHeatmapState = {
  visible: false,
};

const reducer = (heatmapState, action) => {
  switch (action.type) {
    case "show":
      return { visible: true };

    case "hide":
      return { visible: false };

    default:
      return heatmapState;
  }
};

function Filter() {
  const [toggleState, setToggleState] = useState("off");
  const [reportHits, setReportHits] = useState([]);
  const [heatmapState, dispatch] = React.useReducer(
    reducer,
    initialHeatmapState
  );

  function showHeatmap() {
    if (heatmapState.visible === false) {
      setToggleState("on");
      dispatch({ type: "show" });
    } else {
      setToggleState("off");
      dispatch({ type: "hide" });
    }
  }

  const getResults = (searchState) => {
    let filters = [];

    if (searchState) {
      console.log(searchState);

      filters = Object.keys(searchState.refinementList).map((key) =>
        searchState.refinementList[key].length !== 0
          ? searchState.refinementList[key].map((entry) => key + ":" + entry)
          : key + ":-foobar"
      );
    }
    index
      .search("", {
        facetFilters: filters,
        hitsPerPage: 1000,
        attributesToRetrieve: ["*", "-_highlightResult"],
      })
      .then(({ hits }) => {
        setReportHits(hits);
      });
  };

  return (
    <div>
      <InstantSearch
        searchClient={searchClient}
        indexName={process.env.REACT_APP_ALGOLIA_INDEX_NAME}
        onSearchStateChange={(searchState) => getResults(searchState)}
      >
        <main>
          <Sidebar
            heatmapState={heatmapState}
            showHeatmap={showHeatmap}
            toggleState={toggleState}
            setToggleState={setToggleState}
          />
          <Content hits={reportHits} heatmapState={heatmapState} />
        </main>
      </InstantSearch>
    </div>
  );
}

const Content = (props) => {
  return (
    <div className="right-column">
      <div className="info">
        <Stats
          translations={{
            stats(nbHits, timeSpentMS) {
              return `${nbHits} strandings found in ${timeSpentMS}ms`;
            },
          }}
        />
      </div>
      <Map hits={props.hits} heatmapState={props.heatmapState} />
    </div>
  );
};

export default Filter;
