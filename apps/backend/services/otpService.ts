import { redis } from '../cache/redis'

export const verifyOtp = async (email: string, otp: string) => {
    const redisResponse = await redis.get(email);
    const encryptOtp = otp.split(",").join("");
    console.log("redisResponse", redisResponse)
    try {
    if(!redisResponse) {
        throw new Error('otp is Invalid');
    }
    if(encryptOtp === redisResponse) {
        await redis.getdel(email)
        return { success: true, message: "otp is valid"}
    }
    }catch(error) {
        throw new Error(error as string);
    }

}