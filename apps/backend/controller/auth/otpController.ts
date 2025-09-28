import { Request, Response } from "express"
import { verifyOtp } from "../../services/otpService";
export const otpController = async (req: Request, res: Response) => {
    const { email, otp } = req.query;
    const verifyOtpResponse = await verifyOtp(email as string, otp as string);
    try {
        if(verifyOtpResponse) {
            return res.status(200).json({message: "sucess"});
        }
        return res.status(411).json({message: verifyOtpResponse});
    }catch(error) {
        console.log(error);
        return res.status(411).json({message: error});
    }

}