import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import { Provider } from "react-redux";
import store from "./Redux/store";
import { Suspense } from "react";
ReactDOM.render(
  <>
    <Suspense fallback={<div>Loading ...</div>}>
      <Provider store={store}>
        <App />
      </Provider>
    </Suspense>
  </>,
  document.getElementById("root")
);

reportWebVitals();
