import { TextField, Autocomplete, InputAdornment, Button, Box, ThemeProvider, Paper, createTheme, TableContainer, Table, TableHead, TableCell, TableRow, TableBody } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect } from "react";
import { supaClient } from "../hooks/supa-client.ts";
import SendIcon from '@mui/icons-material/Send';
import { useProfileContext } from "../context/profileContext.tsx";


const ProfessionalNetwork = () => {
    const [admins, setAdmins] = useState<any[]>([]);
    const [visibleAdmins, setVisibleAdmins] = useState<any[]>([]);
    const [tableAdmins, setTableAdmins] = useState<any[]>([]);
    const [relations, setRelations] = useState<any[]>([]);

    const {profile} = useProfileContext();
    const [values, setValues] = useState<string | null>(null);

    const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
    const [buttonDisable, setButtonDisable] = useState(true);

    useEffect(() => {
        const fetchAllAdmins = async () => {
            const { data, error } = await supaClient
                .from("user_profiles")
                .select()
                .eq("permissions", "admin")
                .limit(50)        
            if (error) {
                console.error("Error fetching emails:", error.message);
            } else {
                setAdmins(data);
            }
        };
        fetchAllAdmins();
    }, []);

    useEffect(() => {
        if(admins){
            fetchRelation();
        }
    }, [admins])

    useEffect(() => {
        if(selectedAdmin) {
            setButtonDisable(false);
        } else {
            setButtonDisable(true);
        }
    },[selectedAdmin])

    const fetchRelation = async () => {
        if (profile) {
            const { data, error } = await supaClient
                .from("admin_client")
                .select()
                .eq("client_id", profile?.user_id)
            if (error) {
                console.error("Error fetching client ID:", error.message);
            } else {
                if(data) {
                    const searchBarAdmins = admins.filter((admin) => !data.some((element) => admin.user_id === element.admin_id));
                    const tableAdmins = admins.filter((admin) => data.some((element) => admin.user_id === element.admin_id));
                    setVisibleAdmins(searchBarAdmins);
                    setTableAdmins(tableAdmins);
                    setRelations(data);        
                }
            }
        }
    }

    const sendRequest = async () => {
        const {error} = await supaClient
            .from("admin_client")
            .insert({admin_id: selectedAdmin.user_id, client_id: profile?.user_id, relation_status: 'pending'})
        if (error) {
            throw error;
        }
        setValues(null);
        setButtonDisable(true);
        fetchRelation();
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="justify-center flex gap-4">
                <Autocomplete
                    disablePortal
                    id="combo-box"
                    value={values}
                    options={visibleAdmins.map((admin) => admin.email)}
                    onInputChange={(event: any) => {
                        if(event) {
                            const admin = admins.find((admin) => admin.email == event.target.textContent);
                            if(admin) {
                                setSelectedAdmin(admin);
                                setValues(admin.email);
                            }
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            size="small"
                            sx={{width: 500}}
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
                <Button variant="contained"
                    disabled={buttonDisable}
                    color="info"
                    endIcon={<SendIcon />}
                    onClick={sendRequest}
                >
                    Send request
                </Button>
            </div>
            <label className="justify-center flex">List of professional</label>
            <Box justifyContent="center" sx={{ display: 'flex' }}>
                <ThemeProvider
                theme={createTheme({
                    palette: {
                    mode: 'light',
                    primary: { main: 'rgb(102, 157, 246)' },
                    background: { paper: 'rgb(235, 235, 235)' },
                    },
                })}
                >
                    <Paper sx={{width: '40vw'}}>
                        <Table>
                            <TableHead >
                                <TableRow>
                                    <TableCell>Professional Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Email</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tableAdmins.map((admin) => (
                                    <TableRow key={admin.user_id} >
                                        <TableCell>{admin.username} {admin.lastname}</TableCell>
                                        <TableCell>{relations.find((relation) => relation.admin_id == admin.user_id).relation_status}</TableCell>
                                        <TableCell>{admin.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </ThemeProvider>
            </Box>
        </div>
        
    )
}

export default ProfessionalNetwork