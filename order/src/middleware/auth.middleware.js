import jwt from "jsonwebtoken";

export default function createAuthMiddleware(allowedRoles = ["user"]) {
  return function authMiddleware(req, res, next) {
    try {
      const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const secret = process.env.JWT_SECRET || "test_jwt_secret";

      let decoded;
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRole = decoded.role;
        if (userRole && !allowedRoles.includes(userRole)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const userId = decoded.id || decoded.userId || decoded.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid token: no user id" });
      }

      req.user = {
        id: userId,
        role: decoded.role,
        ...decoded,
      };

      return next();
    } catch (error) {
      console.error("Auth error", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
