import { redis } from '../cache/redis'

export const verifyOtp = async (email: string, otp: string) => {
    const redisResponse = await redis.get(email);
    console.log(redisResponse)
    try {
    if(!redisResponse) {
        throw new Error('otp is Invalid');
    }
    if(otp === redisResponse) {
        await redis.getdel(email)
        return { sucess: true, message: "otp is valid"}
    }
    }catch(error) {
        throw new Error(error as string);
    }

}