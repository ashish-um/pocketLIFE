import React, { useRef, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";

function StartwritingButton({ label = "Start Writing" }) {
  const [cookies, setCookies, removeCookie] = useCookies([
    "access_token",
    "google_token",
  ]);
  const navigate = useNavigate();
  const toast = useRef(null);

  const date = new Date();
  function toTwoDigits(number) {
    return String(number).padStart(2, "0");
  }
  const formattedDate =
    date.getFullYear() +
    "-" +
    toTwoDigits(date.getMonth() + 1) +
    "-" +
    toTwoDigits(date.getDate());

  const showError = () => {
    toast.current.show({
      severity: "error",
      summary: "Error",
      detail: "Login Failed",
      life: 3000,
    });
  };

  const login = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive.appdata",
    onSuccess: (tokenResponse) => {
      setCookies("google_token", tokenResponse["access_token"]);
      axios
        .get(
          `${import.meta.env.VITE_BACKEND_URI}/auth?code=${tokenResponse["access_token"]}`
        )
        .then((res) => {
          setCookies("access_token", res.data.token);
          localStorage.setItem("username", res.data.user.name);
          localStorage.setItem("email", res.data.user.email);
          localStorage.setItem("image", res.data.user.image);

          // ✅ Redirect to today’s page
          navigate(`/${formattedDate}`, { replace: true });
        })
        .catch((err) => {
          console.error(err);
          showError();
        });
    },
  });

  const handleClick = () => {
    if (cookies.access_token) {
      // ✅ Already logged in → redirect
      navigate(`/${formattedDate}`, { replace: true });
    } else {
      // ✅ Not logged in → start Google login
      login();
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <Button
        severity="info"
        className="hero-content-button"
        raised
        onClick={handleClick}
        label={label}
      />
    </div>
  );
}

export default StartwritingButton;
