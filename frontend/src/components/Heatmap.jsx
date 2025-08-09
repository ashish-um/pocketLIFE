import React, { useEffect, useState, useContext } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "../heatmap.css";
import { Tooltip } from "react-tooltip";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { Context } from "../utils/context";
import { findOrCreateJsonFileByName } from "../utils/driveIntegration";

function Heatmap() {
  const [cookies, _] = useCookies(["access_token", "google_token"]);
  // const boxes = Array.from(Array(365));
  const navigate = useNavigate();
  const [dates, setDates] = useState([]);
  const [changes, , today, , , setYears] = useContext(Context);

  // const today = new Date();
  function shiftDate(date, numDays) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  }

  useEffect(() => {
    findOrCreateJsonFileByName(cookies.google_token, "dates", "[]")
      .then((res) => {
        console.log(res);
        const jsonObject = JSON.parse(res);
        // const jsonObject = res;
        console.log(jsonObject);

        var boxes = [];

        var howFarBehind = 1000;
        const mySet = new Set();

        jsonObject.forEach((item) => {
          mySet.add(Number(item.date.split("-")[0]));
        });

        console.log(mySet);
        let usedYears = [...mySet];
        console.log(usedYears);
        // console.log(allYears);
        usedYears = usedYears.sort();
        if (usedYears.length == 0) {
          usedYears = [new Date().getFullYear()];
        }

        setYears(usedYears);
        const diff = usedYears[usedYears.length - 1] - usedYears[0] + 2;
        // console.log("diff:",diff)
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
        // console.log(res)
        jsonObject.forEach((item) => {
          const index = boxes.findIndex(
            (bx) => bx.date == item.date.split("T")[0]
          );
          if (index != -1) {
            boxes[index].count = item.mood;
          } else boxes.push({ date: item.date.split("T")[0], count: 3 });
        });
        setDates(boxes);
      })
      .catch((err) => {
        console.error("Got Error while getting Dates", err);
      });

    // ------------------- OLD METHOD ------------------
    // axios
    //   .get(`${import.meta.env.VITE_BACKEND_URI}/year`, {
    //     headers: {
    //       Authorization: cookies.access_token,
    //     },
    //   })
    //   .then((res) => {
    //     var boxes = [];
    //     // console.log(res)

    //     var howFarBehind = 1000;

    //     axios
    //       .get(`${import.meta.env.VITE_BACKEND_URI}/year/used`, {
    //         headers: {
    //           Authorization: cookies.access_token,
    //         },
    //       })
    //       .then((allYears) => {
    //         const usedYears = allYears.data.sort();
    //         const diff = usedYears[usedYears.length - 1] - usedYears[0] + 2;
    //         // console.log("diff:",diff)
    //         howFarBehind = 365 * diff;

    //         var day = shiftDate(today, -howFarBehind);
    //         for (let i = 0; i < howFarBehind; i++) {
    //           var nextDay = new Date(day);
    //           nextDay.setDate(day.getDate() + 1);
    //           boxes.push({
    //             date: nextDay.toISOString().split("T")[0],
    //             count: 0,
    //           });
    //           day = nextDay;
    //         }
    //         // console.log(res)
    //         res.data.forEach((item) => {
    //           const index = boxes.findIndex(
    //             (bx) => bx.date == item.date.split("T")[0]
    //           );
    //           if (index != -1) {
    //             boxes[index].count = item.mood;
    //           } else boxes.push({ date: item.date.split("T")[0], count: 3 });
    //         });
    //         setDates(boxes);
    //       });
    //   })
    //   .catch(() => {
    //     console.error("Got Error while getting Dates");
    //   });
  }, [changes]);

  return (
    <>
      <Tooltip id="myid" />
      <div id="heatmap-container" className="container" style={{marginTop: "2.5rem"}}>
        <CalendarHeatmap
          startDate={shiftDate(today, -365)}
          endDate={today}
          showMonthLabels
          // showWeekdayLabels
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
