import {
  TextField,
  Autocomplete,
  InputAdornment,
  Button,
  Box,
  ThemeProvider,
  Paper,
  createTheme,
  TableContainer,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect } from "react";
import SendIcon from "@mui/icons-material/Send";
import { useUserProfile } from "../hooks/use-profile.ts";
import { set } from "rsuite/esm/internals/utils/date/index.js";

const ProfessionalNetwork = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const { profile } = useUserProfile();
  const [values, setValues] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [buttonDisable, setButtonDisable] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both admins and relations
      const adminsResponse = await fetch(
        "http://localhost:3001/user/admin?limit=50",
      );
      const adminsData = await adminsResponse.json();
      setAdmins(adminsData.admins);

      const relationsResponse = await fetch(
        `http://localhost:3001/relations/${profile.user_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const relationsData = await relationsResponse.json();
      setRelations(relationsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const sendRequestToAdmin = async () => {
    try {
      const response = await fetch("http://localhost:3001/relations/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          admin_id: selectedAdmin.user_id,
        }),
      });
      if (response.ok) {
        setValues(null);
        setButtonDisable(true);
        fetchData(); // Refresh after sending request
      } else {
        console.error("Error sending request:", await response.text());
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  const availableAdmins =
    Array.isArray(relations) && relations.length > 0
      ? admins.filter(
          (admin) =>
            !relations.some((relation) => relation.admin_id === admin.user_id),
        )
      : admins;

  return (
    <div className="flex flex-col gap-4">
      <div className="justify-center flex gap-4">
        <Autocomplete
          disablePortal
          id="combo-box"
          value={values}
          options={availableAdmins.map((admin) => admin.email)}
          onChange={(event, newValue) => {
            const admin = admins.find((admin) => admin.email === newValue);
            if (admin) {
              setSelectedAdmin(admin);
              setValues(admin.email);
              setButtonDisable(false);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              sx={{ width: 500 }}
              placeholder="Search email"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        <Button
          variant="contained"
          disabled={buttonDisable}
          color="info"
          endIcon={<SendIcon />}
          onClick={sendRequestToAdmin}
        >
          Send request
        </Button>
      </div>
      <label className="justify-center flex">List of professionals</label>
      <Box justifyContent="center" sx={{ display: "flex" }}>
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Professional Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.user_id}>
                    <TableCell>
                      {admin.first_name} {admin.last_name}
                    </TableCell>
                    <TableCell>
                      {relations &&
                      Array.isArray(relations) &&
                      relations.length > 0
                        ? relations.find(
                            (relation) => relation.admin_id === admin.user_id,
                          )?.relation_status || "Unknown"
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </ThemeProvider>
      </Box>
    </div>
  );
};

export default ProfessionalNetwork;
