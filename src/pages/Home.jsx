import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { motion as Motion } from "framer-motion";
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
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);

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

  // ---------------- STREAK CALC ----------------
  const calculateStreak = (history) => {
    let count = 0;
    let day = dayjs();

    while (history[day.format("YYYY-MM-DD")]) {
      count++;
      day = day.subtract(1, "day");
    }
    return count;
  };

  // ---------------- LOAD GAME DATA ----------------
  useEffect(() => {
    const loadGameData = async () => {
      const lastPlayedDate = await getData("lastPlayedDate");
      const storedScore = await getData("score");
      const storedHistory = (await getData("completionHistory")) || {};
      const storedCompleted = await getData("completed-" + seed);
      const storedHint = await getData("hintUsed-" + seed);

      setCompletionHistory(storedHistory);

      // Daily reset
      if (lastPlayedDate !== today) {
        setCompleted(false);
        setResult(null);
        setTime(0);
        setHintUsed(false);
        setShowHint(false);
        await saveData("lastPlayedDate", today);
      }

      if (storedScore !== undefined && storedScore !== null)
        setScore(storedScore);

      const updatedStreak = calculateStreak(storedHistory);
      setStreak(updatedStreak);

      if (storedCompleted && lastPlayedDate === today) {
        setCompleted(true);
        setResult("correct");
      }

      if (storedHint) {
        setHintUsed(true);
        setShowHint(true);
      }
    };

    loadGameData();
  }, [seed, today]);

  // ---------------- TIMER ----------------
  useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [completed]);

  // ---------------- HINT ----------------
  const getHint = () => {
    switch (puzzle.type) {
      case "math":
        return "Add all expressions carefully.";
      case "sequence":
        return "Look at the step difference.";
      case "binary":
        return "Convert decimal to binary.";
      case "grid":
        return "Observe the number pattern.";
      case "reverse":
        return "Reverse the digits.";
      default:
        return "Think logically.";
    }
  };

  const handleHint = async () => {
    if (hintUsed) return;

    setHintUsed(true);
    setShowHint(true);
    await saveData("hintUsed-" + seed, true);

    const reducedScore = Math.max(score - 5, 0);
    setScore(reducedScore);
    await saveData("score", reducedScore);
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!user || completed || !puzzle.answer) return;

    const isCorrect =
      puzzle.type === "binary"
        ? userAnswer.trim() === String(puzzle.answer)
        : Number(userAnswer) === Number(puzzle.answer);

    if (!isCorrect) {
      setResult("wrong");
      return;
    }

    setResult("correct");
    setCompleted(true);

    const difficultyMultiplier =
      puzzle.difficulty === "easy"
        ? 1
        : puzzle.difficulty === "medium"
        ? 1.5
        : 2;

    const pointsEarned = Math.max(
      Math.floor((100 - time) * difficultyMultiplier),
      10
    );

    const newScore = score + pointsEarned;
    setScore(newScore);

    await saveData("score", newScore);
    await saveData("completed-" + seed, true);
    await saveData("lastPlayedDate", today);

    const history = { ...completionHistory };
    history[today] = true;

    await saveData("completionHistory", history);
    setCompletionHistory(history);

    const updatedStreak = calculateStreak(history);
    setStreak(updatedStreak);
    await saveData("streak", updatedStreak);

    try {
      await fetch(
        "https://logic-looper-backend.onrender.com/submit-score",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            score: newScore,
            timeTaken: time,
            date: today,
          }),
        }
      );
    } catch (error) {
      console.error("Backend error:", error);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl p-6 text-center text-white">

        <h1 className="text-3xl font-bold mb-4">Logic Looper</h1>

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
              className="mb-4 w-full bg-gray-700 p-2 rounded"
            >
              Logout
            </button>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-gray-800 p-3 rounded-xl">
            🔥 Streak
            <div className="text-orange-400 font-bold">{streak}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            ⭐ Score
            <div className="text-green-400 font-bold">{score}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            ⏱ Time
            <div className="text-blue-400 font-bold">{time}s</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            🧩 Type
            <div className="capitalize">{puzzle.type}</div>
          </div>
        </div>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-xl font-semibold space-y-2"
        >
          {Array.isArray(puzzle.question) &&
            puzzle.question.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          <div>?</div>
        </Motion.div>

        <button
          onClick={handleHint}
          disabled={hintUsed}
          className="w-full bg-yellow-500 p-2 rounded mb-3 disabled:opacity-50"
        >
          {hintUsed ? "Hint Used" : "Get Hint"}
        </button>

        {showHint && (
          <p className="text-yellow-400 mb-3">{getHint()}</p>
        )}

        <input
          type="text"
          value={userAnswer}
          disabled={!user || completed}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-3 rounded text-black mb-4"
          placeholder="Enter your answer"
        />

        <button
          onClick={handleSubmit}
          disabled={!user || completed}
          className="w-full bg-blue-600 p-3 rounded"
        >
          Submit
        </button>

        {result && (
          <p className={`mt-4 text-lg font-semibold ${
            result === "correct"
              ? "text-green-400"
              : "text-red-400"
          }`}>
            {result === "correct"
              ? "Correct! 🎉"
              : "Wrong answer ❌"}
          </p>
        )}

        <Link to="/leaderboard">
          <button className="mt-6 w-full bg-purple-600 p-3 rounded">
            View Leaderboard 🏆
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
