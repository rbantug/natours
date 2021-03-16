/* eslint-disable */

import axios from 'axios';
import { hideAlert, showAlert } from './alert';

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup1',
      data: {
        name, 
        email, 
        password, 
        passwordConfirm
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Sign up successfull!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}