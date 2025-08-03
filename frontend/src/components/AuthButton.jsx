import React, { useRef } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

function AuthButton() {
  const [cookies, setCookies, removeCookie] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const menuRight = useRef(null);
  const toast = useRef(null);

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
            event.originalEvent.type === "click" &&
              removeCookie("access_token");
            window.location.reload();
          },
        },
      ],
    },
  ];

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log(tokenResponse);
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
          navigate("/");
        })
        .catch((err) => {
          console.error(err);
          showError();
        });
    },
  });

  // This is the corrected code
  const loggedIN = (
    <div>
      {localStorage.getItem("image") && (
        <img
          onClick={(event) => menuRight.current.toggle(event)}
          aria-controls="popup_menu_right"
          aria-haspopup
          style={{ borderRadius: "100%" }}
          width={50}
          height={50}
          src={localStorage.getItem("image")}
          alt="User Profile"
        />
      )}
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
          rounded
          raised
          icon="pi pi-sign-in"
          onClick={() => {
            login();
          }}
          label="Login/Enter"
        />
      )}
    </div>
  );
}

export default AuthButton;