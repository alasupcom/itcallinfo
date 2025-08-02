import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { z } from "zod";
import storage from "../storage";
import { insertUserSchema, User } from "../../shared/schema";
import { isAuthenticated, excludePassword } from "../middleware/auth";
import axios from "axios";
import { SipConfigAxiosClient } from '../services/sipConfigApi';
import crypto from 'crypto';

const router = Router();
const sipConfigClient = new SipConfigAxiosClient();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

router.post("/register", (async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName, phoneNumber } = registerSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
    });

    const sipConfig = await sipConfigClient.getNextAvailable();
    if (!sipConfig) {
      await storage.deleteUser(user.id);
      return res.status(400).json({ error: 'No SIP configuration available' });
    }

    const assignedConfig = await sipConfigClient.assignConfig(sipConfig.id, user.id, user.username, user.email);
    if (!assignedConfig) {
      await storage.deleteUser(user.id);
      return res.status(400).json({ error: 'Failed to assign SIP configuration' });
    }

    await storage.createSipConfig({
      userId: user.id,
      sipConfigId: assignedConfig.id
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

router.post("/verify-otp", (async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      res.status(400).json({ message: "userId and otp are required" });
      return;
    }

    const isVerified = await storage.verifyOTP(userId, otp);
    if (!isVerified) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}) as RequestHandler);

router.post("/login", ((req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: Error, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      await storage.updateUser(user.id, { status: "online" });

      return res.json({ user: excludePassword(user) });
    });
  })(req, res, next);
}) as RequestHandler);

router.post("/firebase", (async (req: Request, res: Response) => {
  try {
    const { firebaseUid, email, fullName, phoneNumber, avatarUrl } = req.body;

    if (!firebaseUid || !email) {
      res.status(400).json({ message: "Firebase UID and email are required" });
      return;
    }

    let user = await storage.getUserByGoogleId(firebaseUid);

    if (!user) {
      user = await storage.getUserByEmail(email);
    }

    if (user) {
      if (!user.googleId) {
        user = await storage.updateUser(user.id, { googleId: firebaseUid });
      }

      await storage.updateUser(user?.id!, { status: "online" });

      req.logIn(user as User, (err) => {
        if (err) {
          res.status(500).json({ message: "Login failed" });
          return;
        }
        res.json({ user: excludePassword(user as User) });
      });
    } else {
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      const password = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName: fullName || null,
        phoneNumber: phoneNumber || null,
        avatarUrl: avatarUrl || null,
        googleId: firebaseUid,
        status: 'active',
        isVerified: true
      });

      const sipConfig = await sipConfigClient.getNextAvailable();
      if (!sipConfig) {
        await storage.deleteUser(newUser.id);
        return res.status(400).json({ error: 'No SIP configuration available' });
      }

      const assignedConfig = await sipConfigClient.assignConfig(sipConfig.id, newUser.id, newUser.username, newUser.email);
      if (!assignedConfig) {
        await storage.deleteUser(newUser.id);
        return res.status(400).json({ error: 'Failed to assign SIP configuration' });
      }

      await storage.createSipConfig({
        userId: newUser.id,
        sipConfigId: assignedConfig.id
      });

      req.logIn(newUser, (err) => {
        if (err) {
          res.status(500).json({ message: "Login failed" });
          return;
        }
        res.json({ user: excludePassword(newUser) });
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}) as RequestHandler);

router.post("/logout", isAuthenticated, async (req: Request, res: Response) => {
  if (req.user) {
    await storage.updateUser((req.user as any).id, { status: "offline" });
  }

  req.logout((err) => {
    if (err) {
      res.status(500).json({ message: "Error logging out" });
      return;
    }
    res.json({ message: "Logged out successfully" });
  });
});

export default router;