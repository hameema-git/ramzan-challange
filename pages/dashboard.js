import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  arrayUnion,
  deleteDoc
} from "firebase/firestore";

export default function Dashboard() {
  const router = useRouter();

  const [rank, setRank] = useState(null);
  const [userTotalPoints, setUserTotalPoints] = useState(0);
  const [user, setUser] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  useEffect(() => {
    if (!userId) {
      router.push("/");
      return;
    }

    loadUser();
    loadUserGroups();
    calculateRank();
  }, []);

  // ===============================
  // ✅ Rank + Total Points Logic
  // ===============================
  const calculateRank = async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    const recordsSnap = await getDocs(collection(db, "records"));

    const users = usersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const records = recordsSnap.docs.map(doc => doc.data());

    const leaderboardData = users.map(user => {
      const totalPoints = records
        .filter(r => r.userId === user.id)
        .reduce((sum, r) =>
          sum + (r.totalPointsToday || r.totalPoints || 0),
        0);

      return {
        id: user.id,
        totalPoints
      };
    });

    leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);

    const position = leaderboardData.findIndex(u => u.id === userId);

    if (position !== -1) {
      setRank(position + 1);
      setUserTotalPoints(leaderboardData[position].totalPoints);
    }
  };

  // ===============================
  // Load User
  // ===============================
  const loadUser = async () => {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) setUser(snap.data());
  };

  // ===============================
  // Load Groups
  // ===============================
  const loadUserGroups = async () => {
    const snapshot = await getDocs(collection(db, "groups"));

    const groups = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(group => group.members.includes(userId));

    setUserGroups(groups);
  };

  // ===============================
  // Create Group
  // ===============================
  const createGroup = async () => {
    if (!groupName.trim()) {
      alert("Enter a Group Name");
      return;
    }

    const cleanName = groupName.trim().toLowerCase();

    const q = query(
      collection(db, "groups"),
      where("normalizedName", "==", cleanName)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      alert("Group name already exists.");
      return;
    }

    const shortName = groupName
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .substring(0, 6);

    const randomPart = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    const inviteCode = `${shortName}-${randomPart}`;

    await addDoc(collection(db, "groups"), {
      name: groupName.trim(),
      normalizedName: cleanName,
      createdBy: userId,
      members: [userId],
      inviteCode,
      createdAt: new Date()
    });

    alert("Group Created! Invite Code: " + inviteCode);

    setGroupName("");
    loadUserGroups();
  };

  // ===============================
  // Join Group
  // ===============================
  const joinGroup = async () => {
    if (!joinCode.trim()) return;

    const q = query(
      collection(db, "groups"),
      where("inviteCode", "==", joinCode.trim())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Invalid Invite Code");
      return;
    }

    const groupDoc = snapshot.docs[0];

    await updateDoc(doc(db, "groups", groupDoc.id), {
      members: arrayUnion(userId)
    });

    alert("Joined Successfully!");
    setJoinCode("");
    loadUserGroups();
  };

  // ===============================
  // Logout
  // ===============================
  const logout = () => {
    localStorage.removeItem("userId");
    router.push("/");
  };

  // ===============================
  // Delete Account
  // ===============================
  const deleteAccount = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete your account?"
    );
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "users", userId));
    localStorage.removeItem("userId");
    router.push("/");
  };

  // ===============================
  // ✅ Download Badge (Corrected)
  // ===============================
  const downloadBadge = (user, rank) => {
    if (!rank) return;

    const numericRank = Number(rank);
    const totalPoints = userTotalPoints; // 🔥 Correct source

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    const centerX = 400;
    const centerY = 400;
    const radius = 320;

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

    ctx.fillStyle = "#022c22";
    ctx.fillRect(0, 0, 800, 800);

    const gradient = ctx.createRadialGradient(
      centerX, centerY, 100,
      centerX, centerY, radius
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

    ctx.textAlign = "center";
    ctx.fillStyle = textColor;

    ctx.font = "bold 42px Arial";
    ctx.fillText(title, centerX, 280);

    ctx.font = "bold 34px Arial";
    ctx.fillText(user.name.toUpperCase(), centerX, 340);

    ctx.font = "22px Arial";
    ctx.fillText(user.location || "", centerX, 380);

    ctx.font = "26px Arial";
    ctx.fillText(`⭐ ${totalPoints} Points`, centerX, 440);

    if (numericRank <= 3) {
      ctx.fillText(`🏆 Rank #${numericRank}`, centerX, 480);
    }

    ctx.font = "18px Arial";
    ctx.fillText("Ramzan Global Challenge 2026", centerX, 550);
    ctx.fillText("Powered by CodeLeaf", centerX, 580);

    const link = document.createElement("a");
    link.download = `${user.name}-ramzan-badge.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!user) return <p>Loading...</p>;

 return (
  <div style={styles.container}>
    <div style={styles.card}>

      <h2 style={styles.arabic}>
        بِسْمِ ٱللَّٰهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
      </h2>

      <h1 style={styles.mainTitle}>
        🌙 Dashboard (لوحة التحكم)
      </h1>

      {/* USER INFO */}
      <div style={styles.userBox}>
        <h3>{user.name}</h3>
        <p>📍 {user.location || "Not Provided"}</p>

        {rank && (
          <button
            style={styles.badgeBtn}
            onClick={() => downloadBadge(user, rank)}
          >
            🏆 Download My Honor Badge
          </button>
        )}
      </div>

      {/* ================= ACTIVITIES ================= */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          📊 Activities (الأنشطة)
        </h3>

        <button
          style={styles.primaryButton}
          onClick={() => router.push("/record")}
        >
          ✍ Record Today
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => router.push("/history")}
        >
          📜 View History
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => router.push("/leaderboard")}
        >
          🌍 Global Leaderboard
        </button>
      </div>

      {/* ================= CREATE GROUP ================= */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          👥 Create Group
        </h3>

        <input
          style={styles.input}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter Group Name"
        />

        <button
          style={styles.primaryButton}
          onClick={createGroup}
        >
          Create Group
        </button>
      </div>

      {/* ================= JOIN GROUP ================= */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          ➕ Join Group
        </h3>

        <input
          style={styles.input}
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Enter Invite Code"
        />

        <button
          style={styles.primaryButton}
          onClick={joinGroup}
        >
          Join Group
        </button>
      </div>

      {/* ================= YOUR GROUPS ================= */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          🏆 Your Groups
        </h3>

        {userGroups.length === 0 && (
          <p style={{ fontSize: "14px" }}>
            You are not in any group yet.
          </p>
        )}

        {userGroups.map(group => (
          <div key={group.id} style={styles.groupWrapper}>

            <div
              style={styles.groupBox}
              onClick={() => router.push(`/group/${group.id}`)}
            >
              <div style={styles.groupLeft}>
                👥 {group.name}
              </div>

              <div style={styles.groupRight}>
                View Leaderboard ➜
              </div>
            </div>

            {group.createdBy === userId && (
              <button
                style={styles.deleteGroupBtn}
                onClick={() => deleteDoc(doc(db, "groups", group.id)).then(loadUserGroups)}
              >
                🗑
              </button>
            )}

          </div>
        ))}
      </div>

      {/* ================= SUPPORT ================= */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⚙ Support</h3>

        <button
          style={styles.helpButton}
          onClick={() => setShowHelp(true)}
        >
          ❓ Help
        </button>

        <button
          style={styles.logout}
          onClick={logout}
        >
          🚪 Logout
        </button>
      </div>

      {/* ================= DANGER ZONE ================= */}
      <div style={styles.section}>
        <h3 style={{ ...styles.sectionTitle, color: "#dc2626" }}>
          ⚠ Danger Zone
        </h3>

        <button
          style={styles.deleteBtn}
          onClick={deleteAccount}
        >
          🗑 Delete Account
        </button>
      </div>

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
  
    
      {/* Help Modal (MOVED HERE — correct place) */}
      {showHelp && (
        <div style={styles.helpOverlay}>
          <div style={styles.helpBox}>

            <h2>🕌 Help (المساعدة)</h2>

            <p><strong>1️⃣ New User:</strong> Create account using FULL NAME and LOCATION.</p>
            <p><strong>2️⃣ Enter Page:</strong> If you already registered, enter using same details.</p>
            <p><strong>3️⃣ Record:</strong> Record only what you truly completed each day.</p>
            <p><strong>4️⃣ Groups:</strong> Create or join using invite code.</p>
            <p><strong>5️⃣ Points:</strong> Points are calculated automatically.</p>

            <p style={{ marginTop: "10px", fontStyle: "italic" }}>
              “إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ”
              <br />
              Allah loves those who do good.
            </p>

            <button
              style={styles.closeHelp}
              onClick={() => setShowHelp(false)}
            >
              Close
            </button>

          </div>
        </div>
      )}
    
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
    borderRadius: "18px",
    width: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 15px 40px rgba(0,0,0,0.3)"
  },

  arabic: {
    textAlign: "center",
    fontSize: "18px",
    color: "#14532d",
    marginBottom: "10px"
  },

  mainTitle: {
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "15px"
  },

  userBox: {
    background: "#e6f4f1",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px"
  },

  badgeBtn: {
    marginTop: "10px",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#d97706,#b45309)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  section: {
    marginBottom: "25px"
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#14532d"
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "10px",
    fontSize: "14px"
  },

  primaryButton: {
    width: "100%",
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#0f3d3e,#14532d)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  secondaryButton: {
    width: "100%",
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "10px",
    border: "2px solid #14532d",
    background: "transparent",
    color: "#14532d",
    fontWeight: "bold",
    cursor: "pointer"
  },

  /* =======================
     GROUP STYLES
  ======================== */

  groupWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px"
  },

  groupBox: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg,#e6f4f1,#d1fae5)",
    padding: "14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    border: "2px solid transparent",
    transition: "0.2s"
  },

  groupLeft: {
    fontSize: "16px",
    color: "#14532d"
  },

  groupRight: {
    fontSize: "13px",
    color: "#065f46"
  },

  deleteGroupBtn: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "6px 8px",
    cursor: "pointer"
  },

  /* =======================
     HELP MODAL
  ======================== */

  helpButton: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#d97706,#b45309)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  helpOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },

  helpBox: {
    background: "#fdf6e3",
    padding: "30px",
    borderRadius: "18px",
    width: "420px",
    textAlign: "left",
    boxShadow: "0 15px 40px rgba(0,0,0,0.3)"
  },

  closeHelp: {
    marginTop: "15px",
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "#14532d",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  /* =======================
     ACTION BUTTONS
  ======================== */

  logout: {
    marginTop: "20px",
    width: "100%",
    padding: "10px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  deleteBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "10px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "10px",
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