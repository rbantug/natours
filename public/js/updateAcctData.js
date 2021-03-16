/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

// 'type' is either 'data' (name & email) or 'password'. 'data' is an object.
export const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'patch',
      url: type === 'Data' ? '/api/v1/users/updateMe' : '/api/v1/users/updateMyPassword',
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type} updated successfully!`)
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (err) {
      showAlert('error', err.response.data.message);
  }
};