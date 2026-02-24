import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs
} from "firebase/firestore";
import html2canvas from "html2canvas";

export default function Badge() {

  const [user, setUser] = useState(null);
  const [rank, setRank] = useState(null);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    const usersSnap = await getDocs(collection(db, "users"));
    const recordsSnap = await getDocs(collection(db, "records"));

    const users = usersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const records = recordsSnap.docs.map(doc => doc.data());

    const leaderboardData = users.map(user => {
      const total = records
        .filter(r => r.userId === user.id)
        .reduce((sum, r) => sum + (r.totalPointsToday || 0), 0);

      return { ...user, totalPoints: total };
    });

    leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);

    const currentIndex = leaderboardData.findIndex(
      u => u.id === userId
    );

    if (currentIndex !== -1) {
      setRank(currentIndex + 1);
      setUser(leaderboardData[currentIndex]);
    }
  };

  const downloadBadge = async () => {
    const badge = document.getElementById("badge");

    const canvas = await html2canvas(badge, {
      scale: 3
    });

    const link = document.createElement("a");
    link.download = "CodeLeaf-Ramadan-Badge.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!user) return <p style={{color:"white"}}>Loading...</p>;

  const isHonors = rank <= 3;

  let gradient = "linear-gradient(135deg,#065f46,#047857)";
  let medalTitle = "PARTICIPANT";

  if (rank === 1) {
    gradient = "linear-gradient(135deg,#facc15,#d97706)";
    medalTitle = "🥇 GOLD";
  } else if (rank === 2) {
    gradient = "linear-gradient(135deg,#e5e7eb,#9ca3af)";
    medalTitle = "🥈 SILVER";
  } else if (rank === 3) {
    gradient = "linear-gradient(135deg,#f59e0b,#b45309)";
    medalTitle = "🥉 BRONZE";
  }

  return (
    <div style={styles.container}>

      <div
        id="badge"
        style={{
          ...styles.badge,
          background: gradient
        }}
      >

        {/* Inner White Ring */}
        <div style={styles.innerCircle}>

          <h3 style={styles.challengeTitle}>
            🌙 Ramadan Deeds Challenge 2026
          </h3>

          <h1 style={styles.name}>
            {user.name.toUpperCase()}
          </h1>

          <p style={styles.location}>
            📍 {user.location || "Unknown"}
          </p>

          {isHonors ? (
            <>
              <h2 style={styles.rankText}>
                {medalTitle}
              </h2>
              <h3 style={styles.points}>
                ⭐ {user.totalPoints} Points
              </h3>
            </>
          ) : (
            <>
              <h2 style={styles.rankText}>
                🌿 PARTICIPATION AWARD
              </h2>
              <h3 style={styles.points}>
                ⭐ {user.totalPoints} Points
              </h3>
            </>
          )}

          <p style={styles.arabic}>
            “إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ”
          </p>

          <p style={styles.footer}>
            Powered by CodeLeaf
          </p>

        </div>
      </div>

      <button
        onClick={downloadBadge}
        style={styles.downloadBtn}
      >
        📥 Download My Badge
      </button>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0f3d3e,#14532d,#064e3b)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },

  badge: {
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
  },

  innerCircle: {
    width: "520px",
    height: "520px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "30px",
    boxShadow: "inset 0 0 40px rgba(0,0,0,0.2)"
  },

  challengeTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#14532d",
    marginBottom: "15px"
  },

  name: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#111",
    marginBottom: "8px",
    textShadow: "1px 1px 2px rgba(0,0,0,0.2)"
  },

  location: {
    fontSize: "16px",
    marginBottom: "20px",
    color: "#444"
  },

  rankText: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#14532d"
  },

  points: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#000"
  },

  arabic: {
    fontSize: "16px",
    fontStyle: "italic",
    marginTop: "10px",
    color: "#14532d"
  },

  footer: {
    marginTop: "15px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#14532d"
  },

  downloadBtn: {
    marginTop: "30px",
    padding: "14px 25px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg,#14532d,#0f3d3e)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px"
  }
};