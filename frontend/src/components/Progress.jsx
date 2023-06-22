import { useState } from "react";
import BarChart from "./BarChart";
import { projectProgress } from "../data/index.js";
  
  function Progress() {
    const [projectData, setProjectData] = useState(() => {
      const labels = projectProgress.map((data) => data.project_name);
      const datasets = [
        {
          indexAxis: "y",
          label: "Project Progress",
          data: projectProgress.map((data) => data.progress.percentage),
          fill: false,
          backgroundColor: [
            "rgba(75,192,192,1)",
            "#ecf0f1",
            "#50AF95",
            "#f3ba2f",
            "#2a71d0",
          ],
          borderColor: "black",
          borderWidth: 1,
          barThickness: 30,
        },
      ];
    });
  
    return (
      <div className="Progress">
        <div style={{ width: "100%", height: "100%" }}>
          <BarChart chartData={projectData} />
        </div>
      </div>
    );
  }
  
export default Progress;