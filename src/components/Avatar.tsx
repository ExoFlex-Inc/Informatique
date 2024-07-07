import { supaClient } from "../hooks/supa-client.ts";
import Icon from '../../public/assets/user.png';
import { useState, useEffect } from "react";

interface AvatarProps {
    url: string;
    size: number;
    onUpload: Function
}

export default function Avatar({ url, size, onUpload }: AvatarProps){
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (url) downloadImage(url)
    }, [url])

    const downloadImage = async (path: string) => {
        console.log(path);
        try {
            const { data, error } = await supaClient.storage.from('avatars').download(path)
            console.log("error", error);
            if (error) {
              throw error
            }
            const url = URL.createObjectURL(data)
            setAvatarUrl(url)
          } catch (error: any) {
            console.log('Error downloading image: ', error.message)
          }
    }

    const uploadAvatar = async (event: any) => {
        try {
          setUploading(true)
          if (!event.target.files || event.target.files.length === 0) {
            throw new Error('You must select an image to upload.')
          }
    
          const file = event.target.files[0]
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${fileName}`
    
          let { error: uploadError } = await supaClient.storage.from('avatars').upload(filePath, file)
    
          if (uploadError) {
            throw uploadError
          }
    
          onUpload(filePath)
        } catch (error: any) {
          alert(error.message)
        } finally {
          setUploading(false)
        }
    }

    return (
        <div style={{ width: size }} aria-live="polite" className='container mx-auto text-center'>
           <div className="flex justify-center">
              <div className="flex flex-col justify-center shrink-0 relative">
                  <label htmlFor="files" className=" opacity-25 w-full h-full bg-gray-400 rounded-full flex justify-center absolute  cursor-pointer">
                    {/* <img src={camera} alt="" class="w-24 h-24 mt-5" /> */}
                  </label>
                  <img 
                    className="w-18 h-18 object-cover rounded-full" 
                    src={avatarUrl ? avatarUrl : Icon}
                    alt={avatarUrl ? 'Avatar' : 'No image'}
                    style={{ height: size, width: size }}
                   />
                   {uploading ? "Uploading..." : (
                     <>
                        <input 
                          type="file" 
                          id="files" 
                          accept="image/*"
                          className="hidden"
                          onChange={uploadAvatar}
                          disabled={uploading}/>
                     </>
                    )}
              </div>
            </div>
        </div>
      )
    
}