
'use client'
import axios from "axios";
import { useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

const TwitterHandler = () => {
    const params = useSearchParams();
    const accessCode = params.get("code");
    const [name, setName ] = useState<string>("");
    useEffect(() => {
        console.log("twitter handler")
        const codeVerifier = sessionStorage.getItem("code_verifier");
        const twitterCallBack = async () => {
            const response = await axios.post(`http://localhost:5000/auth/twitter/callback?code=${accessCode}`, {
                codeVerifier
            });
            console.log(response.data.message);
            setName(response.data.message)
        }
        twitterCallBack();
    }, [])
    return (
        <div>
            { name }
        </div>
    )
}


export default TwitterHandler;