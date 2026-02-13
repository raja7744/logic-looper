import { useEffect, useState } from "react";

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://logic-looper-backend.onrender.com/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">🏆 Leaderboard</h1>

      {loading && <p>Loading...</p>}

      {!loading && users.length === 0 && (
        <p>No scores yet.</p>
      )}

      {users.map((user, index) => (
        <div
          key={user.id}
          className="mb-2 p-3 bg-gray-800 rounded"
        >
          {index + 1}. {user.email} — {user.score}
        </div>
      ))}
    </div>
  );
}

export default Leaderboard;
