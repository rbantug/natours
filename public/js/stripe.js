/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe('pk_test_51IU6tBBuJmqItreCt9sIGmUb7vJPSWVb1NkmWNHHWjpQwNAeXIHxCJCGJpTddBrQ3gLdf3S0H7yU7Q0MXEDcCVqm00Z8PamZYl')
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    console.log(err);
    showAlert('error', err);

  }
}
