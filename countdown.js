/**
 * ==============================================================================
 * FARIDPUR ENGINEERING COLLEGE SOFTWARE DEVELOPMENT CLUB (FEC SDC)
 * Featured Application Deadline Live Countdown Banner
 * ==============================================================================
 * Self-contained countdown timer module for the featured hero banner.
 * Operates independently with zero dependencies and no shared state.
 */

(() => {
  "use strict";

  /**
   * APPLICATION DEADLINE (UTC+6)
   * Format: YYYY-MM-DDTHH:mm:ss+06:00
   * Editable timestamp for application cutoff
   */
  const APPLICATION_DEADLINE = new Date("2026-09-26T23:59:00+06:00");

  let timerInterval = null;
  const prevValues = { days: null, hours: null, minutes: null, seconds: null };

  function applyUnitUpdate(el, newVal, key) {
    if (!el) return;
    const formatted = String(newVal).padStart(2, "0");
    if (el.textContent !== formatted) {
      el.textContent = formatted;
      if (prevValues[key] !== null) {
        el.classList.remove("tick");
        // Force reflow to reliably restart CSS keyframe animation
        void el.offsetWidth;
        el.classList.add("tick");
      }
      prevValues[key] = formatted;
    }
  }

  function handleExpired() {
    const banner = document.getElementById("deadlineCountdownBanner");
    const timer = document.getElementById("countdownBannerTimer");
    const subtext = document.getElementById("countdownBannerSubtext");

    if (banner) {
      banner.classList.add("deadline-expired");
    }

    if (timer) {
      timer.innerHTML = '<div class="countdown-expired-msg">Applications Closed</div>';
    }

    if (subtext) {
      subtext.textContent = "The application window for this recruitment cycle has closed.";
    }

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateCountdown() {
    const banner = document.getElementById("deadlineCountdownBanner");
    if (!banner) return;

    const now = new Date().getTime();
    const distance = APPLICATION_DEADLINE.getTime() - now;

    if (distance <= 0) {
      handleExpired();
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById("cdDays");
    const hoursEl = document.getElementById("cdHours");
    const minutesEl = document.getElementById("cdMinutes");
    const secondsEl = document.getElementById("cdSeconds");

    applyUnitUpdate(daysEl, days, "days");
    applyUnitUpdate(hoursEl, hours, "hours");
    applyUnitUpdate(minutesEl, minutes, "minutes");
    applyUnitUpdate(secondsEl, seconds, "seconds");
  }

  function initCountdown() {
    const numEls = document.querySelectorAll(".countdown-num");
    numEls.forEach((el) => {
      el.addEventListener("animationend", () => {
        el.classList.remove("tick");
      });
    });

    updateCountdown();

    const remaining = APPLICATION_DEADLINE.getTime() - new Date().getTime();
    if (remaining > 0) {
      timerInterval = setInterval(updateCountdown, 1000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCountdown);
  } else {
    initCountdown();
  }
})();
