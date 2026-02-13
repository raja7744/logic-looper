import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getDailySeed } from "../utils/seed";
import { generateDailyPuzzle } from "../puzzles";
import { saveData, getData } from "../services/indexedDB";

import { auth, provider } from "../services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

function Home() {
  const seed = getDailySeed();
  const today = dayjs().format("YYYY-MM-DD");

  // ---------------- STATE ----------------
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [time, setTime] = useState(0);
  const [completionHistory, setCompletionHistory] = useState({});

  const puzzle = generateDailyPuzzle(seed, streak) || {};

  // ---------------- AUTH ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ---------------- STREAK CALCULATOR ----------------
  function calculateStreak(history) {
    let count = 0;
    let day = dayjs();

    while (history[day.format("YYYY-MM-DD")]) {
      count++;
      day = day.subtract(1, "day");
    }

    return count;
  }

  // ---------------- LOAD GAME DATA ----------------
  useEffect(() => {
    async function loadGameData() {
      const lastPlayedDate = await getData("lastPlayedDate");
      const storedScore = await getData("score");
      const storedHistory = (await getData("completionHistory")) || {};
      const storedCompleted = await getData("completed-" + seed);

      setCompletionHistory(storedHistory);

      // Daily reset logic
      if (lastPlayedDate !== today) {
        setCompleted(false);
        setResult(null);
        setTime(0);
        await saveData("lastPlayedDate", today);
      }

      if (storedScore !== undefined) setScore(storedScore);

      const updatedStreak = calculateStreak(storedHistory);
      setStreak(updatedStreak);
      await saveData("streak", updatedStreak);

      if (storedCompleted && lastPlayedDate === today) {
        setCompleted(true);
        setResult("correct");
      }
    }

    loadGameData();
  }, [seed]);

  // ---------------- TIMER ----------------
  useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [completed]);

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!user || completed) return;

    let isCorrect = false;

    if (puzzle.type === "binary") {
      isCorrect = userAnswer.trim() === String(puzzle.answer);
    } else {
      isCorrect = Number(userAnswer) === Number(puzzle.answer);
    }

    if (!isCorrect) {
      setResult("wrong");
      return;
    }

    // Correct answer
    setResult("correct");
    setCompleted(true);

    const difficultyMultiplier =
  puzzle.difficulty === "easy" ? 1 :
  puzzle.difficulty === "medium" ? 1.5 :
  2;

const pointsEarned = Math.max(
  Math.floor((100 - time) * difficultyMultiplier),
  10
);

    const newScore = score + pointsEarned;

    setScore(newScore);
    await saveData("score", newScore);
    await saveData("completed-" + seed, true);
    await saveData("lastPlayedDate", today);

    // Update completion history
    const history = (await getData("completionHistory")) || {};
    history[today] = true;

    await saveData("completionHistory", history);
    setCompletionHistory(history);

    const updatedStreak = calculateStreak(history);
    setStreak(updatedStreak);
    await saveData("streak", updatedStreak);

    // Backend submit
    try {
      await fetch("https://logic-looper-backend.onrender.com/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          score: newScore,
          timeTaken: time,
          date: today,
        }),
      });
    } catch (error) {
      console.error("Backend error:", error);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center w-[350px]">

        <h1 className="text-4xl font-bold mb-2">Logic Looper</h1>

        {!user ? (
          <button
            onClick={handleLogin}
            className="mb-4 w-full bg-red-600 hover:bg-red-700 p-3 rounded"
          >
            Sign in with Google
          </button>
        ) : (
          <>
            <p className="mb-2 text-green-400">
              Logged in as {user.email}
            </p>
            <button
              onClick={handleLogout}
              className="mb-4 w-full bg-gray-700 hover:bg-gray-800 p-2 rounded"
            >
              Logout
            </button>
          </>
        )}

        <p className="mb-2 text-gray-400">
          🧩 Type: {puzzle.type || "Unknown"}
        </p>

        <p className="mb-2 text-orange-400">
          🔥 Streak: {streak}
        </p>

        <p className="mb-2 text-green-400">
          ⭐ Score: {score}
        </p>

        <p className="mb-4 text-blue-400">
          ⏱ Time: {time}s
        </p>

        {/* HEATMAP */}
        <div className="grid grid-cols-7 gap-1 justify-center mb-4">
          {Object.keys(completionHistory)
            .slice(-21)
            .map((date) => (
              <div
                key={date}
                className="w-4 h-4 rounded bg-green-500"
              />
            ))}
        </div>

        <div className="mb-6 text-xl font-semibold space-y-2">
          {Array.isArray(puzzle.question) &&
            puzzle.question.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          <div className="mt-2">?</div>
        </div>

        <input
          type="text"
          value={userAnswer}
          disabled={!user || completed}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-3 text-black rounded mb-4 disabled:opacity-50"
          placeholder="Enter your answer"
        />

        <button
          onClick={handleSubmit}
          disabled={!user || completed}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded transition disabled:opacity-50"
        >
          Submit
        </button>

        {result === "correct" && (
          <p className="mt-4 text-green-400 text-lg">
            Correct! 🎉
          </p>
        )}

        {result === "wrong" && (
          <p className="mt-4 text-red-400 text-lg">
            Wrong answer ❌
          </p>
        )}

        <Link to="/leaderboard">
          <button className="mt-6 w-full bg-purple-600 hover:bg-purple-700 p-3 rounded transition">
            View Leaderboard 🏆
          </button>
        </Link>

      </div>
    </div>
  );
}

export default Home;
