import { useState } from "react";
import { useRouter } from "next/router";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  const [showHelp, setShowHelp] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanName = name.trim().toLowerCase();
    const cleanLocation = location.trim().toLowerCase();

    if (!cleanName || !cleanLocation) {
      setError("Please enter BOTH your FULL NAME and LOCATION.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const q = query(
        collection(db, "users"),
        where("name", "==", cleanName),
        where("location", "==", cleanLocation)
      );

      const snapshot = await getDocs(q);

      if (isLogin) {
        if (snapshot.empty) {
          setError("User not found. Please select NEW USER to register.");
          setLoading(false);
          return;
        }

        const userDoc = snapshot.docs[0];
        localStorage.setItem("userId", userDoc.id);
        router.push("/dashboard");
      } else {
        if (!snapshot.empty) {
          setError(
            "This FULL NAME and LOCATION already exist. Please choose ENTER MY PAGE."
          );
          setLoading(false);
          return;
        }

        const userRef = await addDoc(collection(db, "users"), {
          name: cleanName,
          location: cleanLocation,
          totalPoints: 0,
          streak: 0,
          lastRecordedDate: null,
          createdAt: new Date()
        });

        localStorage.setItem("userId", userRef.id);
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.arabic}>
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </h2>

        <h1 style={styles.title}>
          🌙 RAMADAN CHALLENGE
        </h1>

        <div style={styles.toggleBox}>
          <button
            style={!isLogin ? styles.activeToggle : styles.toggle}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
          >
            🆕 NEW USER
          </button>

          <button
            style={isLogin ? styles.activeToggle : styles.toggle}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            ➡ ENTER MY PAGE
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ⚠ {error}
          </div>
        )}

        <div style={styles.inputBox}>
          <label style={styles.label}>
            👤 FULL NAME (الاسم الكامل)
          </label>
          <input
            style={styles.input}
            placeholder="Enter your FULL NAME clearly"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={styles.inputBox}>
          <label style={styles.label}>
            📍 LOCATION (المكان)
          </label>
          <input
            style={styles.input}
            placeholder="Enter your City/Place/House Name"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <button
          style={styles.submitButton}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "ENTER PAGE"
            : "CREATE ACCOUNT"}
        </button>

        {/* Floating Help Button */}
        <button
          style={styles.helpButton}
          onClick={() => setShowHelp(true)}
        >
          ❓ Help
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
    alignItems: "center"
  },

  card: {
    background: "#fdf6e3",
    padding: "40px",
    borderRadius: "20px",
    width: "450px",
    textAlign: "center",
    boxShadow: "0 15px 40px rgba(0,0,0,0.3)"
  },

  arabic: {
    color: "#14532d",
    fontWeight: "bold",
    fontSize: "18px"
  },

  title: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "25px"
  },

  toggleBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  },

  toggle: {
    flex: 1,
    padding: "10px",
    background: "#e5e7eb",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "8px"
  },

  activeToggle: {
    flex: 1,
    padding: "10px",
    background: "#14532d",
    color: "white",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "8px"
  },

  inputBox: {
    marginBottom: "20px",
    textAlign: "left"
  },

  label: {
    fontWeight: "bold",
    fontSize: "16px"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px"
  },

  submitButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg,#0f3d3e,#14532d)",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
    marginTop: "20px",
    cursor: "pointer"
  },

  errorBox: {
    background: "#ffe4e6",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "15px",
    fontWeight: "bold"
  },
  helpButton: {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  padding: "12px 16px",
  borderRadius: "50px",
  border: "none",
  background: "linear-gradient(135deg,#d97706,#b45309)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
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
  borderRadius: "15px",
  width: "400px",
  textAlign: "left"
},

closeHelp: {
  marginTop: "15px",
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: "#14532d",
  color: "white",
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