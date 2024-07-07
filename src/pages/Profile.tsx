import { useState, useEffect, useRef } from "react";
import { supaClient } from "../hooks/supa-client.ts";
import { Avatar, IconButton, ExtendButtonBase, IconButtonTypeMap } from "@mui/material";

function Profile() {

    const [avatarurl, setAvatarUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        async function getAvatarUrl () {
    
          try {
            const {
              data: { user },
            } = await supaClient.auth.getUser();
    
            if (!user) {
              console.error("Forbidden")
            }
      
            const { data: profile, error } = await supaClient
              .from("user_profiles")
              .select("*")
              .eq("user_id", user?.id);
      
            if (!profile || error) {
              console.error("Forbidden")
            } else {
              setAvatarUrl(`${profile[0].avatar_url}`);
            }
    
          } catch (error) {
            console.log("Error retrieving reporter profile",error)
          }
    
        }
        getAvatarUrl();
      }, []);

    
    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current?.click();
        }
    }

    const uploadImage = async (event: any) => {
        console.log("event", event);

        const file = event.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`
        
        console.log("file",file);
        console.log("filePath", filePath);

        let { error: uploadError } = await supaClient.storage.from('avatars').upload(filePath, file)

        console.log("error", uploadError);
    }

    return ( 
        <div>
            <IconButton onClick={handleButtonClick}>
                <Avatar src="../../../public/assets/user.png" />
                <input type="file" ref={fileInputRef} id="files" accept="image/*" className="hidden" onChange={uploadImage}/>
            </IconButton>
        </div>
     );
}

export default Profile;