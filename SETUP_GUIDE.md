# Google Apps Script & Drive Integration Setup Guide
**Faridpur Engineering College Software Development Club (FEC SDC)**  
*Junior Executive Recruitment Portal*

This guide walks you through setting up the serverless backend using **Google Sheets**, **Google Drive**, and **Google Apps Script** in under 5 minutes.

---

## Step 1: Create the Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a **New Blank Spreadsheet**.
2. Rename the spreadsheet to:  
   `FEC SDC - Junior Executive Recruitment 2026`
3. Rename the active sheet/tab at the bottom left from `Sheet1` to `Applications`.

---

## Step 2: Create the Google Drive Folder for Resumes
1. Open [Google Drive](https://drive.google.com).
2. Create a new folder named:  
   `FEC_SDC_Candidate_Resumes_2026`
3. Double-click to open this folder.
4. Look at the browser's address bar. The URL will look like:  
   `https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345`  
5. **Copy the string of characters after `/folders/`**.  
   This is your **Drive Folder ID** (e.g. `1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345`).

---

## Step 3: Open Apps Script & Paste `Code.gs`
1. Back in your Google Sheet, click on the top menu:  
   `Extensions` -> `Apps Script`
2. An Apps Script code editor window will open.
3. Delete any default code (`function myFunction() { ... }`).
4. Copy the entire contents of [`Code.gs`](./Code.gs) and paste it into the editor.
5. In line 30 of `Code.gs`, find:
   ```javascript
   var DRIVE_FOLDER_ID = "REPLACE_WITH_YOUR_DRIVE_FOLDER_ID";
   ```
   Replace `"REPLACE_WITH_YOUR_DRIVE_FOLDER_ID"` with your copied Folder ID from Step 2:
   ```javascript
   var DRIVE_FOLDER_ID = "1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345";
   ```
6. Click the **Save** icon (diskette icon) or press `Ctrl + S`.

---

## Step 4: Initialize Column Headers (Optional but Recommended)
1. In the Apps Script toolbar, locate the function dropdown menu (defaults to `doPost` or `myFunction`).
2. Select `setupSheetHeaders`.
3. Click the **Run** button.
4. Google will ask for permission on your first run:
   - Click **Review permissions**.
   - Choose your Google account.
   - Click **Advanced** (bottom left), then click **Go to Untitled project (unsafe)**.
   - Click **Allow**.
5. Go back to your Google Sheet — you will see a stylized Navy & White header row with all 25 columns configured (including Candidate Photo, Technical & Soft Skills, Motivation, and Drive links) and frozen!

---

## Step 5: Deploy as a Web App
1. In the top-right corner of the Apps Script window, click the blue **Deploy** button -> **New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `FEC SDC Recruitment v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: **`Anyone`**  
     *(⚠️ IMPORTANT: This must be set to "Anyone" so students can submit without requiring Google authentication)*
4. Click **Deploy**.
5. Once deployment finishes, copy the **Web app URL** that looks like:  
   `https://script.google.com/macros/s/AKfycbx.../exec`

---

## Step 6: Connect to Frontend (`script.js`)
1. Open `script.js` in your project folder.
2. At the top of `script.js`, locate:
   ```javascript
   const APPS_SCRIPT_WEB_APP_URL = "";
   ```
3. Paste your Web App URL between the quotes:
   ```javascript
   const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
   ```
4. Save `script.js`.

---

## Testing & Verification
1. Open `index.html` in your browser.
2. Fill out all required fields with sample data.
3. Choose your photo: upload a file (< 2MB) or click **Take Photo** to capture live via webcam.
4. Attach a test PDF file (< 5MB).
5. Click **Submit Application**.
6. You should see the button transition to a loading spinner, followed by a green success confirmation displaying the candidate photo thumbnail and the unique **Application Reference ID** (e.g. `FECSDC-2026-0001`).
7. Check your Google Sheet: a new row with timestamp, student details, clickable Photo Drive link, and clickable Resume Drive link will appear immediately!
8. Check your Google Drive folder: both the uploaded/captured photo (`StudentId_FullName_Photo.jpg`) and resume PDF (`StudentId_FullName_Resume.pdf`) will be stored safely!
