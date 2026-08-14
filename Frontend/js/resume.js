// =========================================================
// RESUME FILE SELECTION
// =========================================================

const resumeFile =
    document.getElementById("resumeFile");

const selectedFileName =
    document.getElementById("selectedFileName");


if (resumeFile) {

    resumeFile.addEventListener(
        "change",
        function () {

            if (this.files.length > 0) {

                selectedFileName.textContent =
                    this.files[0].name;

            } else {

                selectedFileName.textContent = "";

            }

        }
    );

}



// =========================================================
// UPLOAD RESUME
// =========================================================

async function uploadResume() {

    const fileInput =
        document.getElementById("resumeFile");

    const uploadMessage =
        document.getElementById("uploadMessage");

    const file =
        fileInput.files[0];


    // =====================================================
    // CHECK FILE
    // =====================================================

    if (!file) {

        uploadMessage.textContent =
            "Please select a resume.";

        return;
    }


    // =====================================================
    // CHECK FILE SIZE
    // =====================================================

    const maxSize =
        10 * 1024 * 1024;

    if (file.size > maxSize) {

        uploadMessage.textContent =
            "File size must be 10MB or less.";

        return;
    }


    // =====================================================
    // GET TOKEN
    // =====================================================

    const token =
        localStorage.getItem("token");


    if (!token) {

        window.location.href =
            "index.html";

        return;
    }


    // =====================================================
    // PREPARE FILE
    // =====================================================

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );


    try {

        // =================================================
        // UPLOADING
        // =================================================

        uploadMessage.textContent =
            "Uploading resume...";


        const uploadResponse =
            await fetch(
                "http://127.0.0.1:5000/upload-resume",
                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            "Bearer " + token

                    },

                    body: formData

                }
            );


        const uploadData =
            await uploadResponse.json();


        console.log(
            "Resume Upload Response:",
            uploadData
        );


        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (!uploadResponse.ok) {

            uploadMessage.textContent =
                uploadData.message ||
                "Resume upload failed.";

            return;
        }


        // =================================================
        // SAVE RESUME ID
        // =================================================

        const resumeId =
            uploadData.resume_id;


        localStorage.setItem(
            "resume_id",
            resumeId
        );


        // Remove previous session

        localStorage.removeItem(
            "session_id"
        );


        // =================================================
        // SUCCESS
        // =================================================

        uploadMessage.textContent =
            "Resume uploaded successfully.";


        // =================================================
        // UPDATE PROGRESS
        // =================================================

        const progressBar =
            document.getElementById("progressBar");

        const progressStatus =
            document.getElementById("progressStatus");

        const progressInterview =
            document.getElementById("progressInterview");


        if (progressBar) {

            progressBar.style.width =
                "100%";

        }


        if (progressStatus) {

            progressStatus.textContent =
                "Ready to start your interview";

        }


        if (progressInterview) {

            progressInterview.classList.add(
                "active"
            );

        }


        // =================================================
        // SHOW INTERVIEW SECTION
        // =================================================

        const categorySection =
            document.getElementById(
                "categorySection"
            );


        if (categorySection) {

            categorySection.style.display =
                "block";

        }

    }


    catch (error) {

        console.error(
            "Resume Upload Error:",
            error
        );


        uploadMessage.textContent =
            "Server connection failed.";

    }

}