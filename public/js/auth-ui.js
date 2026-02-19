// Auth UI transitions
document.addEventListener('DOMContentLoaded', () => {
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const forgotForm = document.getElementById('forgotForm');

    const toSignup = document.getElementById('toSignup');
    const toSignin = document.getElementById('toSignin');
    const toForgot = document.getElementById('toForgot');
    const forgotToSignin = document.getElementById('forgotToSignin');

    toSignup.addEventListener('click', (e) => {
        e.preventDefault();
        signinForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    toSignin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
    });

    toForgot.addEventListener('click', (e) => {
        e.preventDefault();
        signinForm.classList.add('hidden');
        forgotForm.classList.remove('hidden');
    });

    forgotToSignin.addEventListener('click', (e) => {
        e.preventDefault();
        forgotForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
    });
});
