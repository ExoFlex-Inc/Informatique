import { useContext, useMemo, useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { UserContext } from "../App.tsx";
import Dialog from "../components/Dialog.tsx";
import { supaClient } from "../hooks/supa-client.ts";

export async function welcomeLoader() {
  const {
    data: { user },
  } = await supaClient.auth.getUser();
  if (!user) {
    return redirect("/");
  }
  const { data } = await supaClient
    .from("user_profiles")
    .select("*")
    .eq("user_id", user?.id)
    .single();
  if (data?.username && data) {
    return redirect("/");
  }
  return { loaded: true };
}
export function Welcome() {
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userNameDirty, setUserNameDirty] = useState(false);
  const [lastName, setLastName] = useState("");
  const [lastNameDirty, setLastNameDirty] = useState(false);
  const [speciality, setSpeciality] = useState("");
  const [specialityDirty, setSpecialityDirty] = useState(false);
  const [permissions, setPermissions] = useState("");
  const [permissionsDirty, setPermissionsDirty] = useState(false);
  const [serverError, setServerError] = useState("");
  const invalidUserName = useMemo(
    () => validateInput(userName, "Name"),
    [userName],
  );
  const invalidLastName = useMemo(
    () => validateInput(lastName, "Lastname"),
    [lastName],
  );
  const invalidSpeciality = useMemo(
    () => validateInput(speciality, "Speciality"),
    [speciality],
  );
  const invalidPermissions = useMemo(
    () => validatePermissions(permissions),
    [permissions],
  );

  return (
    <Dialog
      allowClose={false}
      open={true}
      contents={
        <>
          <h2 className="welcome-header">Welcome to ExoFlex!</h2>
          <p className="text-center">
            Let's get started by entering your account informations:
          </p>
          <form
            className="welcome-name-form"
            onSubmit={(event) => {
              event.preventDefault();
              supaClient
                .from("user_profiles")
                .insert([
                  {
                    user_id: user.session?.user.id || "",
                    username: userName,
                    lastname: lastName,
                    speciality: speciality,
                    permissions: permissions,
                  },
                ])
                .then(({ error }) => {
                  if (error) {
                    // setServerError(`Username "${userName}" is already taken`);
                  } else {
                    const target = localStorage.getItem("returnPath") || "/";
                    localStorage.removeItem("returnPath");
                    navigate(target);
                    window.location.reload();
                  }
                });
            }}
          >
            <input
              name="username"
              placeholder="Name"
              onChange={({ target }) => {
                setUserName(target.value);
                if (!userNameDirty) {
                  setUserNameDirty(true);
                }
                if (serverError) {
                  setServerError("");
                }
              }}
              className="welcome-name-input"
            ></input>
            {userNameDirty && invalidUserName && (
              <p className="welcome-form-error-message validation-feedback">
                {invalidUserName}
              </p>
            )}
            <input
              name="lastname"
              placeholder="Lastname"
              onChange={({ target }) => {
                setLastName(target.value);
                if (!lastNameDirty) {
                  setLastNameDirty(true);
                }
                if (serverError) {
                  setServerError("");
                }
              }}
              className="welcome-name-input"
            ></input>
            {lastNameDirty && invalidLastName && (
              <p className="welcome-form-error-message validation-feedback">
                {invalidLastName}
              </p>
            )}
            <input
              name="speciality"
              placeholder="Speciality"
              onChange={({ target }) => {
                setSpeciality(target.value);
                if (!specialityDirty) {
                  setSpecialityDirty(true);
                }
                if (serverError) {
                  setServerError("");
                }
              }}
              className="welcome-name-input"
            ></input>
            {specialityDirty && invalidSpeciality && (
              <p className="welcome-form-error-message validation-feedback">
                {invalidSpeciality}
              </p>
            )}
            <select
              required
              name="permissions"
              className={
                permissionsDirty
                  ? "welcome-name-input"
                  : "welcome-name-input text-gray-400"
              }
              onChange={({ target }) => {
                setPermissions(target.value);
                if (!permissionsDirty) {
                  setPermissionsDirty(true);
                }
                if (serverError) {
                  setServerError("");
                }
              }}
            >
              <option value={""} disabled selected hidden>
                Permissions type
              </option>
              <option value={"super admin"} className="welcome-name-input">
                super admin
              </option>
              <option value={"admin"} className="welcome-name-input">
                admin
              </option>
              <option value={"client"} className="welcome-name-input">
                client
              </option>
            </select>

            <button
              className="welcome-form-submit-button"
              type="submit"
              disabled={
                invalidUserName != null ||
                invalidLastName != null ||
                invalidSpeciality != null ||
                invalidPermissions != null
              }
            >
              Submit
            </button>
          </form>
        </>
      }
    />
  );
}

/**
 * This only validates the form on the front end.
 * Server side validation is done at the sql level.
 */
function validateInput(value: string, fieldName: string): string | undefined {
  if (!value) {
    return `${fieldName} is required`;
  }
  const regex = /^[a-zA-ZÀ-ÿ]+$/;
  if (value.length < 4) {
    return `${fieldName} must be at least 4 characters long`;
  }
  if (value.length > 50) {
    return `${fieldName} must be less than 50 characters long`;
  }
  if (!regex.test(value)) {
    return `${fieldName} can only contain letters`;
  }
  return undefined;
}

function validatePermissions(permissions: string) {
  if (permissions == "") {
    return "You must select a permissions type";
  }
  return undefined;
}
