// ================= LOGIN =================
function login() {
  const name = document.getElementById("name").value.trim();
  const hours = Number(document.getElementById("hours").value);

  if (!name || !hours) {
    alert("Please fill all fields");
    return;
  }

  localStorage.setItem("user", JSON.stringify({ name, hours }));

  // DO NOT reset subjects if they already exist
  if (!localStorage.getItem("subjects")) {
    localStorage.setItem("subjects", JSON.stringify([]));
  }

  // GITHUB-SAFE REDIRECT
  window.location.href = "./dashboard.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "./index.html";
}

// ================= STORAGE =================
function getSubjects() {
  return JSON.parse(localStorage.getItem("subjects")) || [];
}

function saveSubjects(subjects) {
  localStorage.setItem("subjects", JSON.stringify(subjects));
}

// ================= SUBJECT =================
function submitSubject() {
  const input = document.getElementById("subjectName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  const subjects = getSubjects();
  subjects.push({ name, topics: [] });
  saveSubjects(subjects);

  input.value = "";
  render();
}

// ================= TOPIC =================
function submitTopic(subjectIndex) {
  const nameEl = document.getElementById(`topic-name-${subjectIndex}`);
  const hoursEl = document.getElementById(`topic-hours-${subjectIndex}`);
  const dayEl = document.getElementById(`topic-day-${subjectIndex}`);

  if (!nameEl || !hoursEl || !dayEl) return;

  const name = nameEl.value.trim();
  const hours = Number(hoursEl.value);
  const day = dayEl.value;

  if (!name || !hours || !day) return;

  const subjects = getSubjects();
  subjects[subjectIndex].topics.push({
    name,
    hours,
    day,
    completed: false
  });

  saveSubjects(subjects);
  render();
}

// ================= MARK DONE =================
function markDone(subjectIndex, topicIndex) {
  const subjects = getSubjects();
  subjects[subjectIndex].topics[topicIndex].completed = true;
  saveSubjects(subjects);
  render();
}

// ================= PROGRESS =================
function calculateProgress() {
  let total = 0, done = 0;

  getSubjects().forEach(s =>
    s.topics.forEach(t => {
      total++;
      if (t.completed) done++;
    })
  );

  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// ================= DAILY PLAN =================
function generateTodayPlan() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const el = document.getElementById("todayPlan");
  if (!el) return;

  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
  el.innerHTML = "";

  let remaining = user.hours;

  getSubjects().forEach(s =>
    s.topics.forEach(t => {
      if (t.completed || t.day !== today || remaining <= 0) return;
      const used = Math.min(t.hours, remaining);
      el.innerHTML += `<div>• ${t.name} — ${used}h</div>`;
      remaining -= used;
    })
  );

  if (!el.innerHTML) el.textContent = "No study scheduled today.";
}

// ================= WEEKLY PLAN =================
function generateWeeklyPlan() {
  const el = document.getElementById("weeklyPlan");
  if (!el) return;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  el.innerHTML = "";

  days.forEach(day => {
    const topics = [];

    getSubjects().forEach(s =>
      s.topics.forEach(t => {
        if (!t.completed && t.day === day) {
          topics.push(`${t.name} (${t.hours}h)`);
        }
      })
    );

    el.innerHTML += `<div><strong>${day}:</strong> ${topics.join(", ") || "—"}</div>`;
  });
}

// ================= RENDER =================
function render() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const welcome = document.getElementById("welcome");
  if (welcome) welcome.textContent = "Welcome, " + user.name;

  const overallEl = document.getElementById("overallProgress");
  if (overallEl) {
    const overall = calculateProgress();
    overallEl.innerHTML = `<div class="progress-bar"></div>`;
    overallEl.style.setProperty("--progress", overall + "%");
    overallEl.setAttribute("data-progress", overall + "%");
  }

  const container = document.getElementById("subjects");
  if (!container) return;

  container.innerHTML = "";

  getSubjects().forEach((subject, si) => {
    const div = document.createElement("div");

    const total = subject.topics.length;
    const done = subject.topics.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    div.innerHTML = `
      <h4>${subject.name}</h4>
      <div class="subject-progress">
        <div class="subject-progress-bar">
          <div class="subject-progress-fill" style="--progress:${percent}%"></div>
        </div>
        <div class="subject-progress-text">${percent}% completed</div>
      </div>
    `;

    subject.topics.forEach((t, ti) => {
      div.innerHTML += `
        <div>
          ${t.name} (${t.hours}h) — ${t.day}
          ${t.completed ? "✅ Done" : "⏳ Pending"}
          ${!t.completed ? `<button onclick="markDone(${si},${ti})">Mark Done</button>` : ""}
        </div>
      `;
    });

    div.innerHTML += `
      <input id="topic-name-${si}" placeholder="Topic name">
      <input id="topic-hours-${si}" type="number" placeholder="Hours">
      <select id="topic-day-${si}">
        <option value="">Day</option>
        <option>Mon</option><option>Tue</option><option>Wed</option>
        <option>Thu</option><option>Fri</option><option>Sat</option><option>Sun</option>
      </select>
      <button onclick="submitTopic(${si})">Add Topic</button>
    `;

    container.appendChild(div);
  });

  generateTodayPlan();
  generateWeeklyPlan();
}

// AUTO LOAD (SAFE)
if (window.location.pathname.includes("dashboard")) {
  render();
}

// ================= THEME TOGGLE =================
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}

// APPLY SAVED THEME
(function () {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
})();
