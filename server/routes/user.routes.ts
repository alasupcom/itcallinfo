import { Router, Request, Response } from "express";
import storage from "../storage";
import { isAuthenticated, excludePassword } from "../middleware/auth";

const router = Router();

/**
 * Get current user's profile
 * GET /api/user
 */
router.get("/", isAuthenticated, (req: Request, res: Response) => {
   res.json(excludePassword(req.user as any));
});

/**
 * Update current user's profile
 * PATCH /api/user
 */
router.patch("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const updateData = req.body;

    // Don't allow updating sensitive fields directly
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