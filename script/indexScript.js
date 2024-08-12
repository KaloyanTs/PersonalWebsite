const submitForm = document.getElementById("submitForm");
const submitButton = document.getElementById("submitButton");
const textArea = document.getElementById("textArea");

submitForm.disabled = submitButton.disabled = true;

var buttons = document.querySelectorAll('.resourceBtn');

var maxWidth = 0;

buttons.forEach(function (button) {
    var buttonWidth = button.offsetWidth;
    if (buttonWidth > maxWidth) {
        maxWidth = buttonWidth;
    }
});

buttons.forEach(function (button) {
    button.style.width = maxWidth + 'px';
    button.style.visibility = 'visible';
});


textArea.oninput = () => {
    submitForm.disabled = submitButton.disabled = textArea.value.length < 11;
};