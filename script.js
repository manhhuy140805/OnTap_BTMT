const quizzes = {
  de1: {
    name: "Đề 1 - Kiến thức máy tính cơ bản",
    file: "question/de1.txt",
    difficulty: "Cơ bản",
    questions: [],
  },
  de2: {
    name: "Đề 2 - Kiến thức máy tính",
    file: "question/de2.txt",
    difficulty: "Cơ bản",
    questions: [],
  },
  de3: {
    name: "Đề 3 - Kiến thức máy tính",
    file: "question/de3.txt",
    difficulty: "Trung bình",
    questions: [],
  },
  de4: {
    name: "Đề 4 - Kiến thức máy tính",
    file: "question/de4.txt",
    difficulty: "Trung bình",
    questions: [],
  },
  de5: {
    name: "Đề 5 - Kiến thức máy tính",
    file: "question/de5.txt",
    difficulty: "Nâng cao",
    questions: [],
  },
  de_120_cau_bao_tri: {
    name: "Đề 120 câu - Bảo trì máy tính",
    file: "question/de_120_cau_bao_tri.txt",
    difficulty: "Nâng cao",
    questions: [],
  },
  de_120_cau_bao_tri_v2: {
    name: "Đề 120 câu - Bảo trì máy tính V2",
    file: "question/de_120_cau_bao_tri_v2.txt",
    difficulty: "Nâng cao",
    questions: [],
  },
  de_mau: {
    name: "Đề Giữa Kỳ - Bảo trì máy tính",
    file: "question/deMau.txt",
    difficulty: "Advanced",
    questions: [],
  },
  de_mau_2: {
    name: "Đề Mẫu 2 - Bảo trì máy tính",
    file: "question/deMau2.txt",
    difficulty: "Advanced",
    questions: [],
  },
};

// QUIZ STATE
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval = null;
let elapsedSeconds = 0;
let quizHistory = JSON.parse(localStorage.getItem("quizHistory")) || [];

// DOM ELEMENTS
const quizMenuEl = document.getElementById("quiz-menu");
const quizAreaEl = document.getElementById("quiz-area");
const resultPageEl = document.getElementById("result-page");
const quizTitleEl = document.getElementById("quiz-title");
const progressTextEl = document.getElementById("progress-text");
const progressFillEl = document.getElementById("progress-fill");
const questionTextEl = document.getElementById("question-text");
const optionsListEl = document.getElementById("options-list");
const questionListEl = document.getElementById("question-list");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const timerTextEl = document.getElementById("timer-text");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history-list");
const headerScore = document.getElementById("header-score");

// ===== INITIALIZATION =====
window.addEventListener("DOMContentLoaded", () => {
  loadAllQuizzes();
  renderHistory();
  attachEventListeners();
  setupKeyboardShortcuts();
});

// ===== LOAD QUIZ FROM FILE =====
async function loadAllQuizzes() {
  // Load all quizzes in parallel
  const loadPromises = Object.keys(quizzes).map(async (quizId) => {
    if (quizzes[quizId].file) {
      try {
        const response = await fetch(quizzes[quizId].file);
        const text = await response.text();
        const questions = parseQuizFile(text);
        quizzes[quizId].questions = questions;
        console.log(`Đã tải ${questions.length} câu hỏi từ ${quizId}`);
      } catch (error) {
        console.error(`Lỗi khi tải ${quizId}:`, error);
        quizzes[quizId].questions = [];
      }
    }
  });

  await Promise.all(loadPromises);
  renderQuizMenu();
}

// ===== RENDER QUIZ MENU =====
function renderQuizMenu() {
  const quizGrid = document.querySelector(".quiz-selector-grid");
  if (!quizGrid) return;

  quizGrid.innerHTML = "";

  // Add all quiz options
  Object.keys(quizzes).forEach((quizId) => {
    const quiz = quizzes[quizId];
    const questionCount = quiz.questions.length;

    const card = document.createElement("div");
    card.className = "quiz-option-card";
    card.innerHTML = `
      <div class="quiz-option-header">
        <div class="quiz-badge ${quizId}">${quiz.name.split(" - ")[0]}</div>
        <span class="difficulty">${quiz.difficulty || "Cơ bản"}</span>
      </div>
      <p class="quiz-option-desc">
        ${questionCount} câu hỏi - ${quiz.name.split(" - ")[1] || quiz.name}
      </p>
      <button class="btn btn-primary" onclick="selectQuiz('${quizId}')">
        Bắt đầu
      </button>
    `;
    quizGrid.appendChild(card);
  });

  // Add random quiz option
  const randomCard = document.createElement("div");
  randomCard.className = "quiz-option-card random-quiz";
  randomCard.innerHTML = `
    <div class="quiz-option-header">
      <div class="quiz-badge random">🎲 Random</div>
      <span class="difficulty">Tùy chỉnh</span>
    </div>
    <p class="quiz-option-desc">
      Tạo đề thi ngẫu nhiên từ tất cả các đề
    </p>
    <button class="btn btn-primary" onclick="showRandomQuizModal()">
      Tạo đề Random
    </button>
  `;
  quizGrid.appendChild(randomCard);
}

function attachEventListeners() {
  prevBtn.addEventListener("click", goToPrevQuestion);
  nextBtn.addEventListener("click", goToNextQuestion);
  submitBtn.addEventListener("click", submitQuiz);
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (!currentQuiz || !resultPageEl.classList.contains("hidden")) return;

    // Arrow keys for navigation
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToPrevQuestion();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goToNextQuestion();
    }
    // Number keys 1-4 for selecting options
    else if (e.key >= "1" && e.key <= "4") {
      e.preventDefault();
      const optIndex = parseInt(e.key) - 1;
      const q = currentQuiz.questions[currentQuestionIndex];
      if (optIndex < q.options.length) {
        userAnswers[currentQuestionIndex] = optIndex;
        renderQuestion(currentQuestionIndex);
      }
    }
    // Enter to submit
    else if (
      e.key === "Enter" &&
      currentQuestionIndex === currentQuiz.questions.length - 1
    ) {
      e.preventDefault();
      submitQuiz();
    }
  });
}

// ===== HISTORY MANAGEMENT =====
function saveToHistory(quizId, score, total, time) {
  const entry = {
    id: quizId,
    name: quizzes[quizId].name,
    score,
    total,
    percent: Math.round((score / total) * 100),
    time: formatTime(time),
    date: new Date().toLocaleString("vi-VN"),
  };
  quizHistory.unshift(entry);
  if (quizHistory.length > 10) quizHistory.pop();
  localStorage.setItem("quizHistory", JSON.stringify(quizHistory));
  renderHistory();
}

function renderHistory() {
  if (quizHistory.length === 0) {
    historySection.style.display = "none";
    return;
  }

  historySection.style.display = "block";
  historyList.innerHTML = quizHistory
    .map(
      (h) => `
    <div class="history-item" onclick="quickRetry('${h.id}')">
      <div>
        <strong>${h.name}</strong><br/>
        <span style="font-size:12px; color:#999;">
          ${h.date} | Thời gian: ${h.time}
        </span>
      </div>
      <span class="history-score">${h.score}/${h.total} (${h.percent}%)</span>
    </div>
  `,
    )
    .join("");
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ===== QUIZ SELECTION =====
async function selectQuiz(quizId) {
  // Check if quiz exists and has questions
  if (!quizzes[quizId] || quizzes[quizId].questions.length === 0) {
    alert("Đề thi chưa sẵn sàng hoặc không có câu hỏi!");
    return;
  }

  startQuiz(quizId);
}

function quickRetry(quizId) {
  startQuiz(quizId);
}

function backToMenu() {
  if (timerInterval) clearInterval(timerInterval);
  quizMenuEl.style.display = "block";
  quizAreaEl.classList.add("hidden");
  resultPageEl.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function retryQuiz() {
  if (currentQuiz) {
    startQuiz(currentQuiz.id);
  }
}

// ===== TIMER =====
function updateTimerText() {
  timerTextEl.textContent = formatTime(elapsedSeconds);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  elapsedSeconds = 0;
  updateTimerText();
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    updateTimerText();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ===== QUIZ LOGIC =====
function startQuiz(quizId) {
  const quizData = quizzes[quizId];
  if (!quizData) return;

  const shuffledQuestions = shuffleArray(quizData.questions).map((q) => ({
    text: q.text,
    options: shuffleArray(q.options),
  }));

  currentQuiz = {
    id: quizId,
    name: quizData.name,
    questions: shuffledQuestions,
  };

  currentQuestionIndex = 0;
  userAnswers = Array(shuffledQuestions.length).fill(null);

  quizMenuEl.style.display = "none";
  quizAreaEl.classList.remove("hidden");
  resultPageEl.classList.add("hidden");

  quizTitleEl.textContent = currentQuiz.name;
  startTimer();
  renderQuestionList();
  renderQuestion(currentQuestionIndex);
  updateProgressText();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuestionList() {
  questionListEl.innerHTML = "";
  currentQuiz.questions.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.textContent = index + 1;
    btn.classList.add("question-button");
    btn.classList.add(userAnswers[index] === null ? "unanswered" : "answered");
    if (index === currentQuestionIndex) {
      btn.classList.add("current");
    }
    btn.addEventListener("click", () => goToQuestion(index));
    questionListEl.appendChild(btn);
  });
}

function renderQuestion(index) {
  const q = currentQuiz.questions[index];
  questionTextEl.textContent = `Câu ${index + 1}: ${q.text}`;
  optionsListEl.innerHTML = "";

  q.options.forEach((opt, optIndex) => {
    const li = document.createElement("li");
    li.classList.add("option-item");
    li.setAttribute("role", "button");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-label", `Đáp án ${optIndex + 1}: ${opt.text}`);

    const optionNumber = document.createElement("span");
    optionNumber.classList.add("option-number");
    optionNumber.textContent = optIndex + 1;

    const optionText = document.createElement("span");
    optionText.textContent = opt.text;

    li.appendChild(optionNumber);
    li.appendChild(optionText);

    if (userAnswers[index] === optIndex) {
      li.classList.add("selected");
    }

    li.addEventListener("click", () => {
      userAnswers[index] = optIndex;
      renderQuestion(index);
    });

    li.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        userAnswers[index] = optIndex;
        renderQuestion(index);
      }
    });

    optionsListEl.appendChild(li);
  });

  renderQuestionList();
  updateProgressText();
  updateButtonVisibility();
}

function updateButtonVisibility() {
  const isLast = currentQuestionIndex === currentQuiz.questions.length - 1;
  const isFirst = currentQuestionIndex === 0;

  prevBtn.style.display = isFirst ? "none" : "block";
  nextBtn.style.display = isLast ? "none" : "block";
  submitBtn.style.display = isLast ? "block" : "none";
}

function goToQuestion(index) {
  if (!currentQuiz) return;
  if (index < 0 || index >= currentQuiz.questions.length) return;
  currentQuestionIndex = index;
  renderQuestion(currentQuestionIndex);
}

function goToPrevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex -= 1;
    renderQuestion(currentQuestionIndex);
  }
}

function goToNextQuestion() {
  if (currentQuestionIndex < currentQuiz.questions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion(currentQuestionIndex);
  }
}

function updateProgressText() {
  const total = currentQuiz.questions.length;
  const answered = userAnswers.filter((a) => a !== null).length;
  const percent = Math.round((answered / total) * 100);
  progressTextEl.textContent = `Đã trả lời ${answered}/${total} câu`;

  if (progressFillEl) {
    progressFillEl.style.width = `${percent}%`;
  }
}

// ===== SUBMIT & RESULT =====
function submitQuiz() {
  if (!currentQuiz) return;

  stopTimer();

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  currentQuiz.questions.forEach((q, qIndex) => {
    const chosenIndex = userAnswers[qIndex];
    if (chosenIndex === null) {
      unansweredCount++;
    } else if (q.options[chosenIndex].correct) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  const total = currentQuiz.questions.length;
  const percent = Math.round((correctCount / total) * 100);

  // Save to history
  saveToHistory(currentQuiz.id, correctCount, total, elapsedSeconds);

  // Hide quiz area, show result page
  quizAreaEl.classList.add("hidden");
  resultPageEl.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Update result icon and title based on score
  const resultIcon = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");

  if (percent >= 80) {
    resultIcon.textContent = "🎉";
    resultTitle.textContent = "Xuất sắc!";
    resultPageEl.className = "result-page good";
  } else if (percent >= 50) {
    resultIcon.textContent = "👍";
    resultTitle.textContent = "Khá tốt!";
    resultPageEl.className = "result-page medium";
  } else {
    resultIcon.textContent = "💪";
    resultTitle.textContent = "Cố gắng lên!";
    resultPageEl.className = "result-page bad";
  }

  // Update summary
  const resultSummary = document.getElementById("result-summary");
  resultSummary.innerHTML = `
    <div class="score-display">${correctCount}/${total}</div>
    <div class="percent-display">${percent}%</div>
  `;

  // Update stats
  document.getElementById("correct-count").textContent = correctCount;
  document.getElementById("incorrect-count").textContent = incorrectCount;
  document.getElementById("time-taken").textContent =
    formatTime(elapsedSeconds);

  // Generate review list
  let reviewHtml = "";
  currentQuiz.questions.forEach((q, qIndex) => {
    const chosenIndex = userAnswers[qIndex];
    const chosenOption = chosenIndex !== null ? q.options[chosenIndex] : null;
    const correctOption = q.options.find((opt) => opt.correct);

    let statusClass = "";
    let statusIcon = "";

    if (chosenIndex === null) {
      statusClass = "unanswered";
      statusIcon = "❓";
    } else if (chosenOption && chosenOption.correct) {
      statusClass = "correct";
      statusIcon = "✓";
    } else {
      statusClass = "incorrect";
      statusIcon = "✗";
    }

    const chosenText = chosenOption ? chosenOption.text : "Không chọn";
    const correctText = correctOption ? correctOption.text : "";

    reviewHtml += `
      <div class="review-item ${statusClass}">
        <div class="review-header">
          <span class="review-number">Câu ${qIndex + 1}</span>
          <span class="review-status">${statusIcon}</span>
        </div>
        <div class="review-question">${q.text}</div>
        <div class="review-answer">
          <div class="answer-row ${chosenIndex === null ? "not-answered" : chosenOption && chosenOption.correct ? "correct-answer" : "wrong-answer"}">
            <strong>Bạn chọn:</strong> ${chosenText}
          </div>
          ${
            chosenIndex === null || !chosenOption.correct
              ? `
            <div class="answer-row correct-answer">
              <strong>Đáp án đúng:</strong> ${correctText}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  });

  document.getElementById("review-list").innerHTML = reviewHtml;
}

// ===== RENDER QUIZ MENU =====
function renderQuizMenu() {
  const quizGrid = document.querySelector(".quiz-selector-grid");
  if (!quizGrid) return;

  quizGrid.innerHTML = "";

  // Add all quiz options
  Object.keys(quizzes).forEach((quizId) => {
    const quiz = quizzes[quizId];
    const questionCount = quiz.questions.length;

    const card = document.createElement("div");
    card.className = "quiz-option-card";
    card.innerHTML = `
      <div class="quiz-option-header">
        <div class="quiz-badge ${quizId}">${quiz.name.split(" - ")[0]}</div>
        <span class="difficulty">${quiz.difficulty || "Cơ bản"}</span>
      </div>
      <p class="quiz-option-desc">
        ${questionCount} câu hỏi - ${quiz.name.split(" - ")[1] || quiz.name}
      </p>
      <button class="btn btn-primary" onclick="selectQuiz('${quizId}')">
        Bắt đầu
      </button>
    `;
    quizGrid.appendChild(card);
  });

  // Add random quiz option
  const randomCard = document.createElement("div");
  randomCard.className = "quiz-option-card random-quiz";
  randomCard.innerHTML = `
    <div class="quiz-option-header">
      <div class="quiz-badge random">🎲 Random</div>
      <span class="difficulty">Tùy chỉnh</span>
    </div>
    <p class="quiz-option-desc">
      Tạo đề thi ngẫu nhiên từ tất cả các đề
    </p>
    <button class="btn btn-primary" onclick="showRandomQuizModal()">
      Tạo đề Random
    </button>
  `;
  quizGrid.appendChild(randomCard);
}

// ===== RANDOM QUIZ =====
function showRandomQuizModal() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>🎲 Tạo đề thi ngẫu nhiên</h3>
      <p class="modal-subtitle">Chọn số lượng câu hỏi bạn muốn làm</p>
      
      <div class="random-options">
        <button class="random-btn" onclick="createRandomQuiz(10)">10 câu</button>
        <button class="random-btn" onclick="createRandomQuiz(20)">20 câu</button>
        <button class="random-btn" onclick="createRandomQuiz(30)">30 câu</button>
        <button class="random-btn" onclick="createRandomQuiz(50)">50 câu</button>
      </div>
      
      <div class="custom-count">
        <label for="custom-count-input">Hoặc nhập số câu tùy chỉnh:</label>
        <div class="custom-count-input-group">
          <input type="number" id="custom-count-input" min="1" max="500" value="15" />
          <button class="btn btn-primary" onclick="createRandomQuiz(parseInt(document.getElementById('custom-count-input').value))">
            Tạo đề
          </button>
        </div>
      </div>
      
      <button class="btn btn-secondary" onclick="closeRandomQuizModal()" style="margin-top: 20px; width: 100%;">
        Hủy
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeRandomQuizModal();
    }
  });
}

function closeRandomQuizModal() {
  const modal = document.querySelector(".modal-overlay");
  if (modal) {
    modal.remove();
  }
}

function createRandomQuiz(count) {
  // Collect all questions from all quizzes
  let allQuestions = [];
  Object.keys(quizzes).forEach((quizId) => {
    if (quizzes[quizId].questions.length > 0) {
      allQuestions = allQuestions.concat(quizzes[quizId].questions);
    }
  });

  if (allQuestions.length === 0) {
    alert("Chưa có câu hỏi nào được tải!");
    return;
  }

  // Validate count
  if (!count || count < 1) {
    alert("Vui lòng nhập số câu hợp lệ (tối thiểu 1 câu)!");
    return;
  }

  if (count > allQuestions.length) {
    alert(
      `Chỉ có ${allQuestions.length} câu hỏi. Sẽ tạo đề với tất cả câu hỏi có sẵn.`,
    );
    count = allQuestions.length;
  }

  // Shuffle and pick random questions
  const shuffled = shuffleArray([...allQuestions]);
  const selectedQuestions = shuffled.slice(0, count);

  // Create temporary random quiz
  quizzes.random = {
    name: `Đề Random - ${count} câu`,
    difficulty: "Random",
    questions: selectedQuestions,
  };

  closeRandomQuizModal();
  startQuiz("random");
}

function parseQuizFile(text) {
  const questions = [];
  const lines = text.split("\n").filter((line) => line.trim() !== "");

  let currentQuestion = null;
  let currentOptions = [];

  for (let line of lines) {
    line = line.trim();

    // Check if it's a question line (starts with "Câu")
    if (line.match(/^Câu\s+\d+:/)) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length > 0) {
        questions.push({
          text: currentQuestion,
          options: currentOptions,
        });
      }

      // Start new question
      currentQuestion = line.replace(/^Câu\s+\d+:\s*/, "");
      currentOptions = [];
    }
    // Check if it's an option line (starts with A., B., C., D. or *A., *B., etc.)
    else if (line.match(/^\*?[A-D]\./)) {
      const isCorrect = line.startsWith("*");
      const optionText = line.replace(/^\*?[A-D]\.\s*/, "");

      currentOptions.push({
        text: optionText,
        correct: isCorrect,
      });
    }
  }

  // Don't forget the last question
  if (currentQuestion && currentOptions.length > 0) {
    questions.push({
      text: currentQuestion,
      options: currentOptions,
    });
  }

  return questions;
}
