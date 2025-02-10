document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("changeButton");
    let toggled = false;

    button.addEventListener("click", function () {
        console.log("Button was clicked");
        toggled = !toggled;
        //change document title
        document.title = toggled ? "Sunrise2Calendar" : "Sunset2Calendar";

        //change text content
        document.getElementById("toggleTitle").textContent = toggled ? "Sunrise2Calendar" : "Sunset2Calendar";

        //change image source
        document.getElementById("toggleImg").src = toggled ? "imgs/sunrise.png" : "imgs/sunset.png";

        //toggle button
        button.classList.toggle("toggled");
        
        //change border color
        document.body.style.borderColor = toggled ? "#E0A355" : "#033655";
    });
});
