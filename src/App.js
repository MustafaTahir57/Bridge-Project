import React from "react";
import Presales from "../src/Presales/Presales";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Presales />
    </div>
  );
};

export default App;
