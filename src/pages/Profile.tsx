import { useState, useRef } from "react";
import {
  Avatar,
  IconButton,
  Badge,
  BadgeProps,
  Grid,
  ListItem,
  Divider,
  createTheme,
  Box,
  ThemeProvider,
  ListItemText,
  Paper,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material";
import DefaultProfilePic from "../../public/assets/user.png";
import { useAvatar } from "../hooks/use-avatar.ts";
import { useAvatarContext } from "../context/avatarContext.tsx";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { supaClient } from "../hooks/supa-client.ts";
import { useUserProfile } from "../hooks/use-profile.ts";
import { useQueryClient } from "@tanstack/react-query";

function Profile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage } = useAvatar();
  const { avatarUrl } = useAvatarContext();
  const [FieldError, setFieldError] = useState(false);
  const [fieldInput, setFieldInput] = useState("");
  const [editIndex, setEditIndex] = useState<Number | null>(null);

  const queryClient = useQueryClient();
  const { profile, updateProfile } = useUserProfile();

  function toggleEdit(index: Number) {
    setEditIndex(index === editIndex ? null : index);
  }

  const shownInformation: any = {
    first_name: "First Name",
    last_name: "Last Name",
    speciality: "Speciality",
    phone_number: "Phone Number",
  };

  const StyledBadge = styled(Badge)<BadgeProps>(() => ({
    "& .MuiBadge-badge": {
      border: "2px solid ",
      borderRadius: "9999px",
      height: "40px",
      width: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
    },
  }));

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onInputSubmit = async (key: string) => {
    if (fieldInput.length === 0) {
      setFieldError(true);
      return;
    }

    try {
      updateProfile({ ...profile, [key]: fieldInput });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setEditIndex(null);
      setFieldInput("");
      setFieldError(false);
    }
  };

  const onCancelEdit = () => {
    setEditIndex(null);
    setFieldError(false);
  };

  return (
    <div className="flex">
      <IconButton className="hover:opacity-50 m-4" onClick={handleButtonClick}>
        <StyledBadge
          overlap="circular"
          color="info"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={<AddAPhotoIcon padding="4px" className="h-28" />}
        >
          <Avatar
            src={avatarUrl ? avatarUrl : DefaultProfilePic}
            sx={{ width: "25vw", height: "25vw" }}
          />
        </StyledBadge>
        <input
          type="file"
          ref={fileInputRef}
          id="files"
          accept="image/*"
          className="hidden"
          onChange={uploadImage}
        />
      </IconButton>
      <Box sx={{ display: "flex", margin: "16px" }}>
        <ThemeProvider
          theme={createTheme({
            palette: {
              mode: "light",
              primary: { main: "rgb(102, 157, 246)" },
              background: { paper: "rgb(235, 235, 235)" },
            },
          })}
        >
          <Paper sx={{ width: "40vw" }}>
            {profile &&
              Object.keys(shownInformation).map((key, index) => (
                <div key={index}>
                  <ListItem>
                    <Grid container spacing={0.5} alignItems="center">
                      <Grid xs={4} item>
                        <ListItemText primary={`${shownInformation[key]}: `} />
                      </Grid>
                      <Grid xs={6} item>
                        {editIndex === index ? (
                          <TextField
                            error={FieldError ? true : false}
                            label={shownInformation[key]}
                            size="small"
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                onInputSubmit(key);
                              }
                            }}
                            onChange={(event) =>
                              setFieldInput(event.target.value)
                            }
                            defaultValue={profile[key as keyof typeof profile]}
                          />
                        ) : (
                          <ListItemText
                            primary={`${profile[key as keyof typeof profile]}`}
                          />
                        )}
                      </Grid>
                      <Grid xs={2} item>
                        {editIndex === index ? (
                          <Grid container>
                            <Grid xs={6} item>
                              <IconButton
                                color="success"
                                className="rounded-full"
                                onClick={() => onInputSubmit(key)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Grid>
                            <Grid xs={6} item>
                              <IconButton
                                color="error"
                                className="rounded-full"
                                onClick={onCancelEdit}
                              >
                                <CloseIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        ) : (
                          <IconButton
                            className="rounded-full"
                            onClick={() => toggleEdit(index)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </ListItem>
                  <Divider />
                </div>
              ))}
          </Paper>
        </ThemeProvider>
      </Box>
    </div>
  );
}

export default Profile;