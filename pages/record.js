import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { collection, getDocs, updateDoc } from "firebase/firestore";

export default function Record() {
  const router = useRouter();

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  // ✅ Date Picker (Missed day support)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Quran fields
  const [pages, setPages] = useState(0);
  const [ayahs, setAyahs] = useState(0);
  const [surahs, setSurahs] = useState(0);
  const [juz, setJuz] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const [fardPrayers, setFardPrayers] = useState([]);
  const [sunnahPrayers, setSunnahPrayers] = useState([]);

  // Dhikr
  const [dhikrManual, setDhikrManual] = useState(0);
  const [dhikrCounter, setDhikrCounter] = useState(0);

  // Salah Dhikr
  const [salahDhikrManual, setSalahDhikrManual] = useState(0);
  const [salahDhikrCounter, setSalahDhikrCounter] = useState(0);

  const [zakahCount, setZakahCount] = useState(0);
  const [helpCount, setHelpCount] = useState(0);
  const [learningMinutes, setLearningMinutes] = useState(0);
  const [duaCount, setDuaCount] = useState(0);
  const [fasted, setFasted] = useState(false);

  const totalDhikr = dhikrManual + dhikrCounter;
  const totalSalahDhikr = salahDhikrManual + salahDhikrCounter;

  const quranSelected =
    pages > 0 || ayahs > 0 || surahs > 0 || juz > 0 || minutes > 0;

  const calculatePoints = () => {
    return (
      pages * 2 +
      ayahs * 1 +
      surahs * 10 +
      juz * 20 +
      minutes * 0.5 +
      fardPrayers.length * 5 +
      sunnahPrayers.length * 2.5 +
      totalDhikr * 0.1 +
      totalSalahDhikr * 0.1 +
      zakahCount * 15 +
      helpCount * 5 +
      learningMinutes * 0.5 +
      duaCount * 2 +
      (fasted ? 15 : 0)
    );
  };

  const toggle = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter(item => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const resetForm = () => {
    setPages(0);
    setAyahs(0);
    setSurahs(0);
    setJuz(0);
    setMinutes(0);
    setFardPrayers([]);
    setSunnahPrayers([]);
    setDhikrManual(0);
    setDhikrCounter(0);
    setSalahDhikrManual(0);
    setSalahDhikrCounter(0);
    setZakahCount(0);
    setHelpCount(0);
    setLearningMinutes(0);
    setDuaCount(0);
    setFasted(false);
  };

  // ✅ Auto Load Existing Record
  useEffect(() => {
    if (!userId || !selectedDate) return;

    const fetchRecord = async () => {
      const recordRef = doc(db, "records", `${userId}_${selectedDate}`);
      const snapshot = await getDoc(recordRef);

      if (snapshot.exists()) {
        const data = snapshot.data();

        setPages(data.pages ?? 0);
        setAyahs(data.ayahs ?? 0);
        setSurahs(data.surahs ?? 0);
        setJuz(data.juz ?? 0);
        setMinutes(data.minutes ?? 0);
        setFardPrayers(data.fardPrayers ?? []);
        setSunnahPrayers(data.sunnahPrayers ?? []);
        setDhikrManual(data.dhikrManual ?? 0);
        setDhikrCounter(data.dhikrCounter ?? 0);
        setSalahDhikrManual(data.salahDhikrManual ?? 0);
        setSalahDhikrCounter(data.salahDhikrCounter ?? 0);
        setZakahCount(data.zakahCount ?? 0);
        setHelpCount(data.helpCount ?? 0);
        setLearningMinutes(data.learningMinutes ?? 0);
        setDuaCount(data.duaCount ?? 0);
        setFasted(data.fasted ?? false);
      } else {
        resetForm();
      }
    };

    fetchRecord();
  }, [selectedDate, userId]);
  const syncUserTotalPoints = async () => {
  try {
    const recordsSnap = await getDocs(collection(db, "records"));

    let total = 0;

    recordsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userId === userId) {
        total += data.totalPointsToday || 0;
      }
    });

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      totalPoints: total,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error("Error syncing total points:", error);
  }
};

  const handleSave = async () => {
    if (!userId) {
      router.push("/");
      return;
    }

    const totalPointsToday = calculatePoints();

    if (totalPointsToday === 0) {
      alert("Record only what you sincerely completed 🤍");
      return;
    }

    try {
      const recordRef = doc(db, "records", `${userId}_${selectedDate}`);

      await setDoc(recordRef, {
        userId,
        date: selectedDate,
        pages,
        ayahs,
        surahs,
        juz,
        minutes,
        fardPrayers,
        sunnahPrayers,
        dhikrManual,
        dhikrCounter,
        totalDhikr,
        salahDhikrManual,
        salahDhikrCounter,
        totalSalahDhikr,
        zakahCount,
        helpCount,
        learningMinutes,
        duaCount,
        fasted,
        totalPointsToday,
        updatedAt: new Date()
      });
      await syncUserTotalPoints();

      alert("May Allah accept your deeds 🌙");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.arabic}>إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ</h2>
        <p style={styles.quote}>
          “Indeed, Allah loves those who do good.” (2:195)
        </p>

        {/* ✅ Date Picker */}
        <h3 style={styles.sectionTitle}>📅 Select Date</h3>
        <input
          type="date"
          value={selectedDate}
          style={styles.input}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        {/* ---- EVERYTHING BELOW IS 100% SAME AS YOUR UI ---- */}

        {/* Quran Section */}
        {/* Quran Section */}
        {/* <h3>📖 Quran Recitation</h3> */}
        {/* <h3 style={styles.sectionTitle}>
  📖 Quran Recitation (تلاوة القرآن)
</h3>
        <p style={styles.small}>Choose ONLY one format</p>

        <div style={styles.grid}>
          <input
            type="number"
            placeholder="Pages"
            disabled={quranSelected && !pages}
            onChange={e => setPages(+e.target.value)}
          />

          <input
            type="number"
            placeholder="Ayahs"
            disabled={quranSelected && !ayahs}
            onChange={e => setAyahs(+e.target.value)}
          />

          <input
            type="number"
            placeholder="Surahs"
            disabled={quranSelected && !surahs}
            onChange={e => setSurahs(+e.target.value)}
          />

          <input
            type="number"
            placeholder="Juz"
            disabled={quranSelected && !juz}
            onChange={e => setJuz(+e.target.value)}
          />

          <input
            type="number"
            placeholder="Minutes"
            disabled={quranSelected && !minutes}
            onChange={e => setMinutes(+e.target.value)}
          />
        </div> */}
        <h3 style={styles.sectionTitle}>
  📖 Quran Recitation (تلاوة القرآن الكريم)
</h3>

<p style={{ ...styles.small, fontWeight: "bold" }}>
  ⚠ Choose ONLY one format below
</p>

<div style={styles.grid}>

  {/* Pages */}
  <div>
    <label style={styles.label}>
      📄 Pages (عدد الصفحات)
    </label>
    <input
      type="number"
      placeholder="Enter number of pages read"
      style={styles.input}
      disabled={quranSelected && !pages}
      value={pages}
      onChange={e => setPages(+e.target.value)}
    />
  </div>

  {/* Ayahs */}
  <div>
    <label style={styles.label}>
      📜 Ayahs (عدد الآيات)
    </label>
    <input
      type="number"
      placeholder="Enter number of ayahs read"
      style={styles.input}
      disabled={quranSelected && !ayahs}
      value={ayahs}
      onChange={e => setAyahs(+e.target.value)}
    />
  </div>

  {/* Surahs */}
  <div>
    <label style={styles.label}>
      📘 Surahs (عدد السور)
    </label>
    <input
      type="number"
      placeholder="Enter number of surahs completed"
      style={styles.input}
      disabled={quranSelected && !surahs}
      value={surahs}
      onChange={e => setSurahs(+e.target.value)}
    />
  </div>

  {/* Juz */}
  <div>
    <label style={styles.label}>
      🕋 Juz (عدد الأجزاء)
    </label>
    <input
      type="number"
      placeholder="Enter number of juz completed"
      style={styles.input}
      disabled={quranSelected && !juz}
      value={juz}
      onChange={e => setJuz(+e.target.value)}
    />
  </div>

  {/* Time */}
  <div style={{ gridColumn: "span 2" }}>
    <label style={styles.label}>
      ⏱ Time Spent (مدة القراءة بالدقائق)
    </label>
    <input
      type="number"
      placeholder="Enter minutes spent reading"
      style={styles.input}
      disabled={quranSelected && !minutes}
      value={minutes}
      onChange={e => setMinutes(+e.target.value)}
    />
  </div>

</div>

        {/* Salah */}
{/* ===================== SALAH SECTION ===================== */}

<h3 style={styles.sectionTitle}>
  🕌 Farḍ Prayers (الصلوات المفروضة)
</h3>

{[
  { en: "Fajr", ar: "الفجر" },
  { en: "Dhuhr", ar: "الظهر" },
  { en: "Asr", ar: "العصر" },
  { en: "Maghrib", ar: "المغرب" },
  { en: "Isha", ar: "العشاء" }
].map(p => (
  <label key={p.en} style={styles.checkboxLabel}>
    <input
      type="checkbox"
      onChange={() => toggle(p.en, fardPrayers, setFardPrayers)}
    />
    {p.en} ({p.ar})
  </label>
))}


{/* ===================== SUNNAH SECTION ===================== */}

<h3 style={styles.sectionTitle}>
  🌙 Sunnah & Nafl (النوافل)
</h3>

{[
  { en: "Tahajjud", ar: "التهجد" },
  { en: "Taraweeh", ar: "التراويح" },
  { en: "Duha", ar: "الضحى" },
  { en: "Witr", ar: "الوتر" }
].map(p => (
  <label key={p.en} style={styles.checkboxLabel}>
    <input
      type="checkbox"
      onChange={() => toggle(p.en, sunnahPrayers, setSunnahPrayers)}
    />
    {p.en} ({p.ar})
  </label>
))}


{/* ===================== GENERAL DHIKR ===================== */}

<h3 style={styles.sectionTitle}>
  🤲 Dhikr (الذكر)
</h3>

<div style={styles.dhikrRow}>
  <input
    type="number"
    placeholder="Enter Dhikr Count Manually"
    style={styles.input}
    value={dhikrManual}
    onChange={e => setDhikrManual(+e.target.value)}
  />

  <div style={styles.counterBox}>
    <button onClick={() => setDhikrCounter(Math.max(0, dhikrCounter - 1))}>
      −
    </button>
    <span>{dhikrCounter}</span>
    <button onClick={() => setDhikrCounter(dhikrCounter + 1)}>
      +
    </button>
  </div>
</div>

<p style={{fontWeight:"bold", marginTop:"5px"}}>
  Total Dhikr: {totalDhikr}
</p>


{/* ===================== SALAH DHIKR ===================== */}

<h3 style={styles.sectionTitle}>
  🕊 Salah Dhikr (أذكار بعد الصلاة)
</h3>

<div style={styles.dhikrRow}>
  <input
    type="number"
    placeholder="Enter Salah Dhikr Manually"
    style={styles.input}
    value={salahDhikrManual}
    onChange={e => setSalahDhikrManual(+e.target.value)}
  />

  <div style={styles.counterBox}>
    <button
      onClick={() =>
        setSalahDhikrCounter(Math.max(0, salahDhikrCounter - 1))
      }
    >
      −
    </button>

    <span>{salahDhikrCounter}</span>

    <button
      onClick={() =>
        setSalahDhikrCounter(salahDhikrCounter + 1)
      }
    >
      +
    </button>
  </div>
</div>

<p style={{fontWeight:"bold", marginTop:"5px"}}>
  Total Salah Dhikr: {totalSalahDhikr}
</p>
        {/* Other Good Deeds */}
        {/* <h3>🌟 Other Good Deeds</h3>

        <input type="number" placeholder="Zakah Acts" onChange={e=>setZakahCount(+e.target.value)} />
        <input type="number" placeholder="Helped Someone" onChange={e=>setHelpCount(+e.target.value)} />
        <input type="number" placeholder="Islamic Learning (Minutes)" onChange={e=>setLearningMinutes(+e.target.value)} />
        <input type="number" placeholder="Dua Made" onChange={e=>setDuaCount(+e.target.value)} />
 */}
 {/* <h3 style={styles.sectionTitle}>🌟 Other Good Deeds</h3>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    💎 Zakah Acts (Number of times you gave charity)
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setZakahCount(+e.target.value)}
  />
</div>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    🤝 Helped Someone (Number of good help actions)
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setHelpCount(+e.target.value)}
  />
</div>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    📚 Islamic Learning (Minutes spent learning)
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setLearningMinutes(+e.target.value)}
  />
</div>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    🤲 Dua Made (Number of sincere duas)
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setDuaCount(+e.target.value)}
  />
</div> */}
<h3 style={styles.sectionTitle}>
  🌟 Other Good Deeds (أعمال صالحة أخرى)
</h3>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    💎 Zakah / Charity Acts (الزكاة والصدقة)
    <br />
    <small>Number of times you gave charity today</small>
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setZakahCount(+e.target.value)}
  />
</div>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    🤝 Helping Others (مساعدة الآخرين)
    <br />
    <small>Number of good help actions you did</small>
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setHelpCount(+e.target.value)}
  />
</div>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    📚 Islamic Learning (طلب العلم)
    <br />
    <small>Minutes spent learning Islam</small>
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setLearningMinutes(+e.target.value)}
  />
</div>

<div style={styles.goodDeedBox}>
  <label style={styles.label}>
    🤲 Dua Made (الدعاء)
    <br />
    <small>Number of sincere duas made today</small>
  </label>
  <input
    type="number"
    style={styles.input}
    onChange={e => setDuaCount(+e.target.value)}
  />
</div>

{/* 
        <label>
          <input type="checkbox" onChange={()=>setFasted(!fasted)} />
          I Fasted Today 🌙
        </label>
         */}


{/* Fasting Section */}
<h3 style={{ marginTop: "20px" }}>🌙 Fasting (الصيام)</h3>

<div
  style={{
    ...styles.fastingBox,
    backgroundColor: fasted ? "#2c5364" : "#f4f4f4",
    color: fasted ? "white" : "black"
  }}
  onClick={() => setFasted(!fasted)}
>
  <span style={{ fontSize: "18px" }}>
    {fasted ? "✓" : "○"}
  </span>

  <div>
    <strong>I Fasted Today</strong>
    <br />
    <small>
      {fasted
        ? "May Allah accept your fasting 🤍"
        : "Mark only if you completed your fast"}
    </small>
  </div>
</div>
        <button style={styles.saveBtn} onClick={handleSave}>
          Save Today’s Deeds
        </button>
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
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 15px 40px rgba(0,0,0,0.3)"
},
  arabic: {
    textAlign: "center",
    color: "linear-gradient(135deg, #0f3d3e, #14532d, #064e3b)",
    fontSize: "24px",
    fontWeight: "bold"
  },

  quote: {
    textAlign: "center",
    marginBottom: "20px",
    fontSize: "16px",
    fontWeight: "bold"
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginTop: "25px"
  },

  label: {
    fontSize: "15px",
    fontWeight: "bold",
    display: "block",
    marginTop: "10px"
  },

  input: {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },

  dhikrRow: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginTop: "10px"
  },

  counterBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "linear-gradient(135deg, #0f3d3e, #14532d, #064e3b)",
    color: "white",
    padding: "10px 18px",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "bold"
  },

  saveBtn: {
    marginTop: "25px",
    width: "100%",
    padding: "14px",
   background: "linear-gradient(135deg, #0f3d3e, #14532d, #064e3b)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold"
  },

  fastingBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "18px",
    borderRadius: "15px",
    cursor: "pointer",
    transition: "0.3s ease",
    border: "1px solid #ddd",
    marginTop: "15px",
    fontSize: "16px",
    fontWeight: "bold"
  },

  goodDeedBox: {
    marginTop: "15px"
  },
  checkboxLabel: {
  display: "block",
  fontSize: "16px",
  fontWeight: "bold",
  marginTop: "8px"
},
 button: {
    marginTop: "15px",
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
   background: "linear-gradient(135deg, #0f3d3e, #14532d, #064e3b)",
    color: "white",
    cursor: "pointer"
  },footer: {
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