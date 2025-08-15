import React, { useEffect, useState, useRef, useContext } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";
import { Toast } from "primereact/toast";
import AuthButton from "./AuthButton";
import { Context } from "../utils/context";
import MDropdown from "./MDropdown";
import Colours from "./Colours";
import { FileUpload } from "primereact/fileupload";
import MyInput from "./MyInput";
import MyTextbox from "./MyTextbox";
import {
  findOrCreateFolder,
  saveOrUpdateFileInDrive,
  deleteAllFilesByName,
  readFileByName,
  readDriveFileContent,
  deleteAllAppData,
} from "../utils/driveIntegration";
import { ENTRIES_FOLDER_NAME } from "../utils/constants";

function Write() {
  const [entriesFolerId, setEntriesFolerId] = useState("");
  const [cookies, _] = useCookies(["access_token", "google_token"]);
  const [titleVal, setTitleVal] = useState("The End of An Era");
  const [descVal, setDescVal] = useState("The End of An Era");
  const [imageVal, setImage] = useState(
    "https://images.stockcake.com/public/f/6/2/f6200ac6-9e40-4081-a36d-51b45ead18c4_large/antique-journal-collection-stockcake.jpg"
  );
  let { date } = useParams();
  const toast = useRef(null);
  const [____, setChanges] = useContext(Context);
  const [selectedMood, setSelectedMood] = useState(2);
  const [loading, setLoading] = useState(false);

  const [dateIdMapping, setDateIdMapping] = useState();

  const show = () => {
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Saved Successfully!",
      life: 1000,
    });
  };
  const showWarn = (warn) => {
    toast.current.show({
      severity: "warn",
      summary: "Warning",
      detail: warn,
      life: 2000,
    });
  };

  useEffect(() => {
    findOrCreateFolder(cookies.google_token, ENTRIES_FOLDER_NAME).then(
      (res) => {
        console.log("Got Parent Folder ID:", res);
        setEntriesFolerId(res);
      }
    );

    // this will give error if file doesn't exist but dont create the file, its already being managed by Heatmap script
    readFileByName(cookies.google_token, "dates").then((dates) => {
      dates = JSON.parse(dates);
      let map = new Map();
      dates.forEach((item) => {
        map.set(item.date, item.id);
      });

      console.log(map);

      setDateIdMapping(map);
    });
  }, []);

  useEffect(() => {
    try {
      const id = dateIdMapping.get(date);
      if (id) {
        readDriveFileContent(cookies.google_token, id).then((res) => {
          console.log(res);
          res = JSON.parse(res);
          const { title, content, image, mood } = res;
          setTitleVal(title);
          setSelectedMood(mood);
          setDescVal(content);
          setImage(image);
        });
      } else {
        console.error("No entry found!!");
        throw new Error("No entry found");
      }
    } catch {
      console.error("couldn't get id");
      setTitleVal("Provide A Title");
      setDescVal("Provide A Desc");
      setSelectedMood(2);
      setImage(
        "https://images.stockcake.com/public/f/6/2/f6200ac6-9e40-4081-a36d-51b45ead18c4_large/antique-journal-collection-stockcake.jpg"
      );
      // showWarn()
    }

    // axios
    //   .get(`${import.meta.env.VITE_BACKEND_URI}/date?date=${date}`, {
    //     headers: {
    //       Authorization: cookies.access_token,
    //     },
    //   })
    //   .then((res) => {
    //     console.log(res);
    //     const { title, content, image, mood } = res.data;
    //     setTitleVal(title);
    //     setSelectedMood(mood);
    //     setDescVal(content);
    //     setImage(image);
    //   })
    //   .catch(() => {
    //     setTitleVal("Provide A Title");
    //     setDescVal("Provide A Desc");
    //     setSelectedMood(2);
    //     setImage(
    //       "https://images.stockcake.com/public/f/6/2/f6200ac6-9e40-4081-a36d-51b45ead18c4_large/antique-journal-collection-stockcake.jpg"
    //     );
    //     // showWarn()
    //   });
  }, [date]);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    console.log(droppedFiles);
    onUpload(droppedFiles[0]);
  };

  const onUpload = (file) => {
    var formData = new FormData();
    formData.append("image", file);
    formData.append("date", date);
    formData.append("mood", selectedMood);
    formData.append("content", descVal);
    formData.append("title", titleVal);
    axios
      .post(`${import.meta.env.VITE_BACKEND_URI}/upload`, formData, {
        headers: {
          Authorization: cookies.access_token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setImage(res.data.image);
        show();
        setChanges((change) => !change);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  async function delALL(filename) {
    await deleteAllFilesByName(cookies.google_token, filename);
  }

  async function handleUpdate() {
    console.log("using this access token:", cookies.google_token);
    setLoading(true);

    const content = {
      title: titleVal,
      content: descVal,
      image: imageVal,
      mood: selectedMood,
      date: date,
    };

    try {
      const res = await saveOrUpdateFileInDrive(
        cookies.google_token,
        date,
        JSON.stringify(content),
        entriesFolerId
      );

      let dates = await readFileByName(cookies.google_token, "dates");
      if (!dates) {
        dates = "[]";
      }
      dates = JSON.parse(dates);

      let exists = false;
      dates.forEach((item, index) => {
        if (item.id == res.id) {
          exists = true;
          dates[index].mood = selectedMood;
          console.log("Date Found!!!");
        }
      });
      if (!exists) {
        dates = [...dates, { id: res.id, date: date, mood: selectedMood }];
      }

      let map = new Map();

      dates.forEach((item) => {
        map.set(item.date, item.id);
      });

      console.log(map);

      setDateIdMapping(map);

      dates = JSON.stringify(dates);

      await saveOrUpdateFileInDrive(cookies.google_token, "dates", dates);
      console.log("Successfully saved entry");
      show();
      setChanges((change) => !change);
    } catch {
      console.error("Failed to create entry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast ref={toast} position="bottom-right" />
      {/* <Button onClick={show} label="Show" /> */}

      <div className="container" style={{ flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>{new Date(date).toDateString()} - Entry</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <Colours selected={selectedMood} setSelected={setSelectedMood} />
            <AuthButton />
          </div>
        </div>
        <MyInput textVal={titleVal} setTextVal={setTitleVal} />
        {/* <InputText style={{width:'100%'}} value={titleVal} onChange={(e) => setTitleVal(e.target.value)} /> */}
      </div>
      <br />
      <div className="container">
        <div
          className="img-bg"
          style={{
            background: `url(${imageVal})`,
            height: "30rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            border: "1px dashed rgba(1,1,1,0.35)",
          }}
        >
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            for="myFile"
            class="custom-file-upload"
          >
            <img
              src={imageVal}
              style={{ objectFit: "contain", height: "100%" }}
              width={300}
              alt=""
            />
            {/* Custom Upload */}
          </label>
          <input
            type="file"
            id="myFile"
            accept="image/*"
            name="filename"
            onChange={(e) => onUpload(e.target.files[0])}
          />
        </div>
        <div
          style={{
            maxWidth: "700px",
            flex: 1,
            marginLeft: window.innerWidth < 768 ? "0" : "2rem",
          }}
        >
          <MyTextbox textArea={descVal} setTextArea={setDescVal} />
          {/* <InputTextarea value={descVal} onChange={(e) => setDescVal(e.target.value)} style={{width:'100%' , height:'30rem', resize:'none'}} rows={20}/> */}
          <br />
          <br />
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "end",
              gap: "6px",
            }}
          >
            <MDropdown />
            <Button
              onClick={handleUpdate}
              icon={loading ? "pi pi-spin pi-spinner" : ""}
              label={loading ? "Saving..." : "Save Changes"}
              severity="success"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Write;
