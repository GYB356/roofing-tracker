import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@prisma/client";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Initialize passport middleware first
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          log(`Failed login attempt for username: ${username}`);
          return done(null, false);
        }
        log(`Successful login for user: ${user.id}`);
        // Exclude password from the returned user object
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (err) {
        const error = err as Error;
        log(`Authentication error: ${error.message}`);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    log(`Serializing user session: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        log(`Failed to deserialize user ${id}: User not found`);
        return done(null, false);
      }
      log(`Successfully deserialized user: ${id}`);
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (err) {
      const error = err as Error;
      log(`Deserialization error for user ${id}: ${error.message}`);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        log(`Registration failed: Username ${req.body.username} already exists`);
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      log(`New user registered: ${user.id}`);

      req.login(userWithoutPassword, (err) => {
        if (err) {
          log(`Error during login after registration: ${err.message}`);
          return next(err);
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      const error = err as Error;
      log(`Registration error: ${error.message}`);
      return next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
      if (err) {
        log(`Login error: ${err.message}`);
        return next(err);
      }
      if (!user) {
        log(`Login failed: Invalid credentials for ${req.body.username}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          log(`Session creation error: ${err.message}`);
          return next(err);
        }
        log(`User ${user.id} successfully logged in`);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    req.logout((err) => {
      if (err) {
        log(`Logout error for user ${userId}: ${err.message}`);
        return next(err);
      }
      log(`User ${userId} successfully logged out`);
      return res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      log(`Unauthenticated access attempt to /api/user`);
      return res.status(401).json({ error: "Not authenticated" });
    }
    log(`Session validated for user ${req.user.id}`);
    return res.json(req.user);
  });
}