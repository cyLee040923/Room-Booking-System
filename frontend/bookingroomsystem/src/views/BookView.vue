<script setup>
import { ref, onMounted, computed, watch} from 'vue';
import { useRoute, useRouter } from "vue-router";
import DatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const route = useRoute();
const router = useRouter();

const userDetails = ref({
  _id: null,
  username: '',
  email: '',
  mobile: '',
});

const fetchUserDetails = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }
        const response = await fetch(`/api/profile`, {
            method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Pass the token in the Authorization header
                }
        });
        
        if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('Forbidden: Invalid token.');
                } else if (response.status === 404) {
                    throw new Error('User data not found.');
                } else {
                    throw new Error('Failed to fetch user data. Server responded with status: ' + response.status);
                }
            }
            
        
        const data = await response.json();
        console.log("Successfully fetched user data " + data._id);
        
        userDetails.value = {
            ...data, 
        };
        console.log("user details", userDetails.value);
    
    } catch (err) {
        console.error('Failed to fetch user data:', err);
    }
};

const room = ref({});
const participant = ref(1); // Initialize participant with a default value

const fetchRoom = async () => {
    try {
        const roomId = route.params.id;
        // Check if there's an ID in the route params
        if (roomId) {
            const response = await fetch(`/api/rooms/${roomId}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            
            const data = await response.json();
            console.log(data);
            
            room.value = {
                ...data, 
            };
        }
    } catch (err) {
        console.error('Failed to fetch room data:', err);
    }
};

const selectedDate = ref('');
const selectedTimeSlots = ref([]);
const isAllDaySelected = ref(false);

// Function to format date for API calls
const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

const timeSlots = computed(() => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    // const nextHour = ((i + 1) % 24).toString().padStart(2, '0');
    const time = `${hour}:00`;
    // const label = `${hour}:00 - ${nextHour}:00`;
    const label = `${hour}:00`;
    slots.push({ time, label });
  }
  return slots;
});

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const hasSelectedSlots = computed(() => {
  return selectedTimeSlots.value.length > 0 || isAllDaySelected.value;
});

const clearSelection = () => {
  selectedTimeSlots.value = [];
  isAllDaySelected.value = false;
};


// const toggleTimeSlot = (time) => {
//   const index = selectedTimeSlots.value.indexOf(time);
//   if (index === -1) {
//     selectedTimeSlots.value.push(time);
//   } else {
//     selectedTimeSlots.value.splice(index, 1);
//   }
// };

const toggleTimeSlot = (time) => {
    if (!availableTimeSlots.value[time]) {
        return; // Don't allow selection of unavailable slots
    }

    const index = selectedTimeSlots.value.indexOf(time);
    
    if (index === -1) {
        // Adding a new slot
        if (selectedTimeSlots.value.length === 0) {
            // First selection
            selectedTimeSlots.value.push(time);
        } else {
            // Check if the new slot is consecutive
            const currentHours = selectedTimeSlots.value.map(slot => parseInt(slot));
            const newHour = parseInt(time);
            
            const minHour = Math.min(...currentHours);
            const maxHour = Math.max(...currentHours);
            
            if (newHour === minHour - 1 || newHour === maxHour + 1) {
                selectedTimeSlots.value.push(time);
                selectedTimeSlots.value.sort();
            } else {
                alert('Please select consecutive time slots only');
            }
        }
    } else {
        // Removing a slot - only allow if it doesn't break consecutive sequence
        const hours = selectedTimeSlots.value.map(slot => parseInt(slot));
        const hourToRemove = parseInt(time);
        
        if (hourToRemove === Math.min(...hours) || hourToRemove === Math.max(...hours)) {
            selectedTimeSlots.value.splice(index, 1);
        } else {
            alert('Cannot remove middle time slots. Please remove from ends.');
        }
    }
};


const toggleAllDay = () => {
  isAllDaySelected.value = !isAllDaySelected.value;
  if (isAllDaySelected.value) {
    selectedTimeSlots.value = timeSlots.value.map(slot => slot.time);
  } else {
    selectedTimeSlots.value = [];
  }
};

// Removed duplicate declaration of isValidBooking

const calculateTotal = () => {
  const additional_price = room.value.additional_price_per_participant * participant.value
  if (isAllDaySelected.value) {
    return room.value.price * 24 + additional_price; // Full day price
  }
  return selectedTimeSlots.value.length * room.value.price + additional_price; // Price per selected timeslot
};

const isValidBooking = computed(() => {
    const participantCount = Number(participant.value); 
    const roomCapacity = Number(room.value.capacity); 
    return (
        (selectedTimeSlots.value.length > 0 || isAllDaySelected.value) &&
        participantCount >= 1 &&
        participantCount <= roomCapacity // Validate against room capacity
    );
});

const bookRoom = async () => {
    try {
        // Check user authentication
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in first');
            router.push('/login');
            return;
        }

        // Validate booking
        if (!isValidBooking.value) {
            alert('Please select at least one timeslot and enter valid participant number');
            return;
        }

        const formattedDate = formatDate(selectedDate.value);
        const bookingData = {
            roomId: room.value._id,
            roomName: room.value.name,
            roomNumber: room.value.room_number,
            date: formattedDate,
            timeslots: selectedTimeSlots.value,
            participant: participant.value,
            totalPrice: calculateTotal(),
            userId: userDetails.value._id,
            username: userDetails.value.username,
            userContact: userDetails.value.mobile,
            userEmail: userDetails.value.email,
            status: 'pending payment'
        };

        const response = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            throw new Error('Failed to create booking');
        }

        const { booking } = await response.json();

        // Start timer
        localStorage.setItem(`booking_timer_${booking._id}`, Date.now().toString());

        // Navigate to payment
        router.push(`/payment/${booking._id}`);

    } catch (error) {
        console.error('Error creating booking:', error);
        alert(error.message);
    }
};

const availableTimeSlots = ref({});

const fetchAvailability = async () => {
    try {
        if (!selectedDate.value || !room.value._id) return;
        
        const formattedDate = formatDate(selectedDate.value);
        const response = await fetch(`/api/bookings/availability/${room.value._id}/${formattedDate}`);
        if (!response.ok) {
            throw new Error('Failed to fetch availability');
        }
        
        const data = await response.json();
        availableTimeSlots.value = data;
    } catch (error) {
        console.error('Error fetching availability:', error);
    }
};

watch(selectedDate, () => {
    fetchAvailability();
    clearSelection();
});

onMounted(() => {
    fetchRoom();
    fetchUserDetails();
});

</script>


<template>
    <div>
        <!-- <h1>Book Room</h1> -->
        <div class="row">
            <div class="col-md-4 image-column">
                <div class="image-container">
                    <img 
                        v-if="room.imageUrl" 
                        :src="room.imageUrl" 
                        :alt="room.name"
                        class="room-image"
                        @error="handleImageError"
                    />
                </div>
            </div>
            <div class="col-md-8 main">
                <div class="room-info">
                    <div class="room-name">
                        <p class="card-title font-weight-bold">{{ room.name }}</p>
                    </div>
                    <div class="room-description">
                        <p class="card-text" style="color:steelblue">{{ room.description }}</p>
                    </div>
                    <div class="room-price">
                        <p class="card-text" style="color:slategrey">Price per hour: ${{ room.price }}</p>
                    </div>
                    <div class="room-additional-price">
                        <p class="card-text" style="color:slategrey">Additional Price per Participant: ${{ room.additional_price_per_participant }}</p>
                    </div>
                </div>
                
                
                <!-- Select Date -->
                <div class="col-md-6 align-items-center date-picker">
                    <h2>Select Date</h2>
                    <div class="date-picker-container">
                        <DatePicker 
                            v-model="selectedDate" 
                            :min-date="new Date()"
                            format="yyyy-MM-dd"
                            placeholder="Select a date"
                            :enable-time-picker="false"
                            auto-apply
                        />
                    </div>
                </div>

                <!-- Timeslot description -->
                 <div v-if="selectedDate" class="timeslot-description">
                    <h2>Timeslot</h2>
                    <p>!  Each timeslot represents 1 hour</p>
                    <p>!  You can must select at least 1 timeslot per booking</p>
                 </div>

                <!-- Select Timeslot -->
                <div v-if="selectedDate" class="timeslots-container">
                    <!-- Clear Selection -->
                    <button 
                        class="clear-btn"
                        @click="clearSelection"
                        :disabled="!hasSelectedSlots"
                        >
                        Clear Selection
                    </button>

                    
                    <div class="timeslots-container">
                        <!-- <div class="timeslots-grid">
                            <button 
                                class="all-day-btn"
                                :class="{ 'selected': isAllDaySelected }"
                                @click="toggleAllDay"
                            >
                                All Day
                            </button>
                            <button
                                v-for="slot in timeSlots"
                                :key="slot.time"
                                class="time-slot"
                                :class="{ 
                                    'selected': selectedTimeSlots.includes(slot.time),
                                    'disabled': isAllDaySelected
                                }"
                                @click="toggleTimeSlot(slot.time)"
                                :disabled="isAllDaySelected"
                            >
                                {{ slot.label }}
                            </button>
                        </div> -->
                        <div class="timeslots-grid">
                            <button 
                                class="all-day-btn"
                                :class="{ 'selected': isAllDaySelected }"
                                @click="toggleAllDay"
                                :disabled="!Object.values(availableTimeSlots).every(slot => slot)"
                            >
                                All Day
                            </button>
                            
                            <button
                                v-for="slot in timeSlots"
                                :key="slot.time"
                                class="time-slot"
                                :class="{ 
                                    'selected': selectedTimeSlots.includes(slot.time),
                                    'disabled': isAllDaySelected || !availableTimeSlots[slot.time],
                                    'unavailable': !availableTimeSlots[slot.time]
                                }"
                                @click="toggleTimeSlot(slot.time)"
                                :disabled="isAllDaySelected || !availableTimeSlots[slot.time]"
                            >
                                {{ slot.label }}
                            </button>
                        </div>
                    </div>

                    <div class="participants">
                        <div>
                            <label>Number of Participant:</label>
                            <input v-model="participant" :min="1" :max=room.capacity required /> 
                        </div>
                    </div>

                    <!-- Total Price -->
                    <div class="booking-actions">
                        <span class="total-price">
                            Total: HKD {{ calculateTotal() }}
                        </span>
                        <button 
                            class="book-now-btn" 
                            :disabled="!isValidBooking" 
                            @click="bookRoom"
                        >
                            Book Now
                        </button>
                    </div>

                </div>

            </div>
        </div>
        

    </div>
</template>

<style scoped>

.image-column {
    flex: 1;
    max-width: 33.33%;
    padding: 10px;
}

.image-container {
  width: 100%;
  height: 0;
  padding-bottom: 75%; 
  position: relative;
  margin: 10px;
}

.room-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px
}

.main{
    flex: 1;
    padding-left: 50px;
}
.room-info{
    flex: 1;
}

.room-name{
    font-size: 50px;
    font-weight: bold;
    padding-bottom: 60px;
    padding: 10px;
}

.room-description{
    font-size: 25px;
    padding-bottom: 30px;
    padding: 10px;
}

.room-price, .room-additional-price{
    padding: 10px;
}

.date-picker{
    padding: 10px;
    padding-bottom: 60px;
}

.date-picker h2 {
    font-size: 22px;
    margin-bottom: 10px;
    color: #333;
}

.date-picker-container {
    width: 100%;
}

.date-picker-container :deep(.dp__main) {
    width: 100%;
}

.date-picker-container :deep(.dp__input) {
    height: 50px;
    font-size: 16px;
    padding: 10px 15px;
}

.timeslot-description{
    padding: 10px;
    padding-bottom: 30px;
}

.timeslots-container {
    margin-top: 20px;
    padding-right:10px;
    margin-bottom: 20px;
}

.timeslots-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr); 
    gap: 10px; 
}

.all-day-btn,
.time-slot {
    padding: 10px;
    font-size: 14px;
    text-align: center;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.all-day-btn.selected,
.time-slot.selected {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
}

.time-slot.disabled {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

.all-day-btn:hover:not(.disabled),
.time-slot:hover:not(.disabled) {
    background-color: #0056b3;
    color: white;
}

.clear-btn {
    padding: 10px 20px;
    font-size: 16px;
    font-weight: bold;
    color: white;
    background-color: #1678b5; 
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

.clear-btn:hover {
    background-color: #05324e; 
    transform: scale(1.05); 
}

.clear-btn:disabled {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

.booking-actions {
    margin-top: 30px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
}

.total-price {
    font-size: 25px;
    font-weight: bold;
    color: #333;
}

.book-now-btn {
    padding: 12px 24px;
    margin-right:10px;
    font-size: 20px;
    font-weight: bold;
    color: white;
    background-color: #28a745;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    min-width: 120px;
}

.book-now-btn:hover {
    background-color: #196b2b; 
    transform: scale(1.05); 
}

.book-now-btn:disabled {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

.time-slot.unavailable {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
}

.time-slot.unavailable:hover {
    background-color: #f0f0f0;
    color: #999;
    transform: none;
}

@media (max-width: 768px) {
    .booking-actions {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
    }

    .total-price {
        text-align: center;
    }

    .book-now-btn {
        width: 100%;
    }
}
</style>
