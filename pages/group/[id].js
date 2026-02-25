import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection
} from "firebase/firestore";

export default function GroupDashboard() {
  const router = useRouter();
  const { id } = router.query;

  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const [userRank, setUserRank] = useState(null);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  useEffect(() => {
    if (id) loadGroup();
  }, [id]);

  const loadGroup = async () => {
    const groupSnap = await getDoc(doc(db, "groups", id));
    if (!groupSnap.exists()) return;

    const groupData = groupSnap.data();
    setGroup(groupData);

    const usersSnap = await getDocs(collection(db, "users"));
    const recordsSnap = await getDocs(collection(db, "records"));

    const users = usersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const records = recordsSnap.docs.map(doc => doc.data());

    const groupLeaderboard = users
    //   .filter(user => groupData.members.includes(user.id))
    .filter(user => {
  if (!groupData.members.includes(user.id)) return false;

  // 🔥 If creator chose NOT to compete
  if (
    user.id === groupData.createdBy &&
    groupData.includeCreatorInCompetition === false
  ) {
    return false;
  }

  return true;
})
      .map(user => {
        const total = records
          .filter(r => r.userId === user.id)
          .reduce((sum, r) => sum + (r.totalPointsToday || 0), 0);

        return { ...user, totalPoints: total };
      });

    groupLeaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    groupLeaderboard.forEach((user, index) => {
      user.rank = index + 1;
      if (user.id === userId) {
        setUserRank(index + 1);
      }
    });

    setLeaderboard(groupLeaderboard);
  };

  const copyInviteCode = async () => {
    if (!group?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = group.inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
    }

    setTimeout(() => setCopied(false), 2000);
  };
  const downloadGroupBadge = () => {
  const currentUser = leaderboard.find(u => u.id === userId);
  if (!currentUser || !userRank) return;

  const numericRank = Number(userRank);

  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");

  const centerX = 400;
  const centerY = 400;
  const radius = 320;

  // 🎨 Default Theme
  let gradientColors = ["#065f46", "#047857"];
  let title = "PARTICIPANT";
  let textColor = "#ffffff";

  if (numericRank === 1) {
    gradientColors = ["#facc15", "#d97706"];
    title = "🥇 GOLD";
    textColor = "#111";
  } else if (numericRank === 2) {
    gradientColors = ["#e5e7eb", "#9ca3af"];
    title = "🥈 SILVER";
    textColor = "#1f2937";
  } else if (numericRank === 3) {
    gradientColors = ["#f59e0b", "#78350f"];
    title = "🥉 BRONZE";
    textColor = "#111";
  }

  // 🌌 Background
  ctx.fillStyle = "#022c22";
  ctx.fillRect(0, 0, 800, 800);

  // ✨ Stars
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * 800,
      Math.random() * 800,
      Math.random() * 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "white";
    ctx.fill();
  }

  // 🏅 Medal Circle
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    100,
    centerX,
    centerY,
    radius
  );

  gradient.addColorStop(0, gradientColors[0]);
  gradient.addColorStop(1, gradientColors[1]);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.lineWidth = 12;
  ctx.strokeStyle = "white";
  ctx.stroke();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  ctx.textAlign = "center";
  ctx.fillStyle = textColor;

  // 🏆 Medal Title
  ctx.font = "bold 40px Arial";
  ctx.fillText(title, centerX, 260);

  // 👤 User Name
  ctx.font = "bold 34px Arial";
  ctx.fillText(currentUser.name.toUpperCase(), centerX, 320);

  // 📍 Location
  ctx.font = "22px Arial";
  ctx.fillText(`Location: ${currentUser.location || "Not Provided"}`, centerX, 360);

  // 👥 Group Name (CLEARLY LABELED)
  ctx.font = "bold 22px Arial";
  ctx.fillText(`Group Name: ${group.name}`, centerX, 400);

  // ⭐ Points
  ctx.font = "26px Arial";
  ctx.fillText(`⭐ ${currentUser.totalPoints} Points`, centerX, 450);

  // 🏆 Rank
  if (numericRank <= 3) {
    ctx.font = "24px Arial";
    ctx.fillText(`🏆 Rank #${numericRank}`, centerX, 490);
  }

  // 🌿 Footer
  ctx.font = "18px Arial";
  ctx.fillText("Ramzan Group Challenge 2026", centerX, 560);
  ctx.fillText("Powered by CodeLeaf", centerX, 590);

  // 💾 Download
  const link = document.createElement("a");
  link.download = `${currentUser.name}-${group.name}-group-badge.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

//   const downloadGroupBadge = () => {
//     const currentUser = leaderboard.find(u => u.id === userId);
//     if (!currentUser) return;

//     const canvas = document.createElement("canvas");
//     canvas.width = 800;
//     canvas.height = 800;
//     const ctx = canvas.getContext("2d");

//     const centerX = 400;
//     const centerY = 400;
//     const radius = 320;

//     let gradientColors = ["#065f46", "#047857"];
//     let title = "PARTICIPANT";

//     if (userRank === 1) {
//       gradientColors = ["#facc15", "#d97706"];
//       title = "🥇 GOLD";
//     } else if (userRank === 2) {
//       gradientColors = ["#e5e7eb", "#9ca3af"];
//       title = "🥈 SILVER";
//     } else if (userRank === 3) {
//       gradientColors = ["#f59e0b", "#b45309"];
//       title = "🥉 BRONZE";
//     }

//     ctx.fillStyle = "#022c22";
//     ctx.fillRect(0, 0, 800, 800);

//     const gradient = ctx.createRadialGradient(
//       centerX,
//       centerY,
//       100,
//       centerX,
//       centerY,
//       radius
//     );

//     gradient.addColorStop(0, gradientColors[0]);
//     gradient.addColorStop(1, gradientColors[1]);

//     ctx.beginPath();
//     ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
//     ctx.fillStyle = gradient;
//     ctx.fill();

//     ctx.lineWidth = 10;
//     ctx.strokeStyle = "white";
//     ctx.stroke();

//     ctx.fillStyle = "white";
//     ctx.textAlign = "center";

//     ctx.font = "bold 40px Arial";
//     ctx.fillText(title, centerX, 280);

//     ctx.font = "bold 32px Arial";
//     ctx.fillText(currentUser.name.toUpperCase(), centerX, 340);

//     ctx.font = "22px Arial";
//     ctx.fillText(group.name, centerX, 380);

//     ctx.font = "24px Arial";
//     ctx.fillText(`⭐ ${currentUser.totalPoints} Points`, centerX, 440);

//     if (userRank <= 3) {
//       ctx.fillText(`🏆 Rank #${userRank}`, centerX, 480);
//     }

//     ctx.font = "18px Arial";
//     ctx.fillText("Ramzan Group Challenge 2026", centerX, 550);
//     ctx.fillText("Powered by CodeLeaf", centerX, 580);

//     const link = document.createElement("a");
//     link.download = `${currentUser.name}-${group.name}-badge.png`;
//     link.href = canvas.toDataURL("image/png");
//     link.click();
//   };

  if (!group) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading group...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.arabic}>
          وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ
        </h2>

        <h1 style={styles.title}>
          👥 {group.name}
        </h1>


{group.createdBy === userId && 
 group.includeCreatorInCompetition === false && (
  <p style={{ fontSize: "13px", color: "#14532d" }}>
    You are participating as Admin (Not in competition)
  </p>
)}



        <div style={styles.inviteBox}>
          <strong>Invite Code:</strong> {group.inviteCode}
          <button style={styles.copyBtn} onClick={copyInviteCode}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        {userRank && (
          <button
            style={styles.badgeBtn}
            onClick={downloadGroupBadge}
          >
            🏆 Download My Group Badge
          </button>
        )}

        <h2 style={styles.sectionTitle}>
          🏆 Group Leaderboard (لوحة المتصدرين)
        </h2>

        {leaderboard.map((u, i) => {
          const medal =
            i === 0 ? "🥇" :
            i === 1 ? "🥈" :
            i === 2 ? "🥉" :
            `${i + 1}.`;

          return (
            <div
              key={u.id}
              style={{
                ...styles.row,
                background:
                  i === 0
                    ? "linear-gradient(135deg,#f6d365,#fda085)"
                    : "#ffffff"
              }}
            >
              <div style={styles.rank}>{medal}</div>

              <div style={styles.nameBox}>
                <strong>{u.name}</strong>
                <br />
                <small>📍 {u.location || "Unknown"}</small>
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
    background: "linear-gradient(135deg,#0f3d3e,#14532d,#064e3b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  },

  card: {
    background: "#fdf6e3",
    padding: "35px",
    borderRadius: "20px",
    width: "550px",
    textAlign: "center",
    boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
    maxHeight: "90vh",
    overflowY: "auto"
  },

  arabic: {
    color: "#14532d",
    fontWeight: "bold",
    marginBottom: "10px"
  },

  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "15px"
  },

  inviteBox: {
    background: "#e6fffa",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  copyBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#14532d",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  badgeBtn: {
    marginBottom: "20px",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#d97706,#b45309)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "15px"
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
    fontWeight: "bold",
    fontSize: "18px"
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
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg,#0f3d3e,#14532d)",
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