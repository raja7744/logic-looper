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

  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [time, setTime] = useState(0);

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

  // ---------------- LOAD INDEXEDDB ----------------
  useEffect(() => {
  async function loadGameData() {
    const storedScore = await getData("score");
    const storedStreak = await getData("streak");
    const storedCompleted = await getData("completed-" + seed);

    if (storedScore !== undefined) setScore(storedScore);
    if (storedStreak !== undefined) setStreak(storedStreak);

    if (storedCompleted) {
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

  if (userAnswer === String(puzzle.answer)) {
    setResult("correct");
    setCompleted(true);

    const pointsEarned = Math.max(100 - time, 10);
    const newScore = score + pointsEarned;
    const newStreak = streak + 1;

    setScore(newScore);
    setStreak(newStreak);

    // ✅ Save structured data in IndexedDB
    await saveData(`result_${today}`, {
      email: user.email,
      score: newScore,
      timeTaken: time,
      date: today,
      synced: false
    });

    await saveData("score", newScore);
    await saveData("streak", newStreak);
    await saveData("completed-" + seed, true);

    // ✅ Send to backend
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

      // If successful → mark as synced
      await saveData(`result_${today}`, {
        email: user.email,
        score: newScore,
        timeTaken: time,
        date: today,
        synced: true
      });

    } catch (error) {
      console.error("Backend error:", error);
    }

  } else {
    setResult("wrong");
  }
};
// ---------------- RENDER QUESTION ----------------


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
