import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function History() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  useEffect(() => {
    if (!userId) router.push("/");
  }, [userId]);

  const fetchRecord = async () => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    setLoading(true);

    try {
      const recordRef = doc(db, "records", `${userId}_${selectedDate}`);
      const snapshot = await getDoc(recordRef);

      if (snapshot.exists()) {
        setRecord(snapshot.data());
      } else {
        setRecord(null);
      }
    } catch (error) {
      console.error("Error fetching record:", error);
      setRecord(null);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.arabic}>
          وَٱلْعَصْرِ
        </h2>

        <h1 style={styles.title}>
          📅 View Daily Record (عرض سجل اليوم)
        </h1>

        {/* Date Picker */}
        <div style={{ marginBottom: "15px" }}>
          <label style={styles.label}>
            Select Date (اختر التاريخ)
          </label>

          <input
            type="date"
            style={styles.input}
            value={selectedDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <button style={styles.button} onClick={fetchRecord}>
          🔍 View Record
        </button>

        {loading && (
          <p style={{ marginTop: "15px" }}>
            Loading...
          </p>
        )}

        {/* Record Display */}
        {record && (
          <div style={styles.recordBox}>

            <h3>⭐ Total Points: {record.totalPointsToday || 0}</h3>

            <hr />

            <h4>📖 Quran (تلاوة القرآن)</h4>
            <p>Pages: {record.pages || 0}</p>
            <p>Ayahs: {record.ayahs || 0}</p>
            <p>Surahs: {record.surahs || 0}</p>
            <p>Juz: {record.juz || 0}</p>
            <p>Minutes: {record.minutes || 0}</p>

            <hr />

            <h4>🕌 Salah (الصلاة)</h4>
            <p>Fard: {record.fardPrayers?.length || 0}</p>
            <p>Sunnah: {record.sunnahPrayers?.length || 0}</p>

            <hr />

            <h4>🤲 Dhikr (الذكر)</h4>
            <p>Total Dhikr: {record.totalDhikr || 0}</p>
            <p>Salah Dhikr: {record.totalSalahDhikr || 0}</p>

            <hr />

            <h4>🌟 Other Good Deeds</h4>
            <p>Zakah: {record.zakahCount || 0}</p>
            <p>Helped: {record.helpCount || 0}</p>
            <p>Learning: {record.learningMinutes || 0}</p>
            <p>Dua: {record.duaCount || 0}</p>

            <hr />

            <p>
              🌙 Fasted: {record.fasted ? "Yes" : "No"}
            </p>

          </div>
        )}

        {selectedDate && !loading && !record && (
          <p style={{ marginTop: "15px" }}>
            No record found for this date.
          </p>
        )}

        <button
          style={styles.secondaryButton}
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
    width: "500px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.3)"
  },

  arabic: {
    textAlign: "center",
    fontSize: "18px",
    color: "#14532d",
    fontWeight: "bold"
  },

  title: {
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "20px"
  },

  label: {
    fontWeight: "bold",
    fontSize: "14px"
  },

  input: {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },

  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #0f3d3e, #14532d)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  secondaryButton: {
    marginTop: "15px",
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "2px solid #14532d",
    background: "transparent",
    color: "#14532d",
    fontWeight: "bold",
    cursor: "pointer"
  },

  recordBox: {
    marginTop: "20px",
    padding: "20px",
    borderRadius: "12px",
    background: "#ffffff",
    border: "1px solid #ddd"
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