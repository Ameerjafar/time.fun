export const getUsersTwitterName = async (accessToken: any) => {
    try {
      const response = await fetch("https://api.twitter.com/2/users/me", {
        method: "GET",
        headers: {
          authorization: `BEARER ${accessToken}`,
        },
      });
      const responseJson = await response.json();
      console.log(responseJson);
      return responseJson;
    } catch (error: unknown) {
      throw new Error("this the error we are getting");
    }
  };