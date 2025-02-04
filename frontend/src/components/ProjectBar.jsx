import React, { useState, useEffect } from "react";
import { Container, Col, Row } from "react-bootstrap";
import { Bar, Line} from "react-chartjs-2";
import Select from "react-select";
import axios from "axios";

import { BASE_URL } from "../constants";

function ProjectBar() {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([{ value: "all", label: "All Types" }]);
  const [versionOptions, setVersionOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("Progress");
  const [assigneeChartData, setAssigneeChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [lineChartLoading, setLineChartLoading] = useState(false); // Add this state
  

  const getLabelFromURL = () => {
    const url = window.location.href;
    const parts = url.split("/");
    const label = parts[parts.length - 1];
    return decodeURIComponent(label);
  };


  const fetchChartData = async (selectedTypeValues, selectedVersionValue) => {
    try {
      let response;
      if (selectedTypeValues.includes("all")) {
        response = await axios.get(`${BASE_URL}/get-progress-version`);
      } else {
        response = await axios.get(`${BASE_URL}/get-progress-version`, {
          params: {
            wp_types: selectedTypeValues.join(","),
          },
        });
      }

      const data = response.data;
      const filteredProject = data.find((project) => project.project_name === getLabelFromURL());


      if (filteredProject) {
        if (selectedVersionValue === "all" || selectedVersionValue === "all-versions") {
          // Use percentage_done_project and percentage_undone_project
          const chartData = {
            labels: ["Progress"],
            datasets: [
              {
                label: "Percentage Done",
                data: [filteredProject.percentage_done_project],
                backgroundColor: "#327332",
                barThickness: 40,
                stack: "progress", // Add stack property to indicate they should be stacked
              },
              {
                label: "Percentage Undone",
                data: [filteredProject.percentage_undone_project],
                backgroundColor: "#F6C600",
                barThickness: 40,
                stack: "progress", // Add stack property to indicate they should be stacked
              }
 
,
            ],
          };
          setChartData(chartData);
        } else {
          // Use percentage_done and percentage_undone from selected version's progress
          const selectedVersionData = filteredProject.progress.find(
            (progress) => progress.version_name === selectedVersionValue
          );
  
          if (selectedVersionData) {
            const chartData = {
              labels: ["Progress"],
              datasets: [
 
                {
                  label: "Percentage Done",
                  data: [selectedVersionData.percentage_done],
                  backgroundColor: "#327332",
                  barThickness: 40,
                  stack: "progress", // Add stack property to indicate they should be stacked
                },
                {
                  label: "Percentage Undone",
                  data: [selectedVersionData.percentage_undone],
                  backgroundColor: "#F6C600",
                  barThickness: 40,
                  stack: "progress", // Add stack property to indicate they should be stacked
                }
   ,
              ],
            };
            setChartData(chartData);
          } else {
            setChartData(null);
          }
        }
      } else {
        setChartData(null);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData(null);
    }
  };

  const fetchAssigneeChartData = async (selectedTypeValues, selectedVersionValue, selectedMetric) => {
    try {
      let response;
      let assigneeChartData = null;
  
      if (selectedVersionValue === "all-versions") {
        response = await axios.get(`${BASE_URL}/get-progress-assignee-project`, {
          params: {
            project_name: getLabelFromURL(),
          },
        });
      } else {
        if (selectedTypeValues.includes("all")) {
          // Fetch data for each type individually
          const allTypesData = [];
          for (const typeOption of typeOptions) {
            if (typeOption.value !== "all") {
              response = await axios.get(`${BASE_URL}/get-progress-assignee-version`, {
                params: {
                  wp_types: typeOption.value,
                  project_name: getLabelFromURL(),
                  version_name: selectedVersionValue, // Include the version_name parameter for version-specific data
                },
              });
              allTypesData.push(...response.data);
            }
          }
          response = { data: allTypesData };
        } else {
          response = await axios.get(`${BASE_URL}/get-progress-assignee-version`, {
            params: {
              wp_types: selectedTypeValues.join(","),
              project_name: getLabelFromURL(), // Include the project_name parameter for version-specific data
              version_name: selectedVersionValue, // Include the version_name parameter for version-specific data
            },
          });
        }
      }
  
      const data = response.data;
      const filteredProject = data.find((project) => project.project_name === getLabelFromURL());
  
      if (filteredProject) {
        if (selectedVersionValue === "all-versions") {
          assigneeChartData = {
            labels: filteredProject.progress.map((progress) => progress.user_name),
            datasets: [
              {
                label: selectedMetric,
                data: filteredProject.progress.map((progress) =>
                  selectedMetric === "Progress" ? progress.progress : progress.story_points
                ),
                backgroundColor: "#2076BD",
                barThickness: 40,
              },
            ],
          };
        } else {
          const selectedVersionData = filteredProject.versions.find(
            (version) => version.version_name === selectedVersionValue
          );
  
          if (selectedVersionData) {
            assigneeChartData = {
              labels: selectedVersionData.progress.map((progress) => progress.member_name),
              datasets: [
                {
                  label: selectedMetric,
                  data: selectedVersionData.progress.map((progress) =>
                    selectedMetric === "Progress" ? progress.progress : progress.story_points
                  ),
                  backgroundColor: "#2076BD",
                  barThickness: 40,
                },
              ],
            };
          }
        }
      }
  
      setAssigneeChartData(assigneeChartData);
    } catch (error) {
      console.error("Error fetching assignee chart data:", error);
      setAssigneeChartData(null);
    }
  };
  
  
  

  const fetchVersionOptions = async (selectedTypeValues) => {
    try {
      let response;
      if (selectedTypeValues.includes("all") || selectedTypeValues.length === 0) {
        // If "All Types" is selected or no types are selected, fetch all version options
        response = await axios.get(`${BASE_URL}/get-progress-version`);
      } else {
        // Fetch version options based on selected types
        response = await axios.get(`${BASE_URL}/get-progress-version`, {
          params: {
            wp_types: selectedTypeValues.join(","),
          },
        });
      }

      const progressData = response.data;
      const labelParam = getLabelFromURL();
      const filteredProject = progressData.find((project) => project.project_name === labelParam);

      if (filteredProject) {
        // Update the version options based on the fetched data
        const versionOptions = filteredProject.progress.map((data) => ({
          value: data.version_name,
          label: data.version_name,
        }));

        // Add "All Versions" option
        versionOptions.unshift({
          value: "all-versions",
          label: "All Versions",
        });

        setVersionOptions(versionOptions);

        // If "All Versions" is selected, keep the current selected version if it exists in the versionOptions
        if (selectedVersion && versionOptions.some((option) => option.value === selectedVersion.value)) {
          setSelectedVersion(selectedVersion);
        }
      } else {
        // Reset the version options if the label doesn't match any project
        setVersionOptions([]);
        setSelectedVersion(null);
      }
    } catch (error) {
      console.error("Error fetching version options:", error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch project details only if type options are not set yet
        if (typeOptions.length === 0) {
          const projectDetailsResponse = await axios.get(`${BASE_URL}/get-progress-project`);
          const projectDetails = projectDetailsResponse.data;

          // Check if the label matches any project name
          const labelParam = getLabelFromURL();
          const filteredProject = projectDetails.find((project) => project.project_name === labelParam);

          if (filteredProject) {
            // Set the type options for the dropdown
            const typeOptions = filteredProject.wp_types.map((type) => ({
              value: type,
              label: type,
            }));

            // Add "All Types" option
            typeOptions.unshift({
              value: "all",
              label: "All Types",
            });

            setTypeOptions(typeOptions);

            // Set the default selection to "All Types" if no types are selected
            setSelectedTypes([{ value: "all", label: "All Types" }]);
          } else {
            // Reset the data if the label doesn't match any project
            setSelectedVersion(null);
            setSelectedTypes([]);
            setChartData(null);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();

    // Fetch chart data for the default selections after setting up the component state
    if (selectedVersion && selectedVersion.value === "all") {
      fetchAssigneeChartData(["all"], "all-versions", selectedMetric);
    } else {
      const selectedTypeValues = selectedTypes.map((type) => type.value);
      const selectedVersionValue = selectedVersion?.value || "all-versions";
      fetchChartData(selectedTypeValues, selectedVersionValue);
      fetchAssigneeChartData(selectedTypeValues, selectedVersionValue, selectedMetric);
      fetchLineChartData(selectedTypeValues, selectedVersionValue);
    }
  }, []);

  

  useEffect(() => {
    // Check if "All Versions" is selected
    const isAllVersionsSelected = selectedVersion && selectedVersion.value === "all-versions";

    if (isAllVersionsSelected || selectedTypes.some((option) => option.value === "all")) {
      // Fetch version options based on empty wp_types
      fetchVersionOptions(["all"]);
    } else {
      // Fetch version options based on selected types
      fetchVersionOptions(selectedTypes.map((type) => type.value));
    }
    // Fetch line chart data based on the selected types and version
    const selectedTypeValues = selectedTypes.map((type) => type.value);
    const selectedVersionValue = selectedVersion?.value || "all-versions";
    fetchLineChartData(selectedTypeValues, selectedVersionValue);
  }, [selectedTypes, selectedVersion]);

  const handleVersionSelect = (selectedOption) => {
    setSelectedVersion(selectedOption);

    if (selectedOption) {
      const selectedTypeValues = selectedTypes.map((type) => type.value);
      const selectedVersionValue = selectedOption.value;

      if (selectedVersionValue === "all-versions") {
        fetchAssigneeChartData(selectedTypeValues, "all-versions", selectedMetric);
      } else {
        fetchChartData(selectedTypeValues, selectedVersionValue);
        fetchAssigneeChartData(selectedTypeValues, selectedVersionValue, selectedMetric);
      }
    }
  };

  const fetchLineChartData = async (selectedTypeValues, selectedVersionValue) => {
    try {
      setLineChartLoading(true); // Set loading to true before fetching data
      let response;
      let apiEndpoint;
  
      if (selectedVersionValue === "all-versions") {
        apiEndpoint = `${BASE_URL}/get-burndown-chart-project`;
      } else {
        apiEndpoint = `${BASE_URL}/get-burndown-chart-version`;
      }
  
      // If "All Types" is selected, fetch data for all types
      if (selectedTypeValues.includes("all")) {
        // Fetch data for each type individually
        const allTypesData = [];
        for (const typeOption of typeOptions) {
          if (typeOption.value !== "all") {
            response = await axios.get(apiEndpoint, {
              params: {
                wp_types: typeOption.value,
                project_name: getLabelFromURL(),
              },
            });
            allTypesData.push(...response.data);
          }
        }
        response = { data: allTypesData };
      } else {
        // Fetch data for specific types
        response = await axios.get(apiEndpoint, {
          params: {
            wp_types: selectedTypeValues.join(","),
            project_name: getLabelFromURL(),
          },
        });
      }
  
      const data = response.data;
      console.log("API Response:", data);
  
      const filteredProjects = data.filter((project) => project.project_name === getLabelFromURL());
  
      if (filteredProjects.length > 0) {
        const lineData = {
          labels: [], // Array to store the labels (months or dates)
          datasets: [
            {
              label: "Done",
              data: [], // Array to store wp_done values
              borderColor: "#165BAA",
              backgroundColor: "#165BAA",
              borderWidth: 5,
            },
            {
              label: "Added",
              data: [], // Array to store wp_on_going values
              borderColor: "#A155B9",
              backgroundColor: "#A155B9",
              borderWidth: 5,
            },
          ],
        };
  
        // For specific version, retrieve labels from date's value (string)
        if (selectedVersionValue !== "all-versions") {
          for (const filteredProject of filteredProjects) {
            const selectedVersionData = filteredProject.progress.find(
              (yearData) => yearData.versions.some((version) => version.version_name === selectedVersionValue)
            );
  
            if (selectedVersionData) {
              for (const version of selectedVersionData.versions) {
                if (version.version_name === selectedVersionValue) {
                  for (const entry of version.progress) {
                    lineData.labels.push(entry.date);
                    lineData.datasets[0].data.push(entry.wp_done);
                    lineData.datasets[1].data.push(entry.wp_on_going);
                  }
                  break; // Break out of the loop once the selected version's progress is found
                }
              }
            }
          }
        } else {
          // For "All Versions," retrieve labels from month and year values (string)
          for (const filteredProject of filteredProjects) {
            for (const yearData of filteredProject.progress) {
              for (const entry of yearData.progress) {
                const label = `${entry.month} ${yearData.year}`;
                if (!lineData.labels.includes(label)) {
                  lineData.labels.push(label);
                }
                lineData.datasets[0].data.push(entry.wp_done);
                lineData.datasets[1].data.push(entry.wp_on_going);
              }
            }
          }
        }
  
        console.log("Line Chart Data:", lineData); // Check if lineData is generated correctly
        setLineChartData(lineData);
      } else {
        setLineChartData(null);
      }
      setLineChartLoading(false);
    } catch (error) {
      console.error("Error fetching line chart data:", error);
      setLineChartData(null);
      setLineChartLoading(false);
    }
  };
  
  
  const handleTypeSelect = (selectedOptions) => {
    setSelectedTypes(selectedOptions);

    const isAllTypesSelected = selectedOptions.some((option) => option.value === "all");

    if (!isAllTypesSelected) {
      fetchVersionOptions(selectedOptions.map((type) => type.value));
    }
  };

  const handleMetricSelect = (selectedOption) => {
    setSelectedMetric(selectedOption.value);

    const selectedTypeValues = selectedTypes.map((type) => type.value);
    const selectedVersionValue = selectedVersion?.value || "all-versions";

    fetchAssigneeChartData(selectedTypeValues, selectedVersionValue, selectedOption.value);
  };

  return (
    <Container fluid className="project-components">
      <Row className="row">
        <Col className="multipleselect">
          Select Types
          <Select
            options={typeOptions}
            isMulti
            onChange={handleTypeSelect}
            value={selectedTypes}
            placeholder="Select Type"
          />
        </Col>
        <Col>
          <div> Select Version </div>
          <Select
            options={versionOptions}
            isClearable
            isSearchable
            onChange={handleVersionSelect}
            value={selectedVersion}
            placeholder="Select Version"
          />
        </Col>
      </Row>
      <hr style={{ height: "2px", background: "black", border: "none" }} />
      <Row className="container-chart">
      <h3 className="sub-judul-project">Progress Bar</h3>
      <Col>
        {chartData && (
          <div>
            <Bar
              data={chartData}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                indexAxis: "y",
                scales: {
                  x: {
                    stacked: true,
                    display: false,
                    grid: {
                      display: false,
                    },
                  },
                  y: {
                    stacked: false,
                    display: true,
                    grid: {
                      display: false,
                    },
                    stacked: true, // Set the stacked option to true for the y-axis
                    ticks: {
                      display: false, // Set to false if you want to hide the tick marks
                    },
                  },
                },
                maintainAspectRatio: false,
              }}
              dataset={{
                barPercentage: 1.0, // Set barPercentage to 1.0 to fill the available space
              }}
            />
          </div>
        )}
      </Col>
    </Row>
    <Row className="container-chart">
      <h3 className="sub-judul-project">Burndown</h3>
      <Col>
      {lineChartLoading ? ( // Display loading message or spinner while loading
        <div>Loading...</div>
      ) : (
        // Display the line chart when data is available
        lineChartData !== null ? (
          <Line data={lineChartData} />
        ) : (
          <div>No data available.</div>
        )
      )}
    </Col>
    </Row>
    <Col className="button d-flex justify-content-end">
        <Select
          options={[
            { value: "Progress", label: "Progress" },
            { value: "Story Points", label: "Story Points" },
          ]}
          onChange={handleMetricSelect}
          value={{ value: selectedMetric, label: selectedMetric }}
          placeholder="Select Metric"
        />
    </Col>
    <Row className="container-chart">
    <h3 className="sub-judul-project">Assignee Chart</h3>
      <Col>
        {assigneeChartData && (
          <Bar
            data={assigneeChartData}
            options={{
              plugins: {
                legend: {
                  display: true,
                  position: "bottom"
                },
              },
              indexAxis: "y",
              scales: {
                x: {
                  stacked: false,
                },
                y: {
                  stacked: true,
                },
              },
            }}
          />
        )}
      </Col>
    </Row>
    </Container>
  );
}

export default ProjectBar;

