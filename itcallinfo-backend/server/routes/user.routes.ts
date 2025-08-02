import { Router, Request, Response } from "express";
import storage from "../storage";
import { isAuthenticated, excludePassword } from "../middleware/auth";

const router = Router();

router.get("/", isAuthenticated, (req: Request, res: Response) => {
  const userData = excludePassword(req.user as any);
  res.json(userData);
});

router.patch("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const updateData = req.body;

    delete updateData.password;
    delete updateData.id;
    delete updateData.isVerified;
    delete updateData.otp;
    delete updateData.otpExpiresAt;

    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
       res.status(404).json({ message: "User not found" });
       return;
    }

     res.json(excludePassword(updatedUser));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;