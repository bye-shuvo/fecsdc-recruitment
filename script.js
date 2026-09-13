/**
 * =========================================================================
 * FARIDPUR ENGINEERING COLLEGE SOFTWARE DEVELOPMENT CLUB (FEC SDC)
 * Junior Executive Recruitment Portal - Client Logic & Google Apps Script Hook
 * =========================================================================
 */

// =========================================================================
// 1. CONFIGURATION
// =========================================================================
/**
 * PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE:
 * Example: "https://script.google.com/macros/s/AKfycbx.../exec"
 *
 * NOTE: If left empty, the form operates in "DEMO SIMULATION MODE" so you can
 * visually preview and test the complete submission receipt flow locally.
 * Global APPS_SCRIPT_WEB_APP_URL is loaded from config.js (ignored in Git)
 */

// File Upload Constraints
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["application/pdf"];

// Photo Upload Constraints
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"];


// =========================================================================
// 2. DOM ELEMENT SELECTORS
// =========================================================================
const form = document.getElementById("recruitmentForm");
const formCard = document.getElementById("formCard");
const submitBtn = document.getElementById("btnSubmit");
const errorAlert = document.getElementById("formErrorAlert");
const errorMessageText = document.getElementById("errorMessageText");
const whyJoinTextarea = document.getElementById("whyJoin");
const charCountDisplay = document.getElementById("charCount");

// Multi-Step Wizard Elements
const wizardProgressFill = document.getElementById("wizardProgressFill");
const mobileStepBadge = document.getElementById("mobileStepBadge");
const mobileStepTitle = document.getElementById("mobileStepTitle");
const stepNodes = Array.from(document.querySelectorAll(".step-node"));
const stepPanels = Array.from(document.querySelectorAll(".wizard-step-panel"));
const btnWizardPrev = document.getElementById("btnWizardPrev");
const btnWizardNext = document.getElementById("btnWizardNext");
const declarationCheck = document.getElementById("declarationCheck");

// Step 2 & 3 Conditional Elements
const chkOtherTechSkill = document.getElementById("chkOtherTechSkill");
const otherTechSkillContainer = document.getElementById("otherTechSkillContainer");
const otherTechSkillInput = document.getElementById("otherTechSkillInput");

const chkOtherProgLang = document.getElementById("chkOtherProgLang");
const otherProgLangContainer = document.getElementById("otherProgLangContainer");
const otherProgLangInput = document.getElementById("otherProgLangInput");

const chkOtherSoftSkill = document.getElementById("chkOtherSoftSkill");
const otherSoftSkillContainer = document.getElementById("otherSoftSkillContainer");
const otherSoftSkillInput = document.getElementById("otherSoftSkillInput");

const radioLeadershipYes = document.getElementById("radioLeadershipYes");
const radioLeadershipNo = document.getElementById("radioLeadershipNo");
const leadershipDescBox = document.getElementById("leadershipDescBox");
const leadershipDesc = document.getElementById("leadershipDesc");

// Step 5 Review Containers
const reviewPhotoThumbnail = document.getElementById("reviewPhotoThumbnail");
const reviewPersonalInfoGrid = document.getElementById("reviewPersonalInfoGrid");
const reviewTechInfoGrid = document.getElementById("reviewTechInfoGrid");
const reviewExperienceInfoGrid = document.getElementById("reviewExperienceInfoGrid");
const reviewMotivationInfoGrid = document.getElementById("reviewMotivationInfoGrid");
const jumpStepBtns = Array.from(document.querySelectorAll(".btn-jump-step"));

// Candidate Photo Elements
const photoGroup = document.getElementById("photoGroup");
const tabUploadPhoto = document.getElementById("tabUploadPhoto");
const tabWebcamPhoto = document.getElementById("tabWebcamPhoto");
const panelUploadPhoto = document.getElementById("panelUploadPhoto");
const panelWebcamPhoto = document.getElementById("panelWebcamPhoto");
const photoDropzone = document.getElementById("photoDropzone");
const photoFileInput = document.getElementById("photoFileInput");
const webcamVideo = document.getElementById("webcamVideo");
const btnCapturePhoto = document.getElementById("btnCapturePhoto");
const btnSwitchCamera = document.getElementById("btnSwitchCamera");
const webcamFallbackMsg = document.getElementById("webcamFallbackMsg");
const webcamFallbackText = document.getElementById("webcamFallbackText");
const photoPreviewCard = document.getElementById("photoPreviewCard");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const photoPreviewName = document.getElementById("photoPreviewName");
const photoPreviewSize = document.getElementById("photoPreviewSize");
const photoPreviewTag = document.getElementById("photoPreviewTag");
const btnRetakePhoto = document.getElementById("btnRetakePhoto");
const photoCanvas = document.getElementById("photoCanvas");

// Receipt Avatar Elements
const receiptAvatarRow = document.getElementById("receiptAvatarRow");
const receiptAvatarImg = document.getElementById("receiptAvatarImg");

// File Upload Elements (Resume)
const fileDropzone = document.getElementById("fileDropzone");
const resumeFileInput = document.getElementById("resumeFile");
const fileSelectedCard = document.getElementById("fileSelectedCard");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const fileSizeDisplay = document.getElementById("fileSizeDisplay");
const btnRemoveFile = document.getElementById("btnRemoveFile");

// Receipt Modal Elements
const receiptCard = document.getElementById("submissionReceiptCard");
const receiptApplicantId = document.getElementById("receiptApplicantId");
const receiptName = document.getElementById("receiptName");
const receiptStudentId = document.getElementById("receiptStudentId");
const receiptTrack = document.getElementById("receiptTrack");
const receiptTimestamp = document.getElementById("receiptTimestamp");
const btnReceiptReset = document.getElementById("btnReceiptReset");

// Mobile Menu Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileDrawer = document.getElementById("mobileDrawer");

// Current files in memory
let selectedResumeFile = null;
let resumeBase64String = null;

// Photo State in memory
let selectedPhotoBase64 = null;
let selectedPhotoFileName = null;
let webcamStream = null;
let currentFacingMode = "user"; // "user" (front) or "environment" (rear)
let activePhotoTab = "upload"; // "upload" or "webcam"

// Multi-Step Wizard State
let currentStep = 1;
const TOTAL_STEPS = 5;
const STEP_TITLES = {
  1: "Personal Information",
  2: "Technical Background",
  3: "Soft Skills & Experience",
  4: "Motivation & Commitment",
  5: "Review & Final Confirmation"
};

// LocalStorage key for form progress
const LS_KEY = 'fecsdc_form_progress';


// =========================================================================
// 3. INITIALIZATION & EVENT LISTENERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initMobileNavigation();
  initCharacterCounter();
  initPhotoHandlers();
  initFileUploadHandlers();
  initConditionalFields();
  initWizardNavigation();
  initFormSubmission();
  initResetHandler();
  initFormAutoSave();
  restoreFormState();
});


// =========================================================================
// 4. MOBILE MENU DRAWER
// =========================================================================
function initMobileNavigation() {
  if (!mobileMenuBtn || !mobileDrawer) return;

  mobileMenuBtn.addEventListener("click", () => {
    const isExpanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
    mobileMenuBtn.setAttribute("aria-expanded", String(!isExpanded));
    mobileDrawer.setAttribute("aria-hidden", String(isExpanded));
    mobileDrawer.classList.toggle("is-open", !isExpanded);
  });

  // Close drawer on clicking links
  mobileDrawer.querySelectorAll(".mobile-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenuBtn.setAttribute("aria-expanded", "false");
      mobileDrawer.setAttribute("aria-hidden", "true");
      mobileDrawer.classList.remove("is-open");
    });
  });
}


// =========================================================================
// 5. CHARACTER COUNTER
// =========================================================================
function initCharacterCounter() {
  if (!whyJoinTextarea || !charCountDisplay) return;

  whyJoinTextarea.addEventListener("input", () => {
    const count = whyJoinTextarea.value.length;
    charCountDisplay.textContent = count;
    if (count < 40 && count > 0) {
      charCountDisplay.style.color = "var(--brand-orange)";
    } else {
      charCountDisplay.style.color = "var(--text-dark-muted)";
    }
  });
}


// =========================================================================
// 5.5 CANDIDATE PHOTO (UPLOAD & WEBCAM CAPTURE)
// =========================================================================
function initPhotoHandlers() {
  if (!photoGroup) return;

  // Tab switching
  if (tabUploadPhoto && tabWebcamPhoto) {
    tabUploadPhoto.addEventListener("click", () => {
      switchPhotoTab("upload");
    });

    tabWebcamPhoto.addEventListener("click", () => {
      switchPhotoTab("webcam");
    });
  }

  // File dropzone click & keyboard
  if (photoDropzone && photoFileInput) {
    photoDropzone.addEventListener("click", () => {
      photoFileInput.click();
    });

    photoDropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        photoFileInput.click();
      }
    });

    photoFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processSelectedPhoto(files[0]);
      }
    });

    ["dragenter", "dragover"].forEach(evtName => {
      photoDropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        photoDropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach(evtName => {
      photoDropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        photoDropzone.classList.remove("is-dragover");
      });
    });

    photoDropzone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processSelectedPhoto(files[0]);
      }
    });
  }

  // Webcam actions
  if (btnCapturePhoto) {
    btnCapturePhoto.addEventListener("click", () => {
      capturePhotoFromWebcam();
    });
  }

  if (btnSwitchCamera) {
    btnSwitchCamera.addEventListener("click", () => {
      currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
      if (webcamVideo) {
        webcamVideo.style.transform = currentFacingMode === "user" ? "scaleX(-1)" : "scaleX(1)";
      }
      startWebcam();
    });
  }

  // Retake / Change Photo
  if (btnRetakePhoto) {
    btnRetakePhoto.addEventListener("click", () => {
      clearSelectedPhoto();
    });
  }
}

function switchPhotoTab(tabName) {
  activePhotoTab = tabName;
  hideError();

  if (tabName === "upload") {
    tabUploadPhoto.classList.add("active");
    tabUploadPhoto.setAttribute("aria-selected", "true");
    tabWebcamPhoto.classList.remove("active");
    tabWebcamPhoto.setAttribute("aria-selected", "false");

    panelUploadPhoto.classList.add("active");
    panelWebcamPhoto.classList.remove("active");
    stopWebcam();
  } else {
    tabWebcamPhoto.classList.add("active");
    tabWebcamPhoto.setAttribute("aria-selected", "true");
    tabUploadPhoto.classList.remove("active");
    tabUploadPhoto.setAttribute("aria-selected", "false");

    panelWebcamPhoto.classList.add("active");
    panelUploadPhoto.classList.remove("active");
    startWebcam();
  }
}

async function startWebcam() {
  stopWebcam();
  if (webcamFallbackMsg) webcamFallbackMsg.style.display = "none";

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showWebcamFallback("Camera API is not supported in this browser. Please use the Upload Photo option.");
    return;
  }

  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 640 },
        height: { ideal: 640 }
      },
      audio: false
    };

    webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (webcamVideo) {
      webcamVideo.srcObject = webcamStream;
      webcamVideo.style.transform = currentFacingMode === "user" ? "scaleX(-1)" : "scaleX(1)";
      await webcamVideo.play().catch(() => { });
    }

    // Check if multiple camera devices exist to show flip button
    checkCameraDevices();

  } catch (err) {
    console.warn("[Webcam Access Error]", err);
    let errorMsg = "Unable to access camera. Please allow camera permissions or use the Upload Photo option.";
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      errorMsg = "Camera permission was denied. Please allow camera access in your browser or use Upload Photo.";
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      errorMsg = "No camera found on this device. Please use the Upload Photo option.";
    }
    showWebcamFallback(errorMsg);
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  if (webcamVideo) {
    webcamVideo.srcObject = null;
  }
}

async function checkCameraDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices || !btnSwitchCamera) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === "videoinput");
    if (videoInputs.length > 1) {
      btnSwitchCamera.style.display = "inline-flex";
    }
  } catch (e) {
    // Ignore device enumeration issues
  }
}

function showWebcamFallback(message) {
  if (webcamFallbackMsg && webcamFallbackText) {
    webcamFallbackText.textContent = message;
    webcamFallbackMsg.style.display = "flex";
  }
  // Automatically switch back to upload tab after showing notice
  setTimeout(() => {
    switchPhotoTab("upload");
  }, 3500);
}

function capturePhotoFromWebcam() {
  if (!webcamVideo || !photoCanvas) return;

  const vWidth = webcamVideo.videoWidth || 640;
  const vHeight = webcamVideo.videoHeight || 480;

  // Crop to center 1:1 square
  const cropSize = Math.min(vWidth, vHeight);
  const startX = (vWidth - cropSize) / 2;
  const startY = (vHeight - cropSize) / 2;

  const targetResolution = 600;
  photoCanvas.width = targetResolution;
  photoCanvas.height = targetResolution;
  const ctx = photoCanvas.getContext("2d");

  // If user facing (front camera), mirror so preview matches what candidate saw
  if (currentFacingMode === "user") {
    ctx.translate(targetResolution, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(webcamVideo, startX, startY, cropSize, cropSize, 0, 0, targetResolution, targetResolution);

  const dataUrl = photoCanvas.toDataURL("image/jpeg", 0.9);
  const sizeBytes = Math.round((dataUrl.length - 23) * 0.75);

  selectedPhotoBase64 = dataUrl;
  selectedPhotoFileName = "Live_Webcam_Photo.jpg";

  stopWebcam();
  displayPhotoPreview(dataUrl, selectedPhotoFileName, formatBytes(sizeBytes), "Captured via Webcam");
}

function processSelectedPhoto(file) {
  hideError();

  const isImage = file.type === "image/jpeg" || file.type === "image/png" || file.name.match(/\.(jpe?g|png)$/i);
  if (!isImage) {
    showError("Invalid Photo Format: Only JPG and PNG image files are accepted.");
    clearSelectedPhoto();
    return;
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    showError(`Photo Too Large (${sizeInMb} MB): Image must not exceed 2 MB.`);
    clearSelectedPhoto();
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    selectedPhotoBase64 = event.target.result;
    selectedPhotoFileName = file.name;
    displayPhotoPreview(selectedPhotoBase64, file.name, formatBytes(file.size), "Uploaded from Device");
  };
  reader.onerror = () => {
    showError("Failed to read image file. Please try selecting the photo again.");
    clearSelectedPhoto();
  };
  reader.readAsDataURL(file);
}

function displayPhotoPreview(imgSrc, name, sizeText, sourceLabel) {
  if (!photoPreviewCard || !photoPreviewImg) return;

  photoPreviewImg.src = imgSrc;
  photoPreviewName.textContent = name;
  photoPreviewSize.textContent = sizeText;
  if (photoPreviewTag) photoPreviewTag.textContent = sourceLabel;

  // Hide tab navigation and panels while photo is selected
  if (tabUploadPhoto && tabWebcamPhoto) {
    tabUploadPhoto.parentElement.style.display = "none";
  }
  if (panelUploadPhoto) panelUploadPhoto.classList.remove("active");
  if (panelWebcamPhoto) panelWebcamPhoto.classList.remove("active");

  photoPreviewCard.classList.add("is-active");
}

function clearSelectedPhoto() {
  selectedPhotoBase64 = null;
  selectedPhotoFileName = null;
  if (photoFileInput) photoFileInput.value = "";
  if (photoPreviewCard) photoPreviewCard.classList.remove("is-active");

  // Restore tabs
  if (tabUploadPhoto && tabWebcamPhoto) {
    tabUploadPhoto.parentElement.style.display = "flex";
  }

  switchPhotoTab(activePhotoTab);
}


// =========================================================================
// 6. FILE UPLOAD & BASE64 ENCODING
// =========================================================================
function initFileUploadHandlers() {
  if (!resumeFileInput || !fileDropzone) return;

  // Click on dropzone opens native file picker
  fileDropzone.addEventListener("click", () => {
    resumeFileInput.click();
  });

  // Keyboard Enter / Space support on dropzone
  fileDropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      resumeFileInput.click();
    }
  });

  // File Input Changed
  resumeFileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  });

  // Drag and Drop Events
  ["dragenter", "dragover"].forEach(evtName => {
    fileDropzone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach(evtName => {
    fileDropzone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropzone.classList.remove("is-dragover");
    });
  });

  fileDropzone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  });

  // Remove File Button
  if (btnRemoveFile) {
    btnRemoveFile.addEventListener("click", (e) => {
      e.stopPropagation();
      clearSelectedFile();
    });
  }
}

/**
 * Validates selected file (extension, MIME, size) and converts to Base64
 */
function processSelectedFile(file) {
  hideError();

  // Validate File Extension & MIME
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    showError("Invalid File Format: Only PDF documents (.pdf) are accepted.");
    clearSelectedFile();
    return;
  }

  // Validate File Size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    showError(`File Too Large (${sizeInMb} MB): Resumes must not exceed 5 MB.`);
    clearSelectedFile();
    return;
  }

  // File is valid: display preview card
  selectedResumeFile = file;
  fileNameDisplay.textContent = file.name;
  fileSizeDisplay.textContent = formatBytes(file.size);
  fileSelectedCard.classList.add("is-active");
  fileDropzone.style.display = "none";

  // Read as Base64 for Google Apps Script payload
  const reader = new FileReader();
  reader.onload = (event) => {
    // result contains "data:application/pdf;base64,JVBERi0x..."
    resumeBase64String = event.target.result;
  };
  reader.onerror = () => {
    showError("Failed to read the local PDF file. Please try selecting the file again.");
    clearSelectedFile();
  };
  reader.readAsDataURL(file);
}

function clearSelectedFile() {
  selectedResumeFile = null;
  resumeBase64String = null;
  resumeFileInput.value = "";
  fileSelectedCard.classList.remove("is-active");
  fileDropzone.style.display = "block";
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}


// =========================================================================
// 7. CONDITIONAL FIELDS LOGIC
// =========================================================================
function initConditionalFields() {
  // Checkbox "Other" toggles
  setupOtherCheckboxToggle(chkOtherTechSkill, otherTechSkillContainer, otherTechSkillInput);
  setupOtherCheckboxToggle(chkOtherProgLang, otherProgLangContainer, otherProgLangInput);
  setupOtherCheckboxToggle(chkOtherSoftSkill, otherSoftSkillContainer, otherSoftSkillInput);

  // Radio Leadership Experience conditional reveal
  const leadershipRadios = document.querySelectorAll('input[name="leadershipExp"]');
  leadershipRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radioLeadershipYes && radioLeadershipYes.checked) {
        if (leadershipDescBox) leadershipDescBox.style.display = "block";
        if (leadershipDesc) leadershipDesc.focus();
      } else {
        if (leadershipDescBox) leadershipDescBox.style.display = "none";
        if (leadershipDesc) leadershipDesc.value = "";
      }
    });
  });
}

function setupOtherCheckboxToggle(checkboxEl, containerEl, inputEl) {
  if (!checkboxEl || !containerEl) return;

  checkboxEl.addEventListener("change", () => {
    if (checkboxEl.checked) {
      containerEl.style.display = "block";
      if (inputEl) inputEl.focus();
    } else {
      containerEl.style.display = "none";
      if (inputEl) inputEl.value = "";
    }
  });
}

/**
 * Extracts checked values from a checkbox group and appends the custom "Other" text if specified.
 */
function getCheckedValuesWithOther(fieldName, chkOtherEl, otherInputEl) {
  const selectedValues = [];
  const checkedBoxes = document.querySelectorAll(`input[name="${fieldName}"]:checked`);

  checkedBoxes.forEach(cb => {
    if (cb.value !== "Other") {
      selectedValues.push(cb.value);
    }
  });

  if (chkOtherEl && chkOtherEl.checked && otherInputEl) {
    const customText = otherInputEl.value.trim();
    if (customText) {
      selectedValues.push("Other: " + customText);
    }
  }

  return selectedValues;
}


// =========================================================================
// 8. MULTI-STEP WIZARD NAVIGATION & VALIDATION
// =========================================================================
function initWizardNavigation() {
  // Next button click
  if (btnWizardNext) {
    btnWizardNext.addEventListener("click", () => {
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
    });
  }

  // Back button click
  if (btnWizardPrev) {
    btnWizardPrev.addEventListener("click", () => {
      goToStep(currentStep - 1);
    });
  }

  // Desktop step node clicks (allow jumping back to previously completed steps or advancing if valid)
  stepNodes.forEach(node => {
    node.addEventListener("click", () => {
      const targetStep = parseInt(node.getAttribute("data-step"), 10);
      if (isNaN(targetStep) || targetStep === currentStep) return;

      if (targetStep < currentStep) {
        goToStep(targetStep);
      } else if (targetStep > currentStep) {
        // Validate current step before advancing forward
        if (validateStep(currentStep)) {
          goToStep(targetStep);
        }
      }
    });
  });

  // Step 5 Review Section "Edit Step X" jump buttons
  jumpStepBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetStep = parseInt(btn.getAttribute("data-target"), 10);
      if (!isNaN(targetStep) && targetStep >= 1 && targetStep <= TOTAL_STEPS) {
        goToStep(targetStep);
      }
    });
  });
}

/**
 * Changes active wizard step, updates progress indicator, mobile pill, and buttons.
 */
function goToStep(step) {
  if (step < 1 || step > TOTAL_STEPS) return;
  hideError();

  // 1. Switch step panels
  stepPanels.forEach(panel => {
    const panelStep = parseInt(panel.getAttribute("data-step"), 10);
    panel.classList.toggle("is-active", panelStep === step);
  });

  // 2. Update desktop step nodes
  stepNodes.forEach(node => {
    const nodeStep = parseInt(node.getAttribute("data-step"), 10);
    node.classList.toggle("is-active", nodeStep === step);
    node.classList.toggle("is-completed", nodeStep < step);
  });

  // 3. Update top progress bar
  if (wizardProgressFill) {
    const percentage = (step / TOTAL_STEPS) * 100;
    wizardProgressFill.style.width = `${percentage}%`;
  }

  // 4. Update mobile counter & title
  if (mobileStepBadge) {
    mobileStepBadge.textContent = `Step ${step} of ${TOTAL_STEPS}`;
  }
  if (mobileStepTitle) {
    mobileStepTitle.textContent = STEP_TITLES[step] || "";
  }

  // 5. Toggle navigation buttons
  if (btnWizardPrev) {
    btnWizardPrev.style.display = step === 1 ? "none" : "inline-flex";
  }
  if (btnWizardNext) {
    btnWizardNext.style.display = step === TOTAL_STEPS ? "none" : "inline-flex";
  }
  if (submitBtn) {
    submitBtn.style.display = step === TOTAL_STEPS ? "inline-flex" : "none";
  }

  // 6. If entering Step 5, generate the live review summary
  if (step === 5) {
    buildReviewSummary();
  }

  currentStep = step;

  // 7. Scroll form card into view smoothly
  if (formCard) {
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // 8. Persist new step index to localStorage
  saveFormState();
}

/**
 * Validates only the fields in the specified step.
 * Returns true if step is valid, false otherwise.
 */
function validateStep(step) {
  hideError();

  // -------------------------------------------------------------
  // STEP 1 VALIDATION (Personal Info & Photo)
  // -------------------------------------------------------------
  if (step === 1) {
    const fullName = form.fullName ? form.fullName.value.trim() : "";
    const studentId = form.studentId ? form.studentId.value.trim() : "";
    const batch = form.batch ? form.batch.value : "";
    const gender = form.gender ? form.gender.value : "";
    const department = form.department ? form.department.value : "";
    const yearSemester = form.yearSemester ? form.yearSemester.value : "";
    const phone = form.phone ? form.phone.value.trim() : "";
    const email = form.email ? form.email.value.trim() : "";

    if (!fullName) {
      showError("Please enter your Full Name.");
      if (form.fullName) form.fullName.focus();
      return false;
    }

    if (!studentId) {
      showError("Please enter your Student ID.");
      if (form.studentId) form.studentId.focus();
      return false;
    }

    if (!batch) {
      showError("Please select your academic Batch.");
      if (form.batch) form.batch.focus();
      return false;
    }

    if (!gender) {
      showError("Please select your Gender.");
      if (form.gender) form.gender.focus();
      return false;
    }

    if (!department) {
      showError("Please select your academic Department.");
      if (form.department) form.department.focus();
      return false;
    }

    if (!yearSemester) {
      showError("Please select your Year / Semester.");
      if (form.yearSemester) form.yearSemester.focus();
      return false;
    }

    // Phone format validation (allows standard BD format +8801... or 01... or international)
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phone || !phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
      showError("Please enter a valid active contact phone number (e.g. 017xxxxxxxx or +88017xxxxxxxx).");
      if (form.phone) form.phone.focus();
      return false;
    }

    // Email RFC format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError("Please enter a valid email address.");
      if (form.email) form.email.focus();
      return false;
    }

    if (!selectedPhotoBase64) {
      showError("Candidate photo is required. Please upload an ID photo or take one using your webcam.");
      if (photoGroup) photoGroup.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------
  // STEP 2 VALIDATION (Technical Background)
  // -------------------------------------------------------------
  if (step === 2) {
    const techSkills = getCheckedValuesWithOther("techSkills", chkOtherTechSkill, otherTechSkillInput);
    if (chkOtherTechSkill && chkOtherTechSkill.checked && (!otherTechSkillInput || !otherTechSkillInput.value.trim())) {
      showError("Please specify your custom technical skill in the text box provided.");
      if (otherTechSkillInput) otherTechSkillInput.focus();
      return false;
    }
    if (techSkills.length === 0) {
      showError("Please select at least one Technical Skill or Domain.");
      return false;
    }

    const progLanguages = getCheckedValuesWithOther("progLanguages", chkOtherProgLang, otherProgLangInput);
    if (chkOtherProgLang && chkOtherProgLang.checked && (!otherProgLangInput || !otherProgLangInput.value.trim())) {
      showError("Please specify your custom programming language in the text box provided.");
      if (otherProgLangInput) otherProgLangInput.focus();
      return false;
    }
    if (progLanguages.length === 0) {
      showError("Please select at least one Programming Language.");
      return false;
    }

    const skillLevelSelected = document.querySelector('input[name="skillLevel"]:checked');
    if (!skillLevelSelected) {
      showError("Please select your Overall Skill Level self-assessment.");
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------
  // STEP 3 VALIDATION (Soft Skills & Experience)
  // -------------------------------------------------------------
  if (step === 3) {
    const softSkills = getCheckedValuesWithOther("softSkills", chkOtherSoftSkill, otherSoftSkillInput);
    if (chkOtherSoftSkill && chkOtherSoftSkill.checked && (!otherSoftSkillInput || !otherSoftSkillInput.value.trim())) {
      showError("Please specify your custom soft skill in the text box provided.");
      if (otherSoftSkillInput) otherSoftSkillInput.focus();
      return false;
    }
    if (softSkills.length === 0) {
      showError("Please select at least one Soft Skill or Strength.");
      return false;
    }

    const leadershipChecked = document.querySelector('input[name="leadershipExp"]:checked');
    if (!leadershipChecked) {
      showError("Please indicate whether you have prior Leadership Experience (Yes / No).");
      return false;
    }

    if (leadershipChecked.value === "Yes") {
      const descVal = leadershipDesc ? leadershipDesc.value.trim() : "";
      if (!descVal || descVal.length < 15) {
        showError("Please describe your leadership experience (minimum 15 characters).");
        if (leadershipDesc) leadershipDesc.focus();
        return false;
      }
    }

    return true;
  }

  // -------------------------------------------------------------
  // STEP 4 VALIDATION (Motivation & Commitment)
  // -------------------------------------------------------------
  if (step === 4) {
    const track = form.track ? form.track.value : "";
    const fecsdcKnowledge = form.fecsdcKnowledge ? form.fecsdcKnowledge.value.trim() : "";
    const weeklyTime = form.weeklyTime ? form.weeklyTime.value : "";
    const whyJoin = form.whyJoin ? form.whyJoin.value.trim() : "";

    if (!track) {
      showError("Please select your primary division track of interest.");
      if (form.track) form.track.focus();
      return false;
    }

    if (!fecsdcKnowledge || fecsdcKnowledge.length < 30) {
      showError("Please share what you know about FECSDC & how you will contribute (minimum 30 characters).");
      if (form.fecsdcKnowledge) form.fecsdcKnowledge.focus();
      return false;
    }

    if (!weeklyTime) {
      showError("Please select your weekly time commitment.");
      if (form.weeklyTime) form.weeklyTime.focus();
      return false;
    }

    if (!whyJoin || whyJoin.length < 40) {
      showError("Please provide a more detailed motivation in 'Why do you want to join?' (minimum 40 characters).");
      if (form.whyJoin) form.whyJoin.focus();
      return false;
    }

    if (!selectedResumeFile || !resumeBase64String) {
      showError("Resume PDF file is mandatory. Please upload your resume in PDF format.");
      if (fileDropzone) fileDropzone.focus();
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------
  // STEP 5 VALIDATION (Declaration)
  // -------------------------------------------------------------
  if (step === 5) {
    if (declarationCheck && !declarationCheck.checked) {
      showError("Please confirm the authenticity declaration before submitting your application.");
      declarationCheck.focus();
      return false;
    }
    return true;
  }

  return true;
}


// =========================================================================
// 9. REVIEW SUMMARY GENERATOR (STEP 5)
// =========================================================================
function buildReviewSummary() {
  // Thumbnail
  if (reviewPhotoThumbnail) {
    if (selectedPhotoBase64) {
      reviewPhotoThumbnail.src = selectedPhotoBase64;
      reviewPhotoThumbnail.style.display = "block";
    } else {
      reviewPhotoThumbnail.style.display = "none";
    }
  }

  // Section 1: Personal Info
  if (reviewPersonalInfoGrid) {
    const fullName = form.fullName ? form.fullName.value.trim() : "--";
    const studentId = form.studentId ? form.studentId.value.trim() : "--";
    const batch = form.batch ? form.batch.value : "--";
    const gender = form.gender ? form.gender.value : "--";
    const department = form.department ? form.department.value : "--";
    const yearSemester = form.yearSemester ? form.yearSemester.value : "--";
    const phone = form.phone ? form.phone.value.trim() : "--";
    const email = form.email ? form.email.value.trim() : "--";

    reviewPersonalInfoGrid.innerHTML = `
      <div class="review-item"><span class="review-k">Full Name</span><span class="review-v">${escapeHtml(fullName)}</span></div>
      <div class="review-item"><span class="review-k">Student ID</span><span class="review-v font-mono">${escapeHtml(studentId)}</span></div>
      <div class="review-item"><span class="review-k">Academic Batch</span><span class="review-v">${escapeHtml(batch)}</span></div>
      <div class="review-item"><span class="review-k">Gender</span><span class="review-v">${escapeHtml(gender)}</span></div>
      <div class="review-item"><span class="review-k">Department</span><span class="review-v">${escapeHtml(department)}</span></div>
      <div class="review-item"><span class="review-k">Year / Semester</span><span class="review-v">${escapeHtml(yearSemester)}</span></div>
      <div class="review-item"><span class="review-k">Contact Phone</span><span class="review-v font-mono">${escapeHtml(phone)}</span></div>
      <div class="review-item"><span class="review-k">Email Address</span><span class="review-v">${escapeHtml(email)}</span></div>
    `;
  }

  // Section 2: Technical Background
  if (reviewTechInfoGrid) {
    const techSkills = getCheckedValuesWithOther("techSkills", chkOtherTechSkill, otherTechSkillInput);
    const progLanguages = getCheckedValuesWithOther("progLanguages", chkOtherProgLang, otherProgLangInput);
    const skillLevel = document.querySelector('input[name="skillLevel"]:checked')?.value || "Beginner";

    reviewTechInfoGrid.innerHTML = `
      <div class="review-item review-full-width"><span class="review-k">Technical Skills & Domains</span><span class="review-v">${techSkills.length > 0 ? techSkills.map(escapeHtml).join(", ") : "None selected"}</span></div>
      <div class="review-item review-full-width"><span class="review-k">Programming Languages</span><span class="review-v">${progLanguages.length > 0 ? progLanguages.map(escapeHtml).join(", ") : "None selected"}</span></div>
      <div class="review-item"><span class="review-k">Overall Skill Level</span><span class="review-v badge-highlight">${escapeHtml(skillLevel)}</span></div>
    `;
  }

  // Section 3: Soft Skills & Experience
  if (reviewExperienceInfoGrid) {
    const softSkills = getCheckedValuesWithOther("softSkills", chkOtherSoftSkill, otherSoftSkillInput);
    const leadershipExp = document.querySelector('input[name="leadershipExp"]:checked')?.value || "No";
    const lDesc = leadershipExp === "Yes" && leadershipDesc ? leadershipDesc.value.trim() : "";
    const clubExp = form.clubVolunteerExp ? form.clubVolunteerExp.value.trim() : "";

    reviewExperienceInfoGrid.innerHTML = `
      <div class="review-item review-full-width"><span class="review-k">Soft Skills & Strengths</span><span class="review-v">${softSkills.length > 0 ? softSkills.map(escapeHtml).join(", ") : "None selected"}</span></div>
      <div class="review-item review-full-width"><span class="review-k">Leadership Experience</span><span class="review-v">${escapeHtml(leadershipExp)}${lDesc ? ` &mdash; <em>${escapeHtml(lDesc)}</em>` : ""}</span></div>
      <div class="review-item review-full-width"><span class="review-k">Club / Volunteer Experience</span><span class="review-v">${clubExp ? escapeHtml(clubExp) : "None recorded"}</span></div>
    `;
  }

  // Section 4: Motivation & Documents
  if (reviewMotivationInfoGrid) {
    const track = form.track ? form.track.value : "--";
    const weeklyTime = form.weeklyTime ? form.weeklyTime.value : "--";
    const fecsdcKnowledge = form.fecsdcKnowledge ? form.fecsdcKnowledge.value.trim() : "";
    const whyJoin = form.whyJoin ? form.whyJoin.value.trim() : "";
    const resumeName = selectedResumeFile ? selectedResumeFile.name : "No PDF selected";
    const portfolioUrl = form.portfolioUrl ? form.portfolioUrl.value.trim() : "";

    reviewMotivationInfoGrid.innerHTML = `
      <div class="review-item"><span class="review-k">Primary Division Track</span><span class="review-v badge-highlight">${escapeHtml(track)}</span></div>
      <div class="review-item"><span class="review-k">Weekly Commitment</span><span class="review-v">${escapeHtml(weeklyTime)}</span></div>
      <div class="review-item review-full-width"><span class="review-k">FEC SDC Knowledge & Contribution</span><span class="review-v">${escapeHtml(fecsdcKnowledge)}</span></div>
      <div class="review-item review-full-width"><span class="review-k">Why Join Statement</span><span class="review-v">${escapeHtml(whyJoin)}</span></div>
      <div class="review-item"><span class="review-k">Resume File</span><span class="review-v font-mono">📄 ${escapeHtml(resumeName)}</span></div>
      <div class="review-item"><span class="review-k">Portfolio / GitHub</span><span class="review-v">${portfolioUrl ? `<a href="${escapeHtml(portfolioUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(portfolioUrl)}</a>` : "N/A"}</span></div>
    `;
  }
}


// =========================================================================
// 10. CLIENT SUBMISSION (SINGLE PAYLOAD AT STEP 5)
// =========================================================================
function initFormSubmission() {
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    // Prevent submission if not on Step 5
    if (currentStep !== 5) {
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
      return;
    }

    // Validate Step 5 declaration
    if (!validateStep(5)) {
      return;
    }

    // 1. Gather comprehensive wizard values
    const fullName = form.fullName.value.trim();
    const studentId = form.studentId.value.trim();
    const batch = form.batch.value;
    const gender = form.gender.value;
    const department = form.department.value;
    const yearSemester = form.yearSemester.value;
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();

    // Step 2 values
    const technicalSkills = getCheckedValuesWithOther("techSkills", chkOtherTechSkill, otherTechSkillInput);
    const programmingLanguages = getCheckedValuesWithOther("progLanguages", chkOtherProgLang, otherProgLangInput);
    const skillLevel = document.querySelector('input[name="skillLevel"]:checked')?.value || "Beginner";

    // Step 3 values
    const softSkills = getCheckedValuesWithOther("softSkills", chkOtherSoftSkill, otherSoftSkillInput);
    const leadershipExp = document.querySelector('input[name="leadershipExp"]:checked')?.value || "No";
    const leadershipDescVal = leadershipExp === "Yes" && leadershipDesc ? leadershipDesc.value.trim() : "N/A";
    const clubVolunteerExp = form.clubVolunteerExp ? (form.clubVolunteerExp.value.trim() || "N/A") : "N/A";

    // Step 4 values
    const track = form.track.value;
    const fecsdcKnowledge = form.fecsdcKnowledge.value.trim();
    const weeklyTime = form.weeklyTime.value;
    const whyJoin = form.whyJoin.value.trim();
    const portfolioUrl = form.portfolioUrl ? form.portfolioUrl.value.trim() : "";

    // 2. Assemble complete submission payload
    const payload = {
      fullName: fullName,
      studentId: studentId,
      batch: batch,
      gender: gender,
      department: department,
      yearSemester: yearSemester,
      phone: phone,
      email: email,
      photoFileName: selectedPhotoFileName || ("Photo_" + studentId + ".jpg"),
      photoBase64: selectedPhotoBase64,
      technicalSkills: technicalSkills,
      programmingLanguages: programmingLanguages,
      skillLevel: skillLevel,
      softSkills: softSkills,
      leadershipExp: leadershipExp,
      leadershipDesc: leadershipDescVal,
      clubVolunteerExp: clubVolunteerExp,
      track: track,
      fecsdcKnowledge: fecsdcKnowledge,
      weeklyTime: weeklyTime,
      whyJoin: whyJoin,
      resumeFileName: selectedResumeFile.name,
      resumeBase64: resumeBase64String,
      portfolioUrl: portfolioUrl || "N/A"
    };

    // 3. Send to Apps Script Web App or Run Demo Simulation
    setLoadingState(true);

      // Runtime check: if URL is undefined or empty, show console error and inline form error
      if (typeof APPS_SCRIPT_WEB_APP_URL === "undefined" || !APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL === "PASTE_URL_HERE" || APPS_SCRIPT_WEB_APP_URL.includes("PASTE_") || APPS_SCRIPT_WEB_APP_URL.includes("REPLACE_WITH_")) {
        console.error(
          "[Configuration Error] APPS_SCRIPT_WEB_APP_URL is undefined or empty. Please create/configure config.js."
        );
        showError("Configuration missing: Google Apps Script Web App URL is not configured. Please define APPS_SCRIPT_WEB_APP_URL in config.js.");
        setLoadingState(false);
        return;
      }

      try {
        /**
         * REAL GOOGLE APPS SCRIPT WEB APP INTEGRATION:
       * 
       * CRITICAL CORS NOTE:
       * Google Apps Script Web Apps do not handle preflight CORS OPTIONS requests.
       * If you send "application/json", the browser sends OPTIONS and fails with a CORS error.
       * 
       * By specifying "Content-Type": "text/plain;charset=utf-8", the request is classified as
       * a simple request (NO preflight OPTIONS required). Apps Script accesses the raw body
       * via `e.postData.contents`, which parses cleanly with `JSON.parse()`.
       */
      const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server responded with HTTP status ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        showSuccessReceipt({
          applicantRefId: result.applicantRefId || "FECSDC-2026-RECORDED",
          fullName: fullName,
          studentId: studentId,
          track: track,
          submittedAt: result.submittedAt || new Date().toLocaleString()
        });
      } else if (result.code === "DUPLICATE_ENTRY") {
        showError(`Duplicate Application: An application with Student ID "${studentId}" has already been submitted.`);
      } else {
        showError(result.message || "An error occurred while submitting your application. Please try again.");
      }

    } catch (networkErr) {
      console.error("[Submission Error]", networkErr);
      showError(
        "Network or submission error: Unable to connect to the recruitment server. Please check your internet connection or try again shortly."
      );
    } finally {
      setLoadingState(false);
    }
  });
}


// =========================================================================
// 11. UI STATES & HELPERS
// =========================================================================
function setLoadingState(isLoading) {
  if (!submitBtn) return;

  if (isLoading) {
    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector(".btn-text");
    if (btnText) btnText.textContent = "Archiving to Drive & Sheet...";
  } else {
    submitBtn.classList.remove("is-loading");
    submitBtn.disabled = false;
    const btnText = submitBtn.querySelector(".btn-text");
    if (btnText) btnText.textContent = "Submit Final Application";
  }
}

function showError(message) {
  if (!errorAlert || !errorMessageText) return;
  errorMessageText.textContent = message;
  errorAlert.classList.add("is-visible");
  errorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
  if (!errorAlert) return;
  errorAlert.classList.remove("is-visible");
}

function showSuccessReceipt(data) {
  // Clear localStorage on successful submit — prevent stale data for next applicant
  clearFormState();

  form.style.display = "none";
  if (receiptCard) receiptCard.classList.add("is-visible");

  if (receiptAvatarRow && receiptAvatarImg) {
    if (selectedPhotoBase64) {
      receiptAvatarImg.src = selectedPhotoBase64;
      receiptAvatarRow.style.display = "flex";
    } else {
      receiptAvatarRow.style.display = "none";
    }
  }

  if (receiptApplicantId) receiptApplicantId.textContent = data.applicantRefId;
  if (receiptName) receiptName.textContent = data.fullName;
  if (receiptStudentId) receiptStudentId.textContent = data.studentId;
  if (receiptTrack) receiptTrack.textContent = data.track;
  if (receiptTimestamp) receiptTimestamp.textContent = data.submittedAt;

  // Scroll to confirmation view
  if (formCard) formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initResetHandler() {
  if (!btnReceiptReset) return;

  btnReceiptReset.addEventListener("click", () => {
    // Clear localStorage before resetting
    clearFormState();

    form.reset();
    clearSelectedPhoto();
    clearSelectedFile();

    // Reset conditional boxes
    if (otherTechSkillContainer) otherTechSkillContainer.style.display = "none";
    if (otherProgLangContainer) otherProgLangContainer.style.display = "none";
    if (otherSoftSkillContainer) otherSoftSkillContainer.style.display = "none";
    if (leadershipDescBox) leadershipDescBox.style.display = "none";
    if (declarationCheck) declarationCheck.checked = false;

    if (charCountDisplay) charCountDisplay.textContent = "0";
    hideError();

    goToStep(1);

    if (receiptCard) receiptCard.classList.remove("is-visible");
    form.style.display = "flex";

    if (formCard) formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =========================================================================
// 12. LOCALSTORAGE PROGRESS PERSISTENCE
// =========================================================================

/**
 * Reads all current form field values + active step and saves to localStorage.
 * File inputs (photo/resume) are NOT stored (too large); only a boolean flag.
 */
function saveFormState() {
  if (!form) return;
  try {
    const data = {
      step: currentStep,
      // Step 1
      fullName:       (form.fullName       && form.fullName.value)       || '',
      studentId:      (form.studentId      && form.studentId.value)      || '',
      batch:          (form.batch          && form.batch.value)          || '',
      gender:         (form.gender         && form.gender.value)         || '',
      department:     (form.department     && form.department.value)     || '',
      yearSemester:   (form.yearSemester   && form.yearSemester.value)   || '',
      phone:          (form.phone          && form.phone.value)          || '',
      email:          (form.email          && form.email.value)          || '',
      // Step 2
      techSkills:           getCheckboxValues('techSkills'),
      otherTechSkillChecked: chkOtherTechSkill ? chkOtherTechSkill.checked : false,
      otherTechSkillText:    (otherTechSkillInput && otherTechSkillInput.value) || '',
      progLanguages:        getCheckboxValues('progLanguages'),
      otherProgLangChecked:  chkOtherProgLang ? chkOtherProgLang.checked : false,
      otherProgLangText:     (otherProgLangInput  && otherProgLangInput.value)  || '',
      skillLevel:           (document.querySelector('input[name="skillLevel"]:checked') || {}).value || '',
      // Step 3
      softSkills:           getCheckboxValues('softSkills'),
      otherSoftSkillChecked: chkOtherSoftSkill ? chkOtherSoftSkill.checked : false,
      otherSoftSkillText:    (otherSoftSkillInput && otherSoftSkillInput.value) || '',
      leadershipExp:        (document.querySelector('input[name="leadershipExp"]:checked') || {}).value || '',
      leadershipDescVal:    (leadershipDesc && leadershipDesc.value) || '',
      clubVolunteerExp:     (form.clubVolunteerExp && form.clubVolunteerExp.value) || '',
      // Step 4
      track:           (form.track          && form.track.value)          || '',
      fecsdcKnowledge: (form.fecsdcKnowledge && form.fecsdcKnowledge.value) || '',
      weeklyTime:      (form.weeklyTime      && form.weeklyTime.value)      || '',
      whyJoin:         (form.whyJoin         && form.whyJoin.value)         || '',
      portfolioUrl:    (form.portfolioUrl    && form.portfolioUrl.value)    || '',
      // File presence flags (base64 not stored)
      photoWasFilled:  !!selectedPhotoBase64,
      resumeWasFilled: !!selectedResumeFile,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    // Silently ignore storage quota errors
    console.warn('[FormState] Could not save to localStorage:', e);
  }
}

/** Helper: returns array of checked values for a named checkbox group. */
function getCheckboxValues(fieldName) {
  return Array.from(document.querySelectorAll(`input[name="${fieldName}"]:checked`)).map(cb => cb.value);
}

/** Helper: checks checkboxes in a named group whose values are in the given array. */
function restoreCheckboxGroup(fieldName, values) {
  if (!values || !values.length) return;
  document.querySelectorAll(`input[name="${fieldName}"]`).forEach(cb => {
    cb.checked = values.includes(cb.value);
  });
}

/**
 * Reads localStorage, restores all field values, conditional visibility,
 * and jumps to the last saved step.
 */
function restoreFormState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return;

    // --- Step 1 ---
    if (form.fullName     && data.fullName)     form.fullName.value     = data.fullName;
    if (form.studentId    && data.studentId)    form.studentId.value    = data.studentId;
    if (form.batch        && data.batch)        form.batch.value        = data.batch;
    if (form.gender       && data.gender)       form.gender.value       = data.gender;
    if (form.department   && data.department)   form.department.value   = data.department;
    if (form.yearSemester && data.yearSemester) form.yearSemester.value = data.yearSemester;
    if (form.phone        && data.phone)        form.phone.value        = data.phone;
    if (form.email        && data.email)        form.email.value        = data.email;

    // --- Step 2 ---
    restoreCheckboxGroup('techSkills', data.techSkills || []);
    if (chkOtherTechSkill && data.otherTechSkillChecked) {
      chkOtherTechSkill.checked = true;
      if (otherTechSkillContainer) otherTechSkillContainer.style.display = 'block';
      if (otherTechSkillInput && data.otherTechSkillText) otherTechSkillInput.value = data.otherTechSkillText;
    }
    restoreCheckboxGroup('progLanguages', data.progLanguages || []);
    if (chkOtherProgLang && data.otherProgLangChecked) {
      chkOtherProgLang.checked = true;
      if (otherProgLangContainer) otherProgLangContainer.style.display = 'block';
      if (otherProgLangInput && data.otherProgLangText) otherProgLangInput.value = data.otherProgLangText;
    }
    if (data.skillLevel) {
      const skillRadio = document.querySelector(`input[name="skillLevel"][value="${data.skillLevel}"]`);
      if (skillRadio) skillRadio.checked = true;
    }

    // --- Step 3 ---
    restoreCheckboxGroup('softSkills', data.softSkills || []);
    if (chkOtherSoftSkill && data.otherSoftSkillChecked) {
      chkOtherSoftSkill.checked = true;
      if (otherSoftSkillContainer) otherSoftSkillContainer.style.display = 'block';
      if (otherSoftSkillInput && data.otherSoftSkillText) otherSoftSkillInput.value = data.otherSoftSkillText;
    }
    if (data.leadershipExp) {
      const leadershipRadio = document.querySelector(`input[name="leadershipExp"][value="${data.leadershipExp}"]`);
      if (leadershipRadio) {
        leadershipRadio.checked = true;
        if (data.leadershipExp === 'Yes') {
          if (leadershipDescBox) leadershipDescBox.style.display = 'block';
          if (leadershipDesc && data.leadershipDescVal) leadershipDesc.value = data.leadershipDescVal;
        }
      }
    }
    if (form.clubVolunteerExp && data.clubVolunteerExp) form.clubVolunteerExp.value = data.clubVolunteerExp;

    // --- Step 4 ---
    if (form.track          && data.track)          form.track.value          = data.track;
    if (form.fecsdcKnowledge && data.fecsdcKnowledge) form.fecsdcKnowledge.value = data.fecsdcKnowledge;
    if (form.weeklyTime     && data.weeklyTime)     form.weeklyTime.value     = data.weeklyTime;
    if (form.whyJoin        && data.whyJoin) {
      form.whyJoin.value = data.whyJoin;
      // Sync character counter display
      if (charCountDisplay) charCountDisplay.textContent = String(data.whyJoin.length);
    }
    if (form.portfolioUrl   && data.portfolioUrl)   form.portfolioUrl.value   = data.portfolioUrl;

    // --- File restore notices ---
    const photoNote  = document.getElementById('photoRestoreNote');
    const resumeNote = document.getElementById('resumeRestoreNote');
    if (photoNote)  photoNote.style.display  = data.photoWasFilled  ? 'flex' : 'none';
    if (resumeNote) resumeNote.style.display = data.resumeWasFilled ? 'flex' : 'none';

    // --- Jump to saved step (skip saveFormState during restore) ---
    const savedStep = parseInt(data.step, 10) || 1;
    if (savedStep > 1 && savedStep <= TOTAL_STEPS) {
      goToStep(savedStep);
    }

  } catch (e) {
    console.warn('[FormState] Could not restore from localStorage:', e);
  }
}

/** Removes the saved form state from localStorage. */
function clearFormState() {
  try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
}

/**
 * Attaches a single delegated event listener to the form element to
 * auto-save on every input/change across all fields.
 */
function initFormAutoSave() {
  if (!form) return;
  form.addEventListener('input',  saveFormState);
  form.addEventListener('change', saveFormState);
}
