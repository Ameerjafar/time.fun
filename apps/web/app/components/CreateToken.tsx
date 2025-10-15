import { useState } from "react";

export const CreateToken = () => {
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imageUrl, setImagUrl] = useState<string>("");
  return (
    <div> 
      <div>name</div>
      <input
        placeholder="name"
        type="text"
        onChange={(e) => setName(e.target.value)}
      ></input>
      <div>symbol</div>
      <input
        placeholder="eg.BTC"
        type="text"
        onChange={(e) => setSymbol(e.target.value)}
      ></input>
      <div>description optional</div>
      <input
        placeholder="name"
        type="text"
        onChange={(e) => setDescription(e.target.value)}
      ></input>
      <div>imageUrl</div>
      <input
        placeholder="Enter your image url of your coin"
        type="text"
        onChange={(e) => setImagUrl(e.target.value)}
      ></input>
      <button type="submit"></button>
    </div>
  );
};
