/**
 * =========================================================================
 * FARIDPUR ENGINEERING COLLEGE SOFTWARE DEVELOPMENT CLUB (FEC SDC)
 * Junior Executive Recruitment Portal - Backend Script (Google Apps Script)
 * =========================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Open Google Sheets (https://sheets.google.com) and create a new spreadsheet.
 * 2. Name your spreadsheet: "FEC SDC - Junior Executive Recruitment 2026"
 * 3. In Google Drive, create a folder to store candidate resumes (e.g. "FEC_SDC_Resumes_2026").
 * 4. Open the folder, and copy the Folder ID from the URL:
 *    https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE
 * 5. In your Google Sheet, go to: Extensions -> Apps Script
 * 6. Replace all existing code in Apps Script with this file (Code.gs).
 * 7. Paste your Folder ID into the DRIVE_FOLDER_ID constant below.
 * 8. (Optional) Run the function `setupSheetHeaders()` once to create the formatted header row.
 * 9. Click "Deploy" -> "New deployment":
 *    - Select type: "Web app"
 *    - Description: "FEC SDC Recruitment Webhook v1.0"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone"  <-- CRITICAL for public form submission!
 * 10. Click "Deploy", authorize access when prompted, and copy the "Web app URL".
 * 11. Paste that Web app URL into `script.js` in your frontend project.
 * =========================================================================
 */

// =========================================================================
// CONFIGURATION CONSTANTS
// =========================================================================
// [REQUIRED] Replace with your actual Google Drive Folder ID:
var DRIVE_FOLDER_ID = "REPLACE_WITH_YOUR_DRIVE_FOLDER_ID";

// Name of the sheet/tab where applicant rows will be appended:
var SHEET_NAME = "Applications";

// Set to true to reject duplicate applications with the same Student ID:
var PREVENT_DUPLICATES = true;

// Column Index for Student ID (1-based: Column C is 3):
var STUDENT_ID_COL_INDEX = 3;


/**
 * Handles incoming HTTP POST requests from the recruitment web form.
 * Receives JSON payload with applicant details and base64-encoded PDF resume.
 * 
 * @param {Object} e Event parameter containing postData
 * @return {TextOutput} JSON response with success or error status
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds to acquire lock, ensuring safe concurrent sheet appends
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    return createJsonResponse({
      status: "error",
      message: "Server is currently busy processing other submissions. Please retry in a few seconds."
    });
  }

  try {
    // 1. Verify that postData exists
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "No payload received. Request body was empty."
      });
    }

    // 2. Parse JSON payload
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({
        status: "error",
        message: "Invalid JSON format: " + parseErr.message
      });
    }

    // 3. Extract and sanitize fields
    var fullName = (data.fullName || "").trim();
    var studentId = (data.studentId || "").trim();
    var batch = (data.batch || "").trim();
    var gender = (data.gender || "").trim();
    var department = (data.department || "").trim();
    var yearSemester = (data.yearSemester || "").trim();
    var phone = (data.phone || "").trim();
    var email = (data.email || "").trim();

    // Step 2 Fields
    var technicalSkills = Array.isArray(data.technicalSkills) ? data.technicalSkills.join(", ") : (data.technicalSkills || "").trim();
    var programmingLanguages = Array.isArray(data.programmingLanguages) ? data.programmingLanguages.join(", ") : (data.programmingLanguages || "").trim();
    var skillLevel = (data.skillLevel || "").trim();

    // Step 3 Fields
    var softSkills = Array.isArray(data.softSkills) ? data.softSkills.join(", ") : (data.softSkills || "").trim();
    var leadershipExp = (data.leadershipExp || "No").trim();
    var leadershipDesc = (data.leadershipDesc || "N/A").trim();
    var clubVolunteerExp = (data.clubVolunteerExp || "N/A").trim();

    // Step 4 Fields
    var primaryTrack = (data.track || "General").trim();
    var fecsdcKnowledge = (data.fecsdcKnowledge || "").trim();
    var weeklyTime = (data.weeklyTime || "").trim();
    var whyJoin = (data.whyJoin || "").trim();
    var portfolioUrl = (data.portfolioUrl || "N/A").trim();

    // Uploaded Media (Base64)
    var photoBase64 = data.photoBase64;
    var photoFileName = (data.photoFileName || "Photo_" + studentId + ".jpg").trim();
    var resumeBase64 = data.resumeBase64;
    var resumeFileName = (data.resumeFileName || "Resume_" + studentId + ".pdf").trim();

    // 4. Validate mandatory fields
    if (!fullName || !studentId || !batch || !gender || !department || !yearSemester || !phone || !email || !photoBase64 || !technicalSkills || !programmingLanguages || !skillLevel || !softSkills || !primaryTrack || !fecsdcKnowledge || !weeklyTime || !whyJoin || !resumeBase64) {
      return createJsonResponse({
        status: "error",
        message: "Missing mandatory fields. Please ensure all required fields across Steps 1 to 4 are completed."
      });
    }

    // 5. Open Active Spreadsheet & Sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      setupHeaders(sheet);
    } else if (sheet.getLastRow() === 0) {
      setupHeaders(sheet);
    }

    // 6. Duplicate prevention check based on Student ID
    if (PREVENT_DUPLICATES && sheet.getLastRow() > 1) {
      var studentIds = sheet.getRange(2, STUDENT_ID_COL_INDEX, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < studentIds.length; i++) {
        if (String(studentIds[i][0]).trim().toUpperCase() === studentId.toUpperCase()) {
          return createJsonResponse({
            status: "error",
            code: "DUPLICATE_ENTRY",
            message: "An application with Student ID '" + studentId + "' has already been recorded."
          });
        }
      }
    }

    // 7. Save Candidate Photo to Google Drive
    var photoViewUrl = "No Photo Uploaded";
    if (photoBase64) {
      try {
        if (DRIVE_FOLDER_ID === "REPLACE_WITH_YOUR_DRIVE_FOLDER_ID" || !DRIVE_FOLDER_ID) {
          throw new Error("DRIVE_FOLDER_ID has not been configured in Apps Script (Code.gs).");
        }

        var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        
        // Strip any potential Data-URI prefix
        var cleanPhotoBase64 = photoBase64;
        var photoMimeType = "image/jpeg";
        if (cleanPhotoBase64.indexOf("data:") === 0 && cleanPhotoBase64.indexOf(";base64,") !== -1) {
          var mimeMatch = cleanPhotoBase64.match(/data:([^;]+);base64,/);
          if (mimeMatch && mimeMatch[1]) {
            photoMimeType = mimeMatch[1];
          }
          cleanPhotoBase64 = cleanPhotoBase64.split(";base64,")[1];
        } else if (cleanPhotoBase64.indexOf("base64,") !== -1) {
          cleanPhotoBase64 = cleanPhotoBase64.split("base64,")[1];
        }

        var photoExt = photoMimeType === "image/png" ? ".png" : ".jpg";
        var safePhotoFileName = studentId.replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + fullName.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Photo" + photoExt;
        var photoBytes = Utilities.base64Decode(cleanPhotoBase64);
        var photoBlob = Utilities.newBlob(photoBytes, photoMimeType, safePhotoFileName);

        var uploadedPhoto = folder.createFile(photoBlob);
        try {
          uploadedPhoto.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {
          Logger.log("Photo sharing permission warning: " + shareErr.message);
        }

        photoViewUrl = uploadedPhoto.getUrl();
      } catch (photoErr) {
        Logger.log("Photo Upload Error: " + photoErr.message);
        return createJsonResponse({
          status: "error",
          message: "Failed to upload candidate photo to Drive: " + photoErr.message
        });
      }
    } else {
      return createJsonResponse({
        status: "error",
        message: "Candidate photo is required."
      });
    }

    // 8. Save Resume to Google Drive (if base64 data provided)
    var fileViewUrl = "No File Uploaded";
    var fileId = "";

    if (resumeBase64) {
      try {
        if (DRIVE_FOLDER_ID === "REPLACE_WITH_YOUR_DRIVE_FOLDER_ID" || !DRIVE_FOLDER_ID) {
          throw new Error("DRIVE_FOLDER_ID has not been configured in Apps Script (Code.gs).");
        }

        var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        
        // Strip any potential Data-URI prefix (e.g. data:application/pdf;base64,)
        var cleanBase64 = resumeBase64;
        if (cleanBase64.indexOf("base64,") !== -1) {
          cleanBase64 = cleanBase64.split("base64,")[1];
        }

        var decodedBytes = Utilities.base64Decode(cleanBase64);
        var safeFileName = studentId.replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + fullName.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Resume.pdf";
        var blob = Utilities.newBlob(decodedBytes, "application/pdf", safeFileName);

        var uploadedFile = folder.createFile(blob);
        // Set anyone with link can view (optional, useful for review panel)
        try {
          uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {
          // If restricted by workspace domain, ignore sharing error
          Logger.log("Sharing permission warning: " + shareErr.message);
        }

        fileViewUrl = uploadedFile.getUrl();
        fileId = uploadedFile.getId();
      } catch (fileErr) {
        Logger.log("File Upload Error: " + fileErr.message);
        return createJsonResponse({
          status: "error",
          message: "Failed to upload resume to Drive: " + fileErr.message
        });
      }
    } else {
      return createJsonResponse({
        status: "error",
        message: "Resume PDF file is required."
      });
    }

    // 9. Generate Application Reference ID
    var timestamp = new Date();
    var formattedDate = Utilities.formatDate(timestamp, "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss");
    var applicantRefId = "FECSDC-2026-" + ("0000" + (sheet.getLastRow())).slice(-4);

    // 10. Append candidate row to Sheet
    // Columns (25 total):
    // 1. Application ID
    // 2. Submission Time
    // 3. Student ID (Column C - STUDENT_ID_COL_INDEX = 3)
    // 4. Full Name
    // 5. Academic Batch
    // 6. Gender
    // 7. Department
    // 8. Year / Semester
    // 9. Phone Number
    // 10. Email Address
    // 11. Candidate Photo (Drive URL)
    // 12. Technical Skills
    // 13. Programming Languages
    // 14. Overall Skill Level
    // 15. Soft Skills
    // 16. Leadership Experience (Yes/No)
    // 17. Leadership Description
    // 18. Club / Volunteer Experience
    // 19. Preferred Track
    // 20. FEC SDC Knowledge & Contribution
    // 21. Weekly Time Commitment
    // 22. Why Join Statement
    // 23. Resume Drive Link
    // 24. Portfolio / GitHub
    // 25. Review Status (Default: Pending Review)
    sheet.appendRow([
      applicantRefId,
      formattedDate,
      studentId,
      fullName,
      batch,
      gender,
      department,
      yearSemester,
      phone,
      email,
      photoViewUrl,
      technicalSkills,
      programmingLanguages,
      skillLevel,
      softSkills,
      leadershipExp,
      leadershipDesc,
      clubVolunteerExp,
      primaryTrack,
      fecsdcKnowledge,
      weeklyTime,
      whyJoin,
      fileViewUrl,
      portfolioUrl,
      "Pending Review"
    ]);

    // Format the newly appended row
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 25).setVerticalAlignment("middle");
    
    // 11. Return success response
    return createJsonResponse({
      status: "success",
      message: "Application submitted successfully! Welcome to the FEC SDC recruitment pipeline.",
      applicantRefId: applicantRefId,
      submittedAt: formattedDate,
      fileUrl: fileViewUrl,
      photoUrl: photoViewUrl
    });

  } catch (err) {
    Logger.log("Unexpected Error: " + err.toString());
    return createJsonResponse({
      status: "error",
      message: "Server exception occurred: " + err.message
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles HTTP GET requests - useful as a health check or deployment test
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "FEC SDC Junior Executive Recruitment API",
    version: "2.0.0",
    club: "Faridpur Engineering College Software Development Club",
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper to generate properly formatted JSON text output with CORS headers
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup / Initialize standard column headers and styling
 * Can be run manually from the Apps Script IDE editor by selecting `setupSheetHeaders` and clicking Run.
 */
function setupSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  setupHeaders(sheet);
  SpreadsheetApp.getUi().alert("FEC SDC Sheet headers have been initialized successfully!");
}

function setupHeaders(sheet) {
  var headers = [
    "Application ID",
    "Submission Time",
    "Student ID",
    "Full Name",
    "Academic Batch",
    "Gender",
    "Department",
    "Year / Semester",
    "Phone Number",
    "Email Address",
    "Photo",
    "Technical Skills",
    "Programming Languages",
    "Overall Skill Level",
    "Soft Skills",
    "Leadership Experience",
    "Leadership Description",
    "Club / Volunteer Experience",
    "Preferred Track",
    "FEC SDC Knowledge & Contribution",
    "Weekly Time Commitment",
    "Why Join Statement",
    "Resume Drive Link",
    "Portfolio / GitHub",
    "Review Status"
  ];

  sheet.clear();
  sheet.appendRow(headers);

  // Style Header Row: Navy background (#1A1D2E), White Bold Text
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1A1D2E");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Consolas");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);

  // Freeze top row
  sheet.setFrozenRows(1);

  // Set initial column widths
  sheet.setColumnWidth(1, 150); // App ID
  sheet.setColumnWidth(2, 160); // Timestamp
  sheet.setColumnWidth(3, 120); // Student ID
  sheet.setColumnWidth(4, 180); // Full Name
  sheet.setColumnWidth(5, 140); // Batch
  sheet.setColumnWidth(6, 110); // Gender
  sheet.setColumnWidth(7, 160); // Department
  sheet.setColumnWidth(8, 140); // Year/Sem
  sheet.setColumnWidth(9, 140); // Phone
  sheet.setColumnWidth(10, 200); // Email
  sheet.setColumnWidth(11, 220); // Photo (Drive URL)
  sheet.setColumnWidth(12, 220); // Technical Skills
  sheet.setColumnWidth(13, 200); // Programming Languages
  sheet.setColumnWidth(14, 130); // Skill Level
  sheet.setColumnWidth(15, 200); // Soft Skills
  sheet.setColumnWidth(16, 140); // Leadership Exp
  sheet.setColumnWidth(17, 240); // Leadership Desc
  sheet.setColumnWidth(18, 240); // Club / Volunteer
  sheet.setColumnWidth(19, 170); // Preferred Track
  sheet.setColumnWidth(20, 260); // FECSDC Knowledge & Contribution
  sheet.setColumnWidth(21, 170); // Weekly Time Commitment
  sheet.setColumnWidth(22, 260); // Why Join
  sheet.setColumnWidth(23, 240); // Resume Link
  sheet.setColumnWidth(24, 200); // Portfolio
  sheet.setColumnWidth(25, 130); // Status
}
