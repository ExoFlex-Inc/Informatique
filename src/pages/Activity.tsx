import ChartsHeader from '../components/ChartsHeader.tsx';
import LineChart from '../components/LineChart.tsx';

export default function Activity() {
    return(
        <div className="m-4 md:m-10 mt-24 p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
        <ChartsHeader category="Line" title="Amplitude Graph" />
        <div className="w-full">
          <LineChart />
        </div>
      </div>
    );
}