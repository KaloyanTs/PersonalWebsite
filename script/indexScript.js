// Legacy helpers used by `index_old.html`. Keep safe guards so this file
// can be loaded on pages that don't include the old form elements.
const submitForm = document.getElementById("submitForm");
const submitButton = document.getElementById("submitButton");
const textArea = document.getElementById("textArea");

if (submitButton) {
    submitButton.disabled = true;
}

const buttons = document.querySelectorAll('.resourceBtn');
if (buttons && buttons.length) {
    let maxWidth = 0;
    buttons.forEach(function (button) {
        const buttonWidth = button.offsetWidth || 0;
        if (buttonWidth > maxWidth) maxWidth = buttonWidth;
    });

    buttons.forEach(function (button) {
        button.style.width = maxWidth + 'px';
        button.style.visibility = 'visible';
    });
}

if (textArea && submitButton) {
    textArea.oninput = () => {
        submitButton.disabled = textArea.value.length < 11;
    };
}
