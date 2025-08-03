import React, { useEffect, useState, useContext } from "react";
import { Dropdown } from "primereact/dropdown";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Context } from "../utils/context";

function MDropdown() {
  const [cookies, _] = useCookies(["access_token"]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [years, setYears] = useState([]);
  const [___, __, ____, setToday] = useContext(Context);

  useEffect(() => {
    // This is the fix: only make the API call if a token exists
    if (cookies.access_token) {
        axios
          .get(`${import.meta.env.VITE_BACKEND_URI}/year/used`, {
            headers: {
              Authorization: cookies.access_token,
            },
          })
          .then((res) => {
            console.log(res);
            var data = [];
            // The API response should be an array of years, so map it.
            if (Array.isArray(res.data)) {
                data = res.data.map((item) => ({ name: item }));
            }
            
            setYears(data);
          })
          .catch(() => {
            console.error("Error Getting Dropdown Years");
          });
    }
  }, [cookies.access_token]); // Add cookies.access_token as a dependency

  const handleDrop = (e) => {
    setSelectedYear(e.value);
    console.log(e.value);
    setToday(`${e.value.name}-12-31`);
  };

  return (
    <div>
      <Dropdown
        value={selectedYear}
        onChange={handleDrop}
        options={years}
        optionLabel="name"
        placeholder="Select Year"
        className="w-full md:w-14rem"
      />
    </div>
  );
}

export default MDropdown;