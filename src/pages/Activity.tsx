import React, { useState } from "react";
import ChartsHeader from "../components/ChartsHeader.tsx";
import ProgressionWidget from "../components/ProgressionWidget.tsx";
// import LineChart from "../components/LineChart.tsx";

export default function Activity() {

  return (
    <div className=" justify-center flex">
      <div className=" w-80 h-80 mr-4 p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
        <ChartsHeader category="Line" title="Amplitude Graph" />
      </div>
      <ProgressionWidget />
    </div>

  );
}
