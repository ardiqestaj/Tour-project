import axios from 'axios';
const stripe = Stripe(
  'pk_test_51MX3CoHF3UhtCiVqXopBeSEnrf9olOQvHVIOXLTatiOOHxj14fi6c1v3mJAtw0iwsGtK0S5BBdYroknn78bGRoWq00XWXY9q32'
);

export const bookTour = async (tourId) => {
  //  1) Get checkout session from API
  const session = await axios(
    `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`
  );
  console.log(session);
  // 2) Create checkout from + charge credit card
};
