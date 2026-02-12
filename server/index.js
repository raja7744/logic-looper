import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Logic Looper API Running 🚀" });
});

// Create user
app.post("/user", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.create({
      data: { email }
    });

    res.json(user);
  } catch (err) {
    console.error("User creation error:", err);
    res.status(400).json({ error: "User already exists" });
  }
});


// Leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { score: "desc" },
      take: 10,
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/leaderboard", async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { score: "desc" },
    take: 10,
  });

  res.json(users);
});

app.post("/submit-score", async (req, res) => {
  try {
    console.log("Body received:", req.body);

    const { email, score } = req.body; // ignore timeTaken & date

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        score: score,
      },
      create: {
        email,
        score,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ error: "Failed to submit score" });
  }
});


