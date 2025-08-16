import React, { useEffect, useState, useRef, useContext } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";
import { Toast } from "primereact/toast";
import AuthButton from "./AuthButton.jsx";
import { Context } from "../utils/context.jsx";
import MDropdown from "./MDropdown.jsx";
import Colours from "./Colours.jsx";
import { FileUpload } from "primereact/fileupload";
import MyInput from "./MyInput.jsx";
import MyTextbox from "./MyTextbox.jsx";
import DoodlePad from "./DoodlePad.jsx";
import {
  findOrCreateFolder,
  saveOrUpdateFileInDrive,
  deleteAllFilesByName,
  readFileByName,
  readDriveFileContent,
  deleteAllAppData,

} from "../utils/driveIntegration";
import { ENTRIES_FOLDER_NAME } from "../utils/constants";
import Navbar from "./Navbar";


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
  const [doodleStrokes, setDoodleStrokes] = useState([]);
  const [doodleImageUrl, setDoodleImageUrl] = useState("");
  const [hasJustSavedDoodle, setHasJustSavedDoodle] = useState(false);
  const doodleRef = useRef(null);

  const [dateIdMapping, setDateIdMapping] = useState();

  // --- Feature Implementation: Word and Character Count ---
  // Ensure 'descVal' is a string to prevent errors.
  const safeDescVal = descVal || "";
  
  // Calculate word count.
  const wordCount = safeDescVal.trim() === '' ? 0 : safeDescVal.trim().split(/\s+/).filter(Boolean).length;
  
  // Calculate character count.
  const charCount = safeDescVal.length;
  // --- End of Feature Implementation ---

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
    // Reset doodle states immediately on date change so previous day's doodle doesn't flash
    setDoodleStrokes([]);
    setDoodleImageUrl("");
    setHasJustSavedDoodle(false);
    try {
      const id = dateIdMapping.get(date);
      if (id) {
        readDriveFileContent(cookies.google_token, id).then((res) => {
          console.log(res);
          res = JSON.parse(res);
          const { title, content, image, mood, doodle, doodleImage } = res;
          setTitleVal(title);
          setSelectedMood(mood);
          setDescVal(content);
          setImage(image);
          // Load saved doodle strokes for this day (pad starts empty until load completes)
          if (Array.isArray(doodle)) setDoodleStrokes(doodle);
          // Do not show preview on view; only after an explicit save in this session
          // if (typeof doodleImage === "string") setDoodleImageUrl(doodleImage);
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

    const content = {
      title: titleVal,
      content: descVal,
      image: imageVal,
      mood: selectedMood,
      date: date,
      doodle: doodleStrokes,
      // Persist doodleImageUrl only if user explicitly saved in this session
      ...(hasJustSavedDoodle && doodleImageUrl ? { doodleImage: doodleImageUrl } : {}),
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
      <div className="container" style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
        {/* Left column: two rows (image upload + doodle) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
          {/* Row 1: Image upload panel with cover background and visible image in front */}
          <div
            className="img-bg"
            style={{
              position: "relative",
              minHeight: "12rem",
              border: "1px dashed rgba(1,1,1,0.35)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {/* Blurred background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${imageVal})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "blur(12px)",
                zIndex: 1,
              }}
            />
            {/* Visible image in front */}
            {imageVal && (
              <img
                src={imageVal}
                alt="Uploaded"
                style={{
                  maxHeight: "10rem",
                  maxWidth: "90%",
                  borderRadius: 8,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                  zIndex: 2,
                  position: "relative",
                }}
              />
            )}
            <input
              type="file"
              id="myFile"
              accept="image/*"
              name="filename"
              onChange={(e) => onUpload(e.target.files[0])}
              style={{ display: "none" }}
            />
          </div>          

          {/* Row 2: Doodle pad */}
          <div style={{ border: "1px dashed rgba(1,1,1,0.35)", borderRadius: 8, padding: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Add a doodle!</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  type="button"
                  severity="secondary"
                  size="small"
                  label="Save Doodle"
                  onClick={async () => {
                    if (!doodleRef.current) return;
                    const blob = await doodleRef.current.toBlob();
                    if (!blob) return;
                    const file = new File([blob], `doodle-${date}.png`, { type: "image/png" });

                    const formData = new FormData();
                    formData.append("image", file);
                    axios
                      .post(`${import.meta.env.VITE_BACKEND_URI}/upload-doodle`, formData, {
                        headers: { Authorization: cookies.access_token },
                      })
                      .then((res) => {
                        setDoodleImageUrl(res.data.image);
                        setHasJustSavedDoodle(true);
                        show();
                      })
                      .catch((err) => console.error(err));
                  }}
                />
                <Button type="button" size="small" label="Clear" onClick={() => doodleRef.current?.clear()} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <DoodlePad ref={doodleRef} value={doodleStrokes} onChange={setDoodleStrokes} width={600} height={220} />
            </div>
          </div>
        </div>




        <div style={{ minWidth: 0, maxWidth: "700px", flex: 1, marginLeft: window.innerWidth < 768 ? "0" : "2rem"}}>

          <MyTextbox textArea={descVal} setTextArea={setDescVal} />
          <br />
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {/* --- Display for the Word and Character Count --- */}
            <div
              style={{
                fontSize: "0.85rem",
                color: "#444",
                backgroundColor: "#f9f9f9",
                padding: "6px 12px",
                borderRadius: "6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                lineHeight: "1.4"
              }}
            >
              <div style={{ fontWeight: "500", color: "#222" }}>Words: {wordCount}</div>
              <div style={{ fontWeight: "500", color: "#222" }}>Characters: {charCount}</div>
            </div>
            {/* --- End of Display --- */}
            
            <div style={{display: "flex", alignItems: 'center', gap: "6px"}}>
                <MDropdown />
                <Button onClick={handleUpdate} label="Save Changes" severity="success" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Write;
