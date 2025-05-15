import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { z } from "zod";
import storage from "../storage";
import { insertUserSchema, User } from "../../shared/schema";
import { isAuthenticated, excludePassword } from "../middleware/auth";

const router = Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await storage.getUserByUsername(userData.username) ||
      await storage.getUserByEmail(userData.email);

    if (existingUser) {
      res.status(400).json({ message: "Username or email already exists" });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Generate OTP for verification
    const otp = await storage.generateAndSaveOTP(user.id);

    // Create a default SIP configuration for the user
    await storage.createSipConfig({
      userId: user.id,
      domain: "demo.itcallinfo.info",
      username: '7052',
      password: "jhIPERCOMc36c961326f0U", // In production, generate a secure password
      server: "demo.itcallinfo.info",
      port: 8089,
      transport: "ws",
      iceServers: { urls: ["stun:stun.l.google.com:19302"] }
    });

    // Return user and OTP
    res.status(201).json({
      user: excludePassword(user),
      otp // In production, don't send OTP in response
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
router.post("/verify-otp", async (req: Request, res: Response) => {
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
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
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

      // Update user status to online
      await storage.updateUser(user.id, { status: "online" });

      return res.json({ user: excludePassword(user) });
    });
  })(req, res, next);
});

/**
 * Firebase authentication
 * POST /api/auth/firebase
 */
router.post("/firebase", async (req: Request, res: Response) => {
  try {
    const { firebaseUid, email, fullName, phoneNumber, avatarUrl } = req.body;

    if (!firebaseUid || !email) {
      res.status(400).json({ message: "Firebase UID and email are required" });
      return;
    }

    // Check if user exists by Google ID or email
    let user = await storage.getUserByGoogleId(firebaseUid);

    if (!user) {
      user = await storage.getUserByEmail(email);
      return;
    }

    if (user) {
      // User exists, update Firebase UID if needed and login
      if (!user.googleId) {
        user = await storage.updateUser(user.id, { googleId: firebaseUid });
        return;
      }

      // Update user status to online
      await storage.updateUser(user?.id!, { status: "online" });

      req.logIn(user as User, (err) => {
        if (err) {
          res.status(500).json({ message: "Login failed" });
          return;
        }
        res.json({ user: excludePassword(user as User) });
      });
    } else {
      // Create new user with random username based on email
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      // Generate a random password since we'll use Firebase for auth
      const password = require('crypto').randomBytes(16).toString('hex');
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

      await storage.createSipConfig({
        userId: newUser.id,
        domain: "demo.itcallinfo.info",
        username: '7052',
        password: "jhIPERCOMc36c961326f0U", // In production, generate a secure password
        server: "demo.itcallinfo.info",
        port: 8089,
        transport: "ws",
        iceServers: { urls: ["stun:stun.l.google.com:19302"] }
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
    console.error("Firebase auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post("/logout", isAuthenticated, async (req: Request, res: Response) => {
  // Update user status to offline
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