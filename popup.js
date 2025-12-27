class PomodoroTimer {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.syncWithBackground();
    this.startDisplayRefresh();
    this.setupMessageListener();
  }

  initializeElements() {
    this.timerDisplay = document.getElementById("timerDisplay");
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.workDurationSelect = document.getElementById("workDuration");
    this.breakDurationSelect = document.getElementById("breakDuration");
    this.toggleSwitch = document.getElementById("workBreakToggle");
    this.sessionLabel = document.getElementById("sessionLabel");
    this.soundNotification = document.getElementById("soundNotification");
    this.desktopNotification = document.getElementById("desktopNotification");
    this.autoStartBreak = document.getElementById("autoStartBreak");
    this.resetStatsBtn = document.getElementById("resetStatsBtn");
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.calendarDaysContainer = document.getElementById("calendarDays");
    this.monthYearDisplay = document.getElementById("monthYearDisplay");
    this.prevMonthBtn = document.getElementById("prevMonthBtn");
    this.nextMonthBtn = document.getElementById("nextMonthBtn");
    this.currentCalendarDate = new Date();
  }

  setupMessageListener() {
    const self = this;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'playTimerAlert') {
        self.playTimerAlert(request.message, request.wasWorkSession);
      }
    });
  }

  playTimerAlert(message, wasWorkSession) {
    // Play sound
    this.playNotificationSound();

    // Sync with background to update UI to show new session
    this.syncWithBackground();

    // Play speech announcement
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      speechSynthesis.speak(utterance);
    } catch (e) {
      console.log("Speech error: " + e);
    }
  }

  playNotificationSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();

      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(context.destination);

          oscillator.frequency.value = 800;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0.3, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.3);
        }, i * 400);
      }
    } catch (e) {
      console.log("Sound error: " + e);
    }
  }

  setupEventListeners() {
    const self = this;
    this.startBtn.addEventListener("click", function () {
      self.start();
    });
    this.pauseBtn.addEventListener("click", function () {
      self.pause();
    });
    this.resetBtn.addEventListener("click", function () {
      self.reset();
    });
    this.prevMonthBtn.addEventListener("click", function () {
      self.previousMonth();
    });
    this.nextMonthBtn.addEventListener("click", function () {
      self.nextMonth();
    });
    this.workDurationSelect.addEventListener("change", function (e) {
      const newDuration = parseInt(e.target.value) * 60;
      chrome.runtime.sendMessage({
        action: "updateSettings",
        workDuration: newDuration,
        breakDuration: self.getCurrentBreakDuration()
      }, () => {
        self.syncWithBackground();
      });
    });
    this.breakDurationSelect.addEventListener("change", function (e) {
      const newDuration = parseInt(e.target.value) * 60;
      chrome.runtime.sendMessage({
        action: "updateSettings",
        workDuration: self.getCurrentWorkDuration(),
        breakDuration: newDuration
      }, () => {
        self.syncWithBackground();
      });
    });
    this.toggleSwitch.addEventListener("change", function (e) {
      chrome.runtime.sendMessage({
        action: "toggleSession",
        isWorkSession: e.target.checked
      }, () => {
        self.syncWithBackground();
      });
    });
    this.tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        self.switchTab(btn.dataset.tab);
      });
    });
    this.resetStatsBtn.addEventListener("click", function () {
      self.resetStats();
    });
  }

  previousMonth() {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
    this.renderCalendar();
  }

  getColorForCount(count) {
    if (count === 0) return '#fff8e1';
    if (count < 2) return '#fff8e1';
    if (count < 4) return '#c8e6c9';
    if (count < 6) return '#81c784';
    if (count < 8) return '#4db8ff';
    if (count < 10) return '#1e88e5';
    return '#1565c0';
  }

  renderCalendar() {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    this.monthYearDisplay.textContent = monthNames[month] + " " + year;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get today's date
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Clear previous days
    this.calendarDaysContainer.innerHTML = '';

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day empty';
      this.calendarDaysContainer.appendChild(emptyCell);
    }

    // Add days of month
    const self = this;
    chrome.storage.local.get(['dailyPomodoros'], function (data) {
      const dailyPomodoros = data.dailyPomodoros || {};

      for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';

        const dateString = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        const count = dailyPomodoros[dateString] || 0;
        const color = self.getColorForCount(count);

        dayCell.style.backgroundColor = color;
        dayCell.textContent = day;
        dayCell.title = dateString + ': ' + count + ' pomodoros';

        // Highlight today's date with red border
        if (year === todayYear && month === todayMonth && day === todayDate) {
          dayCell.classList.add('today');
        }

        self.calendarDaysContainer.appendChild(dayCell);
      }
    });
  }

  switchTab(tabName) {
    this.tabBtns.forEach(function (btn) {
      btn.classList.remove("active");
    });
    this.tabContents.forEach(function (content) {
      content.classList.remove("active");
    });
    const activeBtn = document.querySelector("[data-tab=" + JSON.stringify(tabName) + "]");
    const activeContent = document.querySelector(".tab-content[data-tab=" + JSON.stringify(tabName) + "]");
    if (activeBtn) activeBtn.classList.add("active");
    if (activeContent) activeContent.classList.add("active");
    if (tabName === "stats") {
      this.renderCalendar();
    }
  }

  getCurrentWorkDuration() {
    return parseInt(this.workDurationSelect.value) * 60;
  }

  getCurrentBreakDuration() {
    return parseInt(this.breakDurationSelect.value) * 60;
  }

  start() {
    const self = this;
    chrome.runtime.sendMessage({
      action: "startTimer",
      workDuration: self.getCurrentWorkDuration(),
      breakDuration: self.getCurrentBreakDuration()
    }, () => {
      self.syncWithBackground();
    });
  }

  pause() {
    const self = this;
    chrome.runtime.sendMessage({ action: "pauseTimer" }, () => {
      self.syncWithBackground();
    });
  }

  reset() {
    const self = this;
    chrome.runtime.sendMessage({ action: "resetTimer" }, () => {
      self.syncWithBackground();
    });
  }

  syncWithBackground() {
    const self = this;
    chrome.runtime.sendMessage({ action: "getState" }, (response) => {
      if (response && response.state) {
        const state = response.state;
        this.updateUIFromState(state);
      }
    });
  }

  updateUIFromState(state) {
    // Update displays
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    const minuteStr = String(minutes).padStart(2, "0");
    const secondStr = String(seconds).padStart(2, "0");
    const displayText = minuteStr + ":" + secondStr;
    this.timerDisplay.textContent = displayText;
    this.sessionLabel.textContent = state.isWorkSession ? "Work" : "Break";

    // Update buttons
    if (state.isRunning) {
      this.startBtn.style.display = "none";
      this.pauseBtn.style.display = "flex";
      this.workDurationSelect.disabled = true;
      this.breakDurationSelect.disabled = true;
      this.toggleSwitch.disabled = true;
    } else {
      this.startBtn.style.display = "flex";
      this.pauseBtn.style.display = "none";
      this.workDurationSelect.disabled = false;
      this.breakDurationSelect.disabled = false;
      this.toggleSwitch.disabled = false;
    }

    // Update circle progress
    const totalTime = state.isWorkSession ? state.workDuration : state.breakDuration;
    const percentage = (state.timeRemaining / totalTime) * 100;
    const circle = document.querySelector(".circle-progress");
    if (circle) {
      const circumference = 2 * Math.PI * 95;
      const offset = circumference - (percentage / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    // Update toggle switch
    this.toggleSwitch.checked = state.isWorkSession;
    this.workDurationSelect.value = String(state.workDuration / 60);
    this.breakDurationSelect.value = String(state.breakDuration / 60);

    // Update session type for styling
    const sessionType = state.isWorkSession ? 'work' : 'break';
    document.querySelector('.container').setAttribute('data-session-type', sessionType);
  }

  startDisplayRefresh() {
    const self = this;
    setInterval(() => {
      self.syncWithBackground();
    }, 500); // Update display every 500ms to match background timer
  }

  resetStats() {
    const confirmed = confirm("Are you sure?");
    if (confirmed) {
      const self = this;
      chrome.runtime.sendMessage({ action: "resetStats" }, () => {
        self.syncWithBackground();
      });
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    new PomodoroTimer();
  });
} else {
  new PomodoroTimer();
}
