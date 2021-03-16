/* eslint-disable */

import axios from 'axios';
import { hideAlert, showAlert } from './alert';

export const login = async (email, password) => {
  try{
    const res = await axios({
      method: 'post',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500); 
    }
  } catch (err){
    showAlert('error', err.response.data.message);
  }
};

// 'res.data' & 'err.response.data' are the JSON responses from our API.

export const logout = async () => {
  try {
    const res = await axios({
      method: 'get',
      url: '/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      location.reload(true);  // adding 'true' will reload the webpage from the server and not the same webpage from the cache.
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'There is an error while logging out. Please try again.');
  }
}
