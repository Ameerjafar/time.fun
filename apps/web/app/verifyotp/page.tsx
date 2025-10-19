'use client'

import { useState } from "react";
import { motion } from "framer-motion";
import axios from 'axios';
import { useRouter } from "next/navigation";
const OTPPage = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const router = useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // auto focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const email = localStorage.get("userEmail");
    const response = await axios.get(`http://localhost:5000/auth/verifyotp?email=${email}&otp=${otp}`);
    if(!response) {
      console.log("something went wrong");
    }
    router.push('/')
    alert(`Entered OTP: ${otp.join("")}`);
  };
  const reSendHandler = async () => {
    const email = localStorage.get("userEmail");
    const response = await axios.get(`http://localhost:5000/auth/sendemail?email=${email}`);
    if(!response) {
      console.log("something went wrong");
    }
    else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-primary rounded-3xl p-10 shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-primaryText text-center mb-6">
          Enter OTP
        </h1>
        <p className="text-center text-primaryText mb-8">
          We have sent a 4-digit OTP to your registered number/email
        </p>

        <div className="flex justify-between mb-6 space-x-3">
          {otp.map((num, i) => (
            <motion.input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              value={num}
              onChange={(e) => handleChange(e, i)}
              whileFocus={{ scale: 1.2, borderColor: "#00FF88" }}
              className="w-16 h-16 text-2xl text-center rounded-lg bg-secondary/10 border-2 border-secondary text-primary font-bold outline-none transition-all duration-300"
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          className="w-full py-3 bg-secondary rounded-lg text-primary font-semibold text-lg transition-colors duration-300 hover:bg-secondary/80"
        >
          Verify OTP
        </motion.button>

        <button onClick = { reSendHandler } className="text-center text-primaryText mt-4">
          Didn't receive OTP?{" "}
          <span className="text-secondary font-bold cursor-pointer hover:underline">
            Resend
          </span>
        </button>
      </motion.div>
    </div>
  );
};

export default OTPPage;
