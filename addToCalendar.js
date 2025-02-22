document.getElementById('search-button').addEventListener('click', function () {
    const test = document.getElementById('coordinates').value;
    console.log(test);
    document.getElementById('current-location').innerHTML = test;
});