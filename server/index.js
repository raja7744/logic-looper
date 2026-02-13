import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://logic-looper-jet.vercel.app",
    "https://logic-looper-project.vercel.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Logic Looper API Running 🚀" });
});

app.post("/submit-score", async (req, res) => {
  try {
    const { email, score } = req.body;

    const user = await prisma.user.upsert({
      where: { email },
      update: { score },
      create: { email, score }
    });

    res.json({ success: true, user });

  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ error: "Failed to submit score" });
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { score: "desc" },
      take: 10
    });

    res.json(users);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = globalThis.process?.env?.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
