<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import Select from 'primevue/select';

const fileInput = ref(null);
const selectedFile = ref(null);
const route = useRoute();
const router = useRouter();
const isAdmin = computed(() => localStorage.getItem('admin') === 'on');


const details = ref({
    bookingId: '',
    roomName: '',
    date: '',
    timeslots: [],
    status: '',
    paymentProof: null,
    totalPrice: 0
});


const fetchDetails = async () => {
    try {
        const bookingId = route.params.id;

        if (!bookingId) {
            throw new Error('No booking ID provided');
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }

        // Always use the same endpoint for fetching booking details
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized: Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Forbidden: You do not have permission to view this booking.');
            } else {
                throw new Error('Failed to fetch booking details');
            }
        }

        const data = await response.json();
        
        // Transform the data consistently for both admin and normal users
        details.value = {
            bookingId: data._id,
            roomId: data.roomId,
            roomName: data.roomName,
            roomNumber: data.roomNumber,
            date: data.date,
            timeslots: data.timeslots,
            status: data.status,
            paymentProof: data.paymentProof,
            totalPrice: data.totalPrice,
            participant: data.participant,
            userId: data.userId,
            username: data.username,
            userContact: data.userContact,
            userEmail: data.userEmail
        };

        selectedStatus.value = data.status;
        console.log('Fetched booking details:', data);

    } catch (error) {
        console.error('Error fetching booking details:', error);
        router.push('/bookings'); // Redirect to bookings page on error
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
}

const getStartTime = (timeslots) => {
    if (!timeslots || timeslots.length === 0) return '-';
    // Sort timeslots chronologically
    const sortedSlots = [...timeslots].sort((a, b) => {
        const [hourA] = a.split(':').map(Number);
        const [hourB] = b.split(':').map(Number);
        return hourA - hourB;
    });
    return sortedSlots[0];
}

const getEndTime = (timeslots) => {
    if (!timeslots || timeslots.length === 0) return '-';
    
    // Sort timeslots chronologically
    const sortedSlots = [...timeslots].sort((a, b) => {
        const [hourA] = a.split(':').map(Number);
        const [hourB] = b.split(':').map(Number);
        return hourA - hourB;
    });
    
    const startTime = sortedSlots[sortedSlots.length - 1]; // Get the last timeslot
    const [hour, minute] = startTime.split(':').map(Number); // Split the time into hour and minute
    const endTime = new Date();
    endTime.setHours(hour, minute + 59); // Add 59 minutes to the start time

    return endTime.toTimeString().slice(0, 5); // Format as HH:MM
}

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
  console.log('Selected file:', selectedFile.value);
};

const uploadPaymentProof = async () => {
    try {

        if (!selectedFile.value) {
            console.error('No file selected');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }

        const formData = new FormData()

        formData.append('paymentProof', selectedFile.value)

        const response = await fetch(`/api/users/bookingHistory/${details.value.bookingId}/uploadPaymentProof`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload payment proof');
        }

        const data = await response.json();
        console.log('Payment proof uploaded successfully:', data);
        await fetchDetails();

    } catch (error) {
        console.error('Error uploading payment proof:', error.message);
    }
};

const selectedStatus = ref(null);
const statusOptions = [
    { label: 'Pending Payment', value: 'pending payment' },
    { label: 'Pending Approval', value: 'Pending approval' },
    { label: 'Confirmed', value: 'confirmed' }
];

const updateStatus = async () => {
    try{
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }

        const response = await fetch(`/api/bookings/${route.params.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: selectedStatus.value })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized: Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Forbidden: Invalid token.');
            } else {
                throw new Error('Failed to save user. Server responded with status: ' + response.status);
            }
        }

        const data = await response.json();
        details.value.status = data.status; 
        selectedStatus.value = data.status;
    } catch (error) {
        console.error('Error updating status:', error.message);
    }
}

const canReturnToPayment = computed(() => {
    // Get current user's ID from localStorage or wherever you store it
    const currentUserId = localStorage.getItem('userId');
    
    return (
        details.value.status === 'pending payment' && 
        details.value.userId && 
        currentUserId && 
        details.value.userId.toString() === currentUserId.toString()
    );
});

const canUploadPaymentProof = computed(() => {
    const currentUserId = localStorage.getItem('userId');
    console.log('Current user ID:', currentUserId);
    console.log('Booking user ID:', details.value.userId);
    
    // If you need to compare ObjectIds, convert both to strings
    const bookingUserId = details.value.userId?.toString();
    const currentUserIdString = currentUserId?.toString();
    
    return (
        details.value.status === 'pending payment' && 
        bookingUserId && 
        currentUserIdString && 
        bookingUserId === currentUserIdString 
    );
});

const hasPaymentProof = computed(() => {
    return !!details.value.paymentProof;
});

const returnToPayment = () => {
    try {
        const bookingId = details.value.bookingId; // Using bookingId from details
        if (!bookingId) {
            throw new Error('Booking ID not found');
        }

        const timerKey = `booking_timer_${bookingId}`;
        
        // Check if this specific booking has expired
        const bookingTime = localStorage.getItem(timerKey);
        if (!bookingTime) {
            // If no timer exists, set a new one
            localStorage.setItem(timerKey, Date.now().toString());
        } else {
            // Check if existing timer has expired
            const elapsedSeconds = Math.floor((Date.now() - parseInt(bookingTime)) / 1000);
            if (elapsedSeconds >= 900) { // 15 minutes
                alert('Payment session has expired. Please make a new booking.');
                // Clean up expired booking data
                localStorage.removeItem(`pending_booking_${bookingId}`);
                localStorage.removeItem(timerKey);
                router.push('/rooms');
                return;
            }
        }

        // Store the current booking details
        localStorage.setItem(`pending_booking_${bookingId}`, JSON.stringify({
            bookingId: details.value.bookingId,
            roomId: details.value.roomId,
            roomName: details.value.roomName,
            roomNumber: details.value.roomNumber,
            date: details.value.date,
            timeslots: details.value.timeslots,
            participant: details.value.participant, // Added participant
            totalPrice: details.value.totalPrice,
            userId: details.value.userId,
            username: details.value.username,
            userContact: details.value.userContact,
            userEmail: details.value.userEmail,
            status: 'pending payment'
        }));
        
        // Navigate to payment page with booking ID
        router.push(`/payment/${bookingId}`);

    } catch (error) {
        console.error('Error returning to payment:', error);
        alert('Failed to return to payment page. Please try again.');
    }
};


const currentStep = computed(() => details.value.status?.toLowerCase() || '');

const isStepCompleted = (step) => {
    const status = currentStep.value;
    
    switch(status) {
        case 'pending approval':
            return step === 'pending payment';
        case 'confirmed':
            return step === 'pending payment' || step === 'pending approval';
        default:
            return false;
    }
};

onMounted(() => {
    fetchDetails();    
})


</script>

<template>

    <div class="header mt-3">
        <h1>Booking Details</h1>
    </div>

    <div>
        <div class="stepper-wrapper">
            <div 
                class="stepper-item"
                :class="{
                    'completed': isStepCompleted('pending payment') || currentStep === 'pending payment'
                }"
            >
                <div class="step-counter">1</div>
                <div class="step-name">Pending Payment</div>
            </div>
            <div 
                class="stepper-item"
                :class="{
                    'completed': isStepCompleted('pending approval') || currentStep === 'pending approval'
                }"
            >
                <div class="step-counter">2</div>
                <div class="step-name">Pending Approval</div>
            </div>
            <div 
                class="stepper-item"
                :class="{
                    'completed': isStepCompleted('confirmed') || currentStep === 'confirmed'
                }"
            >
                <div class="step-counter">3</div>
                <div class="step-name">Confirmed</div>
            </div>
        </div>
    </div>

    <div class="details mt-3">
        <div>
            Booking ID: {{ details.bookingId }}
        </div>
        <div>
            Name: {{ details.roomName }}
        </div>
        <div>
            Date: {{ formatDate(details.date) }}
        </div>
        <div>
            Start Time: {{ getStartTime(details.timeslots) }}
        </div>
        <div>
            End Time: {{ getEndTime(details.timeslots) }}
        </div>

        <div v-if="isAdmin">
            <form @submit.prevent="updateStatus" class="flex gap-3 items-center"> 
                <div>Status: </div>
                <Select
                    v-model="selectedStatus"
                    :options="statusOptions"
                    :placeholder="details.status || 'Select a Status'"
                    class="w-full md:w-14rem"
                    optionLabel="label"
                    optionValue="value"
                />
                <Button 
                    type="submit" 
                    label="Update Status"
                    severity="success"
                />
            </form>
        </div>
        <div v-else>
            Status: {{ details.status }}
        </div>
    </div>

    <div v-if="canReturnToPayment" class="payment-actions mt-3">
        <Button 
            label="Return to Payment" 
            severity="success" 
            @click="returnToPayment"
            :disabled="!details.bookingId"
        />
    </div>

    <div class="payment-proof row mt-3">
        <div v-if="hasPaymentProof">
            <div class="payment-header">Payment Proof:</div>
            <img 
                :src="details.paymentProof" 
                :alt="`Payment proof for booking ${details.bookingId}`"
                @error="handleImageError"
                class="proof-img"
            />
        </div>
        <div v-else-if="canUploadPaymentProof">
            <form @submit.prevent="uploadPaymentProof" class="upload-form">
                <div class="mb-3">
                    <div class="payment-header">Upload Payment Proof:</div>
                    <input 
                        type="file" 
                        @change="handleFileChange" 
                        accept="image/*" 
                        ref="fileInput"
                        class="file-picker"
                    />
                </div>
                <Button 
                    type="submit" 
                    label="Upload"
                    severity="primary"
                    :disabled="!selectedFile"
                />
            </form>
        </div>

    </div>

    <div style="display: flex; justify-content: flex-end;">
        <Button type="button" label="Back" class="btn-back p-button-primary" @click="router.go(-1)" />
    </div>
    
</template>

<style scoped>
.proof-img {
    max-height: 300px;
    padding:30px;
}

.header{
    padding: 30px;
    font-size: 70px;
    font-weight: bold;
    padding-bottom: 60px;
}

.details{
    padding: 30px;
    font-size: 25px;
    row-gap: 15px;
}

.payment-header{
    padding: 30px;
    font-size: 25px;
    font-weight: bold;
}

.file-picker{
    padding: 30px;
}

.btn {
    padding: 12px 24px;
    margin-left:30px;
    font-size: 20px;
    font-weight: bold;
    color: white;
    background-color: #28a745;
    border-color: #196b2b;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    min-width: 120px;
}

.btn:hover {
    background-color: #196b2b; 
    transform: scale(1.05); 
}

.btn:disabled {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

.stepper-wrapper {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.stepper-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.stepper-item::before {
  position: absolute;
  content: "";
  border-bottom: 2px solid #ccc;
  width: 100%;
  top: 20px;
  left: -50%;
  z-index: 2;
}

.stepper-item::after {
  position: absolute;
  content: "";
  border-bottom: 2px solid #ccc;
  width: 100%;
  top: 20px;
  left: 50%;
  z-index: 2;
}

.stepper-item .step-counter {
  position: relative;
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ccc;
  margin-bottom: 6px;
}

.stepper-item.active {
  font-weight: bold;
}

.stepper-item.completed .step-counter {
  background-color: #38d02d;
}

.stepper-item.completed::after {
  position: absolute;
  content: "";
  border-bottom: 2px solid #38d02d;
  width: 100%;
  top: 20px;
  left: 50%;
  z-index: 3;
}

.stepper-item:first-child::before {
  content: none;
}
.stepper-item:last-child::after {
  content: none;
}
</style>