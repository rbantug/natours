/* eslint-disable */

// to remove the alert
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// type is either 'success' or 'error'. This is for CSS
export const showAlert = (type, msg, seconds = 5) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, seconds * 1000);
};