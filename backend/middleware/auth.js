import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    req.body.userId = "guest"; // fallback for public access
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = decoded.id;
    next();
  } catch (error) {
    console.log("Token error:", error.message);
    req.body.userId = "guest"; // fallback if token fails
    next();
  }
};

export default authMiddleware;
