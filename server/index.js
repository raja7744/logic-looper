import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import process from "process";

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
    const { email, score, timeTaken, date } = req.body;

    if (!email || score == null || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          score: 0
        }
      });
    }

    await prisma.result.create({
      data: {
        userId: user.id,
        score: Number(score),
        timeTaken: Number(timeTaken),
        date
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        score: {
          increment: Number(score)
        }
      }
    });

    res.json({ success: true });

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
