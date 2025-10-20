import { Router } from "express";
import {
  createToken,
  submitTokenTransaction,
  getToken,
  getTokenByUserId,
  getAllTokens,
  updateTokenPrice
} from "../controller/tokenController";

const router = Router();

router.post("/create", createToken);
router.post("/submit", submitTokenTransaction);

router.get("/", getAllTokens);


router.get("/:id", getToken);


router.get("/user/:userId", getTokenByUserId);


router.put("/:id/price", updateTokenPrice);

export default router;
