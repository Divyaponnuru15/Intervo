async function login() {


    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;


    const response = await fetch(
        "http://127.0.0.1:5000/login",
        {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                email: email,

                password: password

            })

        }
    );


    const data = await response.json();


    if(response.ok){

        localStorage.setItem(
            "token",
            data.access_token
        );


        document.getElementById("message").innerHTML =
        "Login Successful";


        window.location.href =
        "dashboard.html";

    }

    else{

        document.getElementById("message").innerHTML =
        data.message;

    }
}

async function registerUser() {


    const name = document.getElementById("name").value;

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;



    const response = await fetch(
        "http://127.0.0.1:5000/register",
        {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                name: name,

                email: email,

                password: password

            })

        }
    );



    const data = await response.json();



    if(response.ok){

        document.getElementById("message").innerHTML =
        "Registration successful. Please login.";


        setTimeout(() => {

            window.location.href = "index.html";

        }, 1500);


    }

    else{

        document.getElementById("message").innerHTML =
        data.message;

    }
}