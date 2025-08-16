import React, { useRef } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

function AuthButton({ label = "Login/Enter" }) {
  const [cookies, setCookies, removeCookie] = useCookies([
    "access_token",
    "google_token",
  ]);
  const navigate = useNavigate();
  const menuRight = useRef(null);
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

  const items = [
    {
      label: "Options",
      items: [
        {
          label: "Log Out",
          style: { fontSize: "12px" },
          icon: "pi pi-sign-out",
          command(event) {
            if (event.originalEvent.type === "click") {
              removeCookie("access_token");
              removeCookie("google_token");
            }
            navigate("/", { replace: true });
          },
        },
      ],
    },
  ];

  const login = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive.appdata",

    onSuccess: (tokenResponse) => {
      console.log(tokenResponse);
      setCookies("google_token", tokenResponse["access_token"]);
      // show();
      axios
        .get(
          `${import.meta.env.VITE_BACKEND_URI}/auth?code=${
            tokenResponse["access_token"]
          }`
        )
        .then((res) => {
          setCookies("access_token", res.data.token);
          localStorage.setItem("username", res.data.user.name);
          localStorage.setItem("email", res.data.user.email);
          localStorage.setItem("image", res.data.user.image);
          navigate(`/${formattedDate}`, { replace: true });
          window.location.reload();
        })
        .catch((err) => {
          console.error(err);
          showError();
        });
    },
  });

  const loggedIN = (
    <div>
      <img
        onClick={(event) => menuRight.current.toggle(event)}
        aria-controls="popup_menu_right"
        aria-haspopup
        style={{ borderRadius: "100%" }}
        width={50}
        height={50}
        src={localStorage.getItem("image") || ""}
        alt=""
      />
      <Menu
        model={items}
        popup
        ref={menuRight}
        id="popup_menu_right"
        popupAlignment="right"
      />
    </div>
  );
  return (
    <div>
      <Toast ref={toast} />
      {cookies.access_token ? (
        loggedIN
      ) : (
        <Button
          severity="info"
          // rounded
          className="hero-content-button"
          raised
          // icon="pi pi-sign-in"
          onClick={() => {
            login();
          }}
          label={label}
        />
      )}
    </div>
  );
}

export default AuthButton;
