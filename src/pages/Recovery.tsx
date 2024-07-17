import { useState } from "react";
import Dialog from "../components/Dialog.tsx";
import { supaClient } from "../hooks/supa-client.ts";
import { useNavigate } from "react-router-dom";

const Recovery = () => {
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');
    const navigate = useNavigate();

    return (
        <Dialog
            allowClose={false}
            open={true}
            contents={
            <>
                <h2 className="welcome-header">Change your password</h2>
                <form
                className="welcome-name-form"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if( password !== retypePassword ) {
                        console.error("The passwords are not the same");
                        window.alert("The passwords are not the same");
                    } else {
                        const {data, error} = await supaClient.auth.updateUser({
                            password
                        })
                        if (error) {
                            throw error;
                        }
                        navigate('/');
                        console.log("Data", data);
                    }
                }}
                >
                <input
                    name="password"
                    placeholder="Password"
                    type="password"
                    onChange={({ target }) => {
                        setPassword(target.value);
                    }}
                    className="welcome-name-input"
                ></input>
                <input
                    name="lastname"
                    placeholder="Retype Password"
                    type="password"
                    onChange={({ target }) => {
                        setRetypePassword(target.value);
                    }}
                    className="welcome-name-input"
                ></input>
    
                <button
                    className="welcome-form-submit-button"
                    type="submit"
                    disabled={
                        password == '' ||
                        retypePassword == ''
                    }
                >
                    Submit
                </button>
                </form>
            </>
            }
        />
    )
}

export default Recovery;