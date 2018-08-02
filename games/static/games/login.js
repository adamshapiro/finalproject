document.addEventListener('DOMContentLoaded', () => {
    // add an is-invalid class to any input field with validation errors
    $('div.invalid-feedback:first-of-type').prev().addClass('is-invalid');
});
