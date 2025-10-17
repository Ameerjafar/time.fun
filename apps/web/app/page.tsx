"use client";
import { Card } from './ui/Card';
// import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";



const Home = () => {

  const TWITTER_CLIENT_ID = process.env.NEXT_PUBLIC_TWITTER_CLIEND_ID;
  console.log("twitter client id", process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID!)
  function generateCodeVerifier(length = 128) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  function base64urlencode(buffer: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  async function generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return base64urlencode(digest);
  }

  const twitterHandler = async () => {
    const rootUrl = "https://twitter.com/i/oauth2/authorize";
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    sessionStorage.setItem("code_verifier", codeVerifier);

    const params = {
      redirect_uri: "http://localhost:3000/oauth/twitter",
      client_id: TWITTER_CLIENT_ID!,
      state: "state",
      response_type: "code",
      code_challenge: codeChallenge,
      code_challenge_method: "S256", 
      scope: ["users.read", "tweet.read", "follows.read", "follows.write"].join(
        " "
      ),
    };

    const qs = new URLSearchParams(params).toString();
    window.location.href = `${rootUrl}?${qs}`;
    console.log('find who is this one');
  };

  return (
    <div>
      {/* <button onClick={twitterHandler}>Login with Twitter</button>
      <WalletMultiButton />
      <WalletDisconnectButton /> */}
      <div className = 'bg-black'><Card price={0.34} name="Ameer Jafar" rating={4.2} description="he is good developer"  imageUrl = "https://picsum.photos/800/600"/></div>
    </div>
  );
};

export default Home;
