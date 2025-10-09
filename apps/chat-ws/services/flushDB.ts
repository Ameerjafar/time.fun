import { prisma } from "@repo/db";

export const flushBatchToDB = async (messages: any[]) => {
  if (!messages || messages.length === 0) return;
  const response = await prisma.message.createMany({
    data: messages,
  });
  console.log("messageData", response);

  return response;
};
