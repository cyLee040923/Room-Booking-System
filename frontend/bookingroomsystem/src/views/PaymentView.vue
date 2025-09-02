<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { loadScript } from "@paypal/paypal-js";
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();
const bookingId = ref(null);

const bookingDetails = ref({
  roomId: '',
  roomName: '',
  roomNumber: '',
  date: '',
  timeslots: [],
  totalPrice: 0,
  userId: '',
  username: '',
  userContact: '',
  userEmail: '',
});

const paymentMethod = ref('credit_card');
const cardNumber = ref('');
const cardholderName = ref('');
const expiryDate = ref('');
const cvv = ref('');
const isProcessing = ref(false);
const errors = ref({});
const paypalLoaded = ref(false);
let paypal;

onMounted(async () => {
  try {
    // Get bookingId from route params
    bookingId.value = route.params.bookingId;
    if (!bookingId.value) {
      throw new Error('No booking ID provided');
    }

    // Fetch booking details from API instead of localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in.');
    }

    // First check booking status
    const statusResponse = await fetch(`/api/bookings/checkStatus/${bookingId.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to check booking status');
    }

    const statusData = await statusResponse.json();

    if (statusData.status === 'expired') {
      alert('This booking has expired');
      router.push('/bookings');
      return;
    }

    const response = await fetch(`/api/bookings/${bookingId.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch booking details');
    }

    const booking = await response.json();

    bookingDetails.value = booking;
    timeLeft.value = statusData.timeRemaining;
    startTimer();

    // Set booking details
    bookingDetails.value = {
      roomId: booking.roomId,
      roomName: booking.roomName,
      roomNumber: booking.roomNumber,
      date: booking.date,
      timeslots: booking.timeslots,
      totalPrice: booking.totalPrice,
      userId: booking.userId,
      username: booking.username,
      userContact: booking.userContact,
      userEmail: booking.userEmail
    };

    // Initialize PayPal
    paypal = await loadScript({
      clientId: 'AbB0Y1oixi3sgEZdVbzhe9RSYadn-cwaEkG-jWVFCAWesdvsZORFoSrejNG-AEJPZaVuo7nS9b3d8XmA'
    });
    paypalLoaded.value = true;

  } catch (error) {
    console.error("failed to load the PayPal JS SDK script", error);
  }

});

// // Get booking details from route params
// onMounted(() => {
//   const details = JSON.parse(localStorage.getItem('pendingBookingDetails'));
//   if (details) {
//     bookingDetails.value = details;
//   } else {
//     alert('No booking details found!');
//     router.push('/bookings');
//   }
// });

const validateForm = () => {
  errors.value = {};
  let isValid = true;

  if (paymentMethod.value === 'credit_card') {
    if (!cardNumber.value || cardNumber.value.length < 16) {
      errors.value.cardNumber = 'Please enter a valid card number';
      isValid = false;
    }

    if (!cardholderName.value) {
      errors.value.cardholderName = 'Please enter the cardholder name';
      isValid = false;
    }

    if (!expiryDate.value) {
      errors.value.expiryDate = 'Please enter the expiry date';
      isValid = false;
    }

    if (!cvv.value || cvv.value.length < 3) {
      errors.value.cvv = 'Please enter a valid CVV';
      isValid = false;
    }
  }

  return isValid;
};

const renderPayPalButton = async () => {
  if (!paypal || !bookingDetails.value.totalPrice) return;

  await paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: bookingDetails.value.totalPrice.toString()
          }
        }]
      });
    },
    onApprove: async (data, actions) => {
      try {
        const order = await actions.order.capture();
        console.log('PayPal Order:', order);

        await completeBooking();

        alert('Payment successful! Your booking has been confirmed.');
        router.push('/myBookings');
      } catch (error) {
        console.error('PayPal payment error:', error);
        alert('Payment failed. Please try again.');
      }
    },
    onError: (err) => {
      console.error('PayPal Checkout error:', err);
      alert('Payment failed. Please try again.');
    }
  }).render('#paypal-button-container');
};


const processPayment = async () => {
  if (paymentMethod.value === 'paypal') {
    renderPayPalButton();
    return;
  }
  if (!validateForm()) {
    return;
  }

  isProcessing.value = true;

  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // After successful payment, proceed with the booking
    await completeBooking();

    // Clear the pending booking details
    localStorage.removeItem('pendingBookingDetails');

    // Show success message and redirect
    alert('Payment successful! Your room has been booked.');
    router.push('/bookings');
  } catch (error) {
    alert(`Payment failed: ${error.message}`);
  } finally {
    isProcessing.value = false;
  }
};

const completeBooking = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    if (timeLeft.value <= 0) {
      throw new Error('Booking time has expired');
    }

    const response = await fetch(`/api/bookings/update/${bookingId.value}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        paymentMethod: paymentMethod.value,
        paymentProof: null // For PayPal, no proof needed
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete booking');
    }

    clearInterval(timer.value);
    return await response.json();

  } catch (error) {
    console.error('Error completing booking:', error);
    throw error;
  }
};

const formatTimeslots = (timeslots) => {
  if (!timeslots || timeslots.length === 0) return 'No timeslots selected';

  if (timeslots.length === 24) {
    return 'All Day';
  }

  const startTime = timeslots[0];

  let endTime = timeslots[timeslots.length - 1];

  // if timeslots = {0: '04:00', 1: '05:00', 2: '06:00'}
  // startTime = 04:00
  // endTime = 07:00
  // if timeslots = {0: '04:00'}
  // endTime = 05:00

  if (timeslots.length > 0) {
    const lastTime = timeslots[timeslots.length - 1];
    const lastHour = parseInt(lastTime.split(':')[0], 10);
    const lastMinute = parseInt(lastTime.split(':')[1], 10);

    // The last timeslot is at the end of the hour, add 1 hour to the last hour
    // e.g. 04:00, 05:00, 06:00 -> endTime = 07:00
    // e.g. 04:00 -> endTime = 05:00
    if (lastMinute === 0) {
      endTime = `${lastHour + 1}:00`;
    } else {
      endTime = `${lastHour}:${lastMinute}`;
    }
  } 

  return `${startTime} - ${endTime}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};


const timeLeft = ref(900); //15 mins
const timer = ref(null);

const formattedTimeLeft = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});


const startTimer = () => {
  // Clear any existing timer
  if (timer.value) {
    clearInterval(timer.value);
  }

  // If time has already expired, handle it immediately
  if (timeLeft.value <= 0) {
    handleExpiredBooking();
    return;
  }

  // Start the countdown
  timer.value = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timer.value);
      handleExpiredBooking();
    }
  }, 1000);
};

const handleExpiredBooking = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/bookings/checkExpired`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: bookingId.value
      })
    });

    if (!response.ok) {
      throw new Error('Failed to handle expired booking');
    }

    alert('Booking expired. Please try again.');
    router.push('/rooms');
  } catch (error) {
    console.error('Error handling expired booking:', error);
    alert('Error handling expired booking. Please try again.');
    router.push('/rooms');
  }
};


onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});


</script>

<template>
  <div class="payment-container">
    <h1>Payment</h1>
    <div class="timer-container">
      <div class="timer" :class="{ 'timer-warning': timeLeft < 300 }">
        Time remaining: {{ formattedTimeLeft }}
      </div>
    </div>

    <div class="booking-summary">
      <h2>Booking Summary</h2>
      <div class="summary-details">
        <div class="summary-row">
          <span class="label">Room:</span>
          <span class="value">{{ bookingDetails.roomName }}</span>
        </div>
        <div class="summary-row">
          <span class="label">Room Number:</span>
          <span class="value">{{ bookingDetails.roomNumber }}</span>
        </div>
        <div class="summary-row">
          <span class="label">Date:</span>
          <span class="value">{{ formatDate(bookingDetails.date) }}</span>
        </div>
        <div class="summary-row">
          <span class="label">Time:</span>
          <span class="value">{{ formatTimeslots(bookingDetails.timeslots) }}</span>
        </div>
        <div class="summary-row total">
          <span class="label">Total Price:</span>
          <span class="value price">HKD {{ bookingDetails.totalPrice }}</span>
        </div>
      </div>
    </div>

    <div class="payment-methods">
      <h2>Payment Method</h2>
      <div class="payment-options">
        <div class="payment-option">
          <input type="radio" id="paypalRadio" value="paypal" v-model="paymentMethod">
          <label for="paypal">PayPal</label>
        </div>

        <div class="payment-option">
          <input type="radio" id="othersRadio" value="others" v-model="paymentMethod">
          <label for="paypal">Alipay / Payme / Bank Deposit</label>
        </div>
      </div>
    </div>

    <div v-if="paymentMethod === 'others'">
      <div class="row alipay">
        <p>Alipay: </p>
        <img src="@/images/Alipay.jpg" alt="Alipay_Code" style="height: 100px; width: 120px;" />
      </div>

      <div class="row payme">
        <p>Payme: </p>
        <img src="@/images/Payme.jpg" :alt="Payme_Code" style="height: 100px; width: 120px;" />
      </div>

      <div class="row bankDeposit">
        <p>Bank Deposit: </p>
        <p>HSBC: 1234567890</p>
        <p>Bank of China: 2345678901</p>
      </div>
    </div>




    <div v-if="paymentMethod === 'paypal'" class="paypal-info">
      <div v-if="paypalLoaded">
        <div id="paypal-button-container"></div>
      </div>
      <div v-else>
        <p>Loading PayPal...</p>
      </div>
    </div>


    <div class="payment-actions">
      <button class="btn-back" @click="router.go(-1)">
        Back
      </button>
      <button class="btn-pay" @click="processPayment" :disabled="isProcessing">
        <span v-if="isProcessing">Processing...</span>
        <span v-else>Pay Now</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.payment-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

h2 {
  color: #444;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.booking-summary {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.summary-row:last-child {
  border-bottom: none;
}

.total {
  margin-top: 1rem;
  font-weight: bold;
}

.price {
  color: #28a745;
  font-size: 1.2rem;
}

.payment-methods {
  margin-bottom: 2rem;
}

.payment-options {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.credit-card-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.form-row .form-group {
  flex: 1;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.payment-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.btn-back,
.btn-pay {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-back {
  background-color: #6c757d;
  color: white;
  border: none;
}

.btn-back:hover {
  background-color: #5a6268;
}

.btn-pay {
  background-color: #28a745;
  color: white;
  border: none;
  min-width: 150px;
}

.btn-pay:hover {
  background-color: #218838;
}

.btn-pay:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.paypal-info,
.apple-pay-info {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.timer-container {
  text-align: center;
  margin-bottom: 1rem;
}

.timer {
  font-size: 1.2rem;
  font-weight: bold;
  color: #28a745;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.timer-warning {
  color: #dc3545;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}
</style>