/* eslint-disable */

import axios from 'axios';
import { hideAlert, showAlert } from './alert';

export const forgotPassword = async (email) => {
  try {

    const res = await axios({
      method: 'post',
      url: '/api/v1/users/forgotPassword',
      data: {
        email
      }
    })

    if (res.data.status === 'success') {
      window.location.assign('/emailSent');
  } 
} catch (err) {
  showAlert('error', err.response.data.message);
  }
}

export const resetPassword = async (password, passwordConfirm) => {
  try {

    const params = new URL(window.location.href).pathname;
    const token = params.split('/')[2];

    const res = await axios({
      method: 'patch',
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm
      }
    })

    if (res.data.status === 'success') {
      showAlert('success', 'Password Updated!')
      window.setTimeout(() => {
        location.assign('/');
      }, 2000);
  } 
} catch (err) {
  showAlert('error', err.response.data.message);
  }
}
