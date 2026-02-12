import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getDailySeed } from "../utils/seed";
import { generateDailyPuzzle } from "../puzzles";

import { auth, provider } from "../services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

function Home() {
  const seed = getDailySeed();
  const today = dayjs().format("YYYY-MM-DD");

  // ------------------------
  // USER AUTH STATE
  // ------------------------
  const [user, setUser] = useState(null);

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
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ------------------------
  // STREAK
  // ------------------------
  const [streak, setStreak] = useState(() => {
    const lastPlayed = localStorage.getItem("last-played");
    const savedStreak = Number(localStorage.getItem("streak")) || 0;

    if (!lastPlayed) return savedStreak;

    const diff = dayjs(today).diff(dayjs(lastPlayed), "day");

    if (diff > 1) {
      localStorage.setItem("streak", "0");
      return 0;
    }

    return savedStreak;
  });

  // ------------------------
  // PUZZLE
  // ------------------------
  const puzzle = generateDailyPuzzle(seed, streak) || {};

  const [userAnswer, setUserAnswer] = useState("");
  const [time, setTime] = useState(0);
  const [completed, setCompleted] = useState(
    localStorage.getItem("puzzle-completed-" + seed) === "true"
  );
  const [result, setResult] = useState(
    localStorage.getItem("puzzle-completed-" + seed) === "true"
      ? "correct"
      : null
  );
  const [score, setScore] = useState(() => {
    return Number(localStorage.getItem("score")) || 0;
  });

  // ------------------------
  // TIMER
  // ------------------------
  useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [completed]);

  // ------------------------
  // HANDLE SUBMIT
  // ------------------------
  const handleSubmit = async () => {
    if (completed || !user) return;

    if (userAnswer === puzzle.answer) {
      setResult("correct");
      setCompleted(true);

      const pointsEarned = Math.max(100 - time, 10);
      const newScore = score + pointsEarned;

      localStorage.setItem("score", newScore);
      setScore(newScore);
      localStorage.setItem("puzzle-completed-" + seed, "true");

      const lastPlayed = localStorage.getItem("last-played");
      const savedStreak = parseInt(localStorage.getItem("streak")) || 0;

      let newStreak = 1;
      if (lastPlayed) {
        const diff = dayjs(today).diff(dayjs(lastPlayed), "day");
        if (diff === 1) newStreak = savedStreak + 1;
      }

      localStorage.setItem("streak", newStreak);
      localStorage.setItem("last-played", today);
      setStreak(newStreak);

      try {
        await fetch("http://localhost:5000/submit-score", {
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

    } else {
      setResult("wrong");
    }
  };

  // ------------------------
  // RENDER QUESTION
  // ------------------------
  const renderQuestion = () => {
    if (!Array.isArray(puzzle.question)) return null;

    return puzzle.question.map((item, index) => (
      <span key={index}>
        {Array.isArray(item) ? item.join(" ") : String(item)}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center w-[350px]">

        <h1 className="text-4xl font-bold mb-2">Logic Looper</h1>

        {/* LOGIN SECTION */}
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

        <div className="mb-6 text-xl flex justify-center gap-3 font-semibold">
          {renderQuestion()}
          <span>?</span>
        </div>

        <input
          type="number"
          value={userAnswer}
          disabled={completed || !user}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-3 text-black rounded mb-4 disabled:opacity-50"
          placeholder="Enter your answer"
        />

        <button
          onClick={handleSubmit}
          disabled={completed || !user}
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
