import React, { useEffect, useState, useContext } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "../heatmap.css";
import { Tooltip } from "react-tooltip";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Context } from "../utils/context";

function Heatmap() {
  const [cookies, _] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const [dates, setDates] = useState([]);
  const [changes, __, today] = useContext(Context);

  function shiftDate(date, numDays) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  }

  useEffect(() => {
    // FIX 1: Add a conditional check for the access_token
    if (cookies.access_token) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URI}/year`, {
          headers: {
            Authorization: cookies.access_token,
          },
        })
        .then((res) => {
          var boxes = [];
          var howFarBehind = 1000;

          axios
            .get(`${import.meta.env.VITE_BACKEND_URI}/year/used`, {
              headers: {
                Authorization: cookies.access_token,
              },
            })
            .then((allYears) => {
              // FIX 2: Safely check if the data exists and is an array before sorting
              const usedYears = allYears?.data && Array.isArray(allYears.data) ? allYears.data.sort() : [];

              const diff = usedYears.length > 0 ? usedYears[usedYears.length - 1] - usedYears[0] + 2 : 2;
              howFarBehind = 365 * diff;

              var day = shiftDate(today, -howFarBehind);
              for (let i = 0; i < howFarBehind; i++) {
                var nextDay = new Date(day);
                nextDay.setDate(day.getDate() + 1);
                boxes.push({
                  date: nextDay.toISOString().split("T")[0],
                  count: 0,
                });
                day = nextDay;
              }

              // FIX 3: Check if res.data exists and is an array before forEach
              if (res.data && Array.isArray(res.data)) {
                res.data.forEach((item) => {
                  const index = boxes.findIndex(
                    (bx) => bx.date === item.date.split("T")[0]
                  );
                  if (index !== -1) {
                    boxes[index].count = item.mood;
                  } else {
                    boxes.push({ date: item.date.split("T")[0], count: 3 });
                  }
                });
              }
              setDates(boxes);
            });
        })
        .catch(() => {
          console.error("Got Error while getting Dates");
        });
    }
  }, [changes, today, cookies.access_token]); // FIX 4: Add dependencies

  return (
    <>
      <Tooltip id="myid" />
      <div id="heatmap-container" className="container">
        <CalendarHeatmap
          startDate={shiftDate(today, -365)}
          endDate={today}
          showMonthLabels
          values={dates}
          classForValue={(value) => {
            if (!value) {
              return "color-empty";
            }
            return `color-box-${value.count}`;
          }}
          gutterSize={3}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) {
              return null;
            }
            return {
              "data-tooltip-content": value.date,
              "data-tooltip-id": "myid",
            };
          }}
          onClick={(value) => {
            navigate(`/${value.date}`);
          }}
        />
      </div>
    </>
  );
}

export default Heatmap;