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

      if (storedScore !== undefined) setScore(storedScore);

      const updatedStreak = calculateStreak(storedHistory);
      setStreak(updatedStreak);
      await saveData("streak", updatedStreak);

      if (storedCompleted && lastPlayedDate === today) {
        setCompleted(true);
        setResult("correct");
      }

      if (storedHint) {
        setHintUsed(true);
        setShowHint(true);
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
    if (!user || completed) return;

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

    const history = (await getData("completionHistory")) || {};
    history[today] = true;

    await saveData("completionHistory", history);
    setCompletionHistory(history);

    const updatedStreak = calculateStreak(history);
    setStreak(updatedStreak);
    await saveData("streak", updatedStreak);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
  <div className="w-full max-w-md bg-gray-850 backdrop-blur-md rounded-2xl shadow-2xl p-6 text-center text-white animate-fadeIn">


        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-wide">
  Logic Looper
</h1>


        {!user ? (
          <button
            onClick={handleLogin}
            className="mb-4 w-full bg-red-600 hover:bg-red-700 hover:scale-105 transition transform duration-200 p-3 rounded"
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

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm sm:text-base">
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
    <div className="text-gray-300 font-bold capitalize">{puzzle.type}</div>
  </div>
</div>


        {/* HEATMAP */}
        <div className="grid grid-cols-7 gap-1 justify-center mb-6">
  {Object.keys(completionHistory)
    .slice(-21)
    .map((date) => (
      <div
        key={date}
        className="w-4 h-4 rounded-sm bg-green-500 hover:scale-110 transition"
      />
    ))}
</div>


        <div className="mb-6 text-2xl sm:text-3xl font-bold bg-gray-800 p-6 rounded-2xl shadow-inner">
  {Array.isArray(puzzle.question) &&
    puzzle.question.map((line, index) => (
      <div key={index}>{line}</div>
    ))}
  <div className="mt-2 text-gray-400">?</div>
</div>


        {/* HINT */}
        <button
          onClick={handleHint}
          disabled={hintUsed}
          className="w-full bg-yellow-500 hover:bg-yellow-600 hover:scale-105 transition transform duration-200 p-2 rounded mb-3 disabled:opacity-50"
        >
          {hintUsed ? "Hint Used" : "Get Hint"}
        </button>

        {showHint && (
          <p className="text-yellow-400 mb-3 animate-fadeIn">
            {getHint()}
          </p>
        )}

        <input
          type="text"
          value={userAnswer}
          disabled={!user || completed}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-3 rounded-xl text-black mb-4 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          placeholder="Enter your answer"
        />

        <button
          onClick={handleSubmit}
          disabled={!user || completed}
          className="w-full bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 transition transform duration-200 p-3 rounded disabled:opacity-50"
        >
          Submit
        </button>

        {result && (
          <p
            className={`mt-4 text-lg font-semibold transition-all duration-500 ${
              result === "correct"
                ? "text-green-400 scale-110"
                : "text-red-400 shake"
            }`}
          >
            {result === "correct"
              ? "Correct! 🎉"
              : "Wrong answer ❌"}
          </p>
        )}

        <Link to="/leaderboard">
          <button className="mt-6 w-full bg-purple-600 hover:bg-purple-700 hover:scale-105 transition transform duration-200 p-3 rounded">
            View Leaderboard 🏆
          </button>
        </Link>

      </div>
    </div>
  );
}

export default Home;
