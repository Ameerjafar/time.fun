import { Router } from "express";
import {
  createToken,
  submitTokenTransaction,
  getToken,
  getTokenByUserId,
  getAllTokens,
  updateTokenPrice,
  prepareBuyTokenTransaction,
  prepareSellTokenTransaction,
  submitBuySellTransaction
} from "../controller/tokenController";

const router = Router();

router.post("/create", createToken);
router.post("/submit", submitTokenTransaction);
router.post("/buy/prepare", prepareBuyTokenTransaction);
router.post("/sell/prepare", prepareSellTokenTransaction);
router.post("/trade/submit", submitBuySellTransaction);

router.get("/", getAllTokens);

router.get("/:id", getToken);

router.get("/user/:userId", getTokenByUserId);

router.put("/:id/price", updateTokenPrice);

export default router;
