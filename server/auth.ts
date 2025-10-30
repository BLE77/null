import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { dbStorage } from "./db-storage";
import type { User } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export function setupAuth(app: Express) {
  const usePgStore = app.get("env") === "production" || !!process.env.VERCEL;

  const baseCookie: session.CookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: usePgStore ? "lax" : "lax",
  };

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "y2k-secret-key-2001",
    resave: false,
    saveUninitialized: false,
    cookie: baseCookie,
    store: usePgStore
      ? new (connectPgSimple(session))({
          conString: process.env.DATABASE_URL,
          createTableIfMissing: true,
          tableName: "session",
        })
      : new MemoryStore({
          checkPeriod: 86400000,
        }),
  };

  if (usePgStore) {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await dbStorage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValid = await dbStorage.verifyPassword(user, password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await dbStorage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    const user = req.user as User;
    if (user.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: "Admin access required" });
  }
  res.status(401).json({ message: "Authentication required" });
};
