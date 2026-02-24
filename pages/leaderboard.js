import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function GlobalLeaderboard() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));

      const users = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If you already store totalPoints in users (recommended)
      const leaderboardData = users.map(user => ({
        ...user,
        totalPoints: user.totalPoints || 0
      }));

      // Sort descending by points ONLY
      leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);

      // 🏆 Proper Competition Ranking (1224 style)
      let currentRank = 1;
      let previousPoints = null;

      leaderboardData.forEach((user, index) => {
        if (user.totalPoints !== previousPoints) {
          currentRank = index + 1;
        }
        user.rank = currentRank;
        previousPoints = user.totalPoints;
      });

      setLeaderboard(leaderboardData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.arabic}>
          ٱلسَّلَامُ عَلَيْكُمْ
        </h2>

        <h1 style={styles.title}>
          🌍 Global Leaderboard (المتصدرون عالميًا)
        </h1>

        {loading && <p>Loading...</p>}

        {!loading && leaderboard.map((u) => {

          const medal =
            u.rank === 1 ? "🥇" :
            u.rank === 2 ? "🥈" :
            u.rank === 3 ? "🥉" :
            `${u.rank}.`;

          return (
            <div
              key={u.id}
              style={{
                ...styles.row,
                background:
                  u.rank === 1
                    ? "linear-gradient(135deg,#f6d365,#fda085)"
                    : u.rank === 2
                    ? "#e5e7eb"
                    : u.rank === 3
                    ? "#fcd5ce"
                    : "#ffffff"
              }}
            >
              <div style={styles.rank}>
                {medal}
              </div>

              <div style={styles.nameBox}>
                <strong>{u.name}</strong>
                <br />
                <small>
                  📍 {u.location || "Unknown"}
                </small>
              </div>

              <div style={styles.points}>
                ⭐ {u.totalPoints}
              </div>
            </div>
          );
        })}

        <button
          style={styles.button}
          onClick={() => router.push("/dashboard")}
        >
          ⬅ Back to Dashboard
        </button>

        <div style={styles.footer}>
          Powered by <strong>CodeLeaf</strong>
          <br />
          <a
            href="https://codeleaf.co.in"
            target="_blank"
            style={styles.link}
          >
            www.codeleaf.co.in
          </a>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f3d3e, #14532d, #064e3b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  card: {
    background: "#fdf6e3",
    padding: "35px",
    borderRadius: "18px",
    width: "550px",
    textAlign: "center",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 15px 40px rgba(0,0,0,0.3)"
  },

  arabic: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#14532d"
  },

  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "10px"
  },

  rank: {
    fontSize: "20px",
    fontWeight: "bold"
  },

  nameBox: {
    flex: 1,
    textAlign: "left",
    marginLeft: "10px"
  },

  points: {
    fontWeight: "bold",
    color: "#14532d"
  },

  button: {
    marginTop: "25px",
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #0f3d3e, #14532d)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  footer: {
    marginTop: "30px",
    textAlign: "center",
    fontSize: "13px",
    color: "#14532d"
  },

  link: {
    color: "#14532d",
    fontWeight: "bold",
    textDecoration: "none"
  }
};