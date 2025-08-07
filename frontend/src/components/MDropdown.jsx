import React, { useState, useContext } from "react";
import { Dropdown } from "primereact/dropdown";
import { Context } from "../utils/context";

function MDropdown() {
  const [selectedYear, setSelectedYear] = useState(null);
  // const [years, setYears] = useState([]);
  const [___, __, ____, setToday, years] = useContext(Context);

  const handleDrop = (e) => {
    setSelectedYear(e.value);
    console.log(e.value);
    setToday(`${e.value}-12-31`);
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
