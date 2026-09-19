/**
 * ==============================================================================
 * FARIDPUR ENGINEERING COLLEGE SOFTWARE DEVELOPMENT CLUB (FEC SDC)
 * Recruitment Form Deadline Lock & Enforcement Module
 * ==============================================================================
 * Automatically locks and functionally disables #recruitmentForm when
 * APPLICATION_DEADLINE has passed.
 *
 * Isolated standalone script: zero modifications to script.js, config.js,
 * or countdown.js.
 */

(() => {
  "use strict";

  /**
   * APPLICATION DEADLINE (UTC+6)
   * Synchronized with the cutoff configured in countdown.js
   */
  const APPLICATION_DEADLINE = window.APPLICATION_DEADLINE
    ? new Date(window.APPLICATION_DEADLINE)
    : new Date("2026-09-26T23:59:00+06:00");

  let checkInterval = null;

  /**
   * Checks if current time has reached or passed the deadline
   * @returns {boolean}
   */
  function isDeadlinePassed() {
    const now = Date.now();
    if (now >= APPLICATION_DEADLINE.getTime()) {
      return true;
    }
    // Also respect expired state marked by countdown banner if already rendered
    const banner = document.getElementById("deadlineCountdownBanner");
    if (banner && banner.classList.contains("deadline-expired")) {
      return true;
    }
    return false;
  }

  /**
   * Disables all interactive form controls inside the form
   */
  function disableFormControls() {
    const form = document.getElementById("recruitmentForm");
    if (!form) return;

    const controls = form.querySelectorAll("input, select, textarea, button");
    controls.forEach((el) => {
      el.disabled = true;
    });
  }

  /**
   * Activates the frosted-glass lock overlay and enforces disabled state
   */
  function lockForm() {
    const overlay = document.getElementById("formLockOverlay");
    const formCard = document.getElementById("formCard");

    if (overlay) {
      overlay.classList.add("is-active");
      overlay.setAttribute("aria-hidden", "false");
    }

    if (formCard) {
      formCard.classList.add("form-locked");
    }

    disableFormControls();
  }

  /**
   * Evaluates current deadline state and activates lock if expired
   */
  function evaluateLockState() {
    if (isDeadlinePassed()) {
      lockForm();
      // Keep re-applying disable state periodically in case of devtools manipulation
    }
  }

  /**
   * Installs capture-phase submit guard to prevent any form submission
   * before other event handlers run
   */
  function installSubmitGuard() {
    const form = document.getElementById("recruitmentForm");
    if (!form) return;

    form.addEventListener(
      "submit",
      (e) => {
        if (isDeadlinePassed()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          lockForm();
          return false;
        }
      },
      true // Capture phase: intercepts prior to script.js submit handlers
    );
  }

  /**
   * Formats deadline timestamp for display inside the overlay card
   */
  function initDeadlineText() {
    const deadlineInfoEl = document.getElementById("formLockDeadlineInfo");
    if (!deadlineInfoEl) return;

    try {
      const formatted = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dhaka"
      }).format(APPLICATION_DEADLINE);

      deadlineInfoEl.textContent = `Deadline was: ${formatted} UTC+6`;
    } catch {
      deadlineInfoEl.textContent = "Deadline was: 26 Sep 2026, 23:59 UTC+6";
    }
  }

  /**
   * Module initialization
   */
  function initFormLock() {
    initDeadlineText();
    installSubmitGuard();
    evaluateLockState();

    // Check periodically alongside countdown ticks
    checkInterval = setInterval(evaluateLockState, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFormLock);
  } else {
    initFormLock();
  }
})();
