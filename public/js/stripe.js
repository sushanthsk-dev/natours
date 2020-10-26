/* eslint-disable */

import axios from "axios";
import { showAlert } from './alert';
const stripe =Stripe('pk_test_51Ha5HJFVRoSwUU9lWrZDqO2V0alSnJxzCnFn6On3gMjKfM2gvKeTVAdSQ7HWNAF1TAPMm5oXU6DU8kRLB6nTaH9400JSlS8eBn');
export  const bookTour =(async tourId =>{
    try{
    // 1) Get the checkout session from the API
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);
    // 2) Create checkout form + charge credit card

    await stripe.redirectToCheckout({
        sessionId:session.data.session.id
    });
    }catch(err){
        console.log(err);
        showAlert('error',err);
    }
});