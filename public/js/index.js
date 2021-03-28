/* eslint-disable */
import '@babel/polyfill'; // No variable. We need this to polyfill the Js code in the bundle file
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateAcctData';
import { signup } from './signup';
import { forgotPassword, resetPassword } from './forgotResetPassword'; 
import { bookTour } from './stripe'; 
import { showAlert, hideAlert } from './alert';

const mapBox = document.getElementById('map'); 
const loginForm = document.getElementById('form-login');
const logoutButton = document.querySelector('a.nav__el--logout');
const updateNameEmailBtn = document.getElementById('updateNameEmailBtn');
const updatePassBtn = document.getElementById('updatePassBtn');
const signupForm = document.getElementById('formSignup');
const forgotPasswordForm = document.getElementById('form-forgotPassword');
const resetPasswordForm = document.getElementById('formResetPassword');
const bookTourBtn = document.getElementById('book-tour');
const bookingAlert = document.querySelector('body').dataset.alert;

if (mapBox){
  const location1 = JSON.parse(mapBox.dataset.locations);
  displayMap(location1);
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loginBtn').textContent = 'Processing...';
    const email = document.getElementById('email-login').value;
    const password = document.getElementById('password-login').value;
    await login(email, password);
    document.getElementById('loginBtn').textContent = 'login';
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

if (updateNameEmailBtn) {
  updateNameEmailBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    document.getElementById('updateNameEmailBtn').textContent = 'Updating...';
    const form = new FormData();
    form.append('name', document.getElementById('name-myAccount').value);
    form.append('email', document.getElementById('email-myAccount').value);
    form.append('photo', document.getElementById('photo').files[0]);
    /* const name = document.getElementById('name-myAccount').value;
    const email = document.getElementById('email-myAccount').value; */
    await updateSettings(form, 'Data');
    document.getElementById('updateNameEmailBtn').textContent = 'Save settings';
  })
}

// We need to create something similar to a multipart/form-data. We'll create a 'new FormData()' and include the name, email and photo file into it. A form data is an object --> https://javascript.info/formdata  

if (updatePassBtn) {
  updatePassBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    document.getElementById('updatePassBtn').textContent = 'Updating...';
    const oldPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({oldPassword, newPassword, newPasswordConfirm}, 'Password');

    document.getElementById('updatePassBtn').textContent = 'Save Password'; 
    document.getElementById('password-current').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const passwordConfirm = document.getElementById('signup-confirmPassword').value;
      signup(name, email, password, passwordConfirm);
    });
}

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-forgotPassword').value;
    forgotPassword(email);
  })
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('reset-new-password').value;
    const passwordConfirm = document.getElementById('reset-new-confirmPassword').value; 
    resetPassword(password, passwordConfirm);
  })
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tour } = e.target.dataset;
    bookTour(tour);
  })
}

if (bookingAlert) {
  showAlert('success', bookingAlert, 20);
}
