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