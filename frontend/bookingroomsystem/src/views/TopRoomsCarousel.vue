<template>
  <div class="carousel-container">
    <h2 class="carousel-title">The Most popular Rooms</h2>

    <div class="rooms-grid">
      <div v-for="room in topRooms" :key="room._id" class="room-item">
        <img
          :src="room.roomDetails.imageUrl"
          alt="Room Image"
          class="room-image"
        />
        <div class="room-info">
          <h3>{{ room.roomDetails.name }}</h3>
          <p class="price">Price: {{ room.roomDetails.price }}</p>
          <p>Total Bookings: {{ room.bookingCount }}</p>
          <div class="buttons">
            <button @click="viewDetails(room)">More Details</button>
            <button v-if="!isAdmin" @click="bookRoom(room)">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      topRooms: [],
      isAdmin: false,
    };
  },
  mounted() {
    this.fetchTopRooms();
    this.checkAdminStatus();
  },
  methods: {
    async fetchTopRooms() {
      try {
        // const res = await axios.get('/api/rooms');
        // this.topRooms = res.data.topRooms;
        const res = await axios.get('/api/rooms/top');
        this.topRooms = res.data.topRooms;
      } catch (err) {
        console.error('Failed to load top rooms:', err);
      }
    },
    async checkAdminStatus() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        
        const res = await axios.get('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        this.isAdmin = localStorage.getItem('admin') === 'on';
      } catch (err) {
        console.error('Failed to check admin status:', err);
        this.isAdmin = false;
      }
    },
    viewDetails(room) {
      // Navigate to RoomDetails page with room ID as a parameter
      this.$router.push({ name: 'RoomDetails', params: { id: room.roomDetails._id } });
      console.log('Viewing details for room:', room.roomDetails._id);
    },
    bookRoom(room) {
      // Navigate to BookRoom page with room ID as a parameter
      this.$router.push({ name: 'RoomBooking', params: { id: room.roomDetails._id } });
      console.log('Booking room:', room.roomDetails._id);
    }
  },
};
</script>

<style scoped>
.carousel-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  padding: 20px;
}

.carousel-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 30px;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.room-item {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.room-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 6px;
}

.room-info {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.room-info h3 {
  margin-top: 0;
}

.price {
  font-weight: bold;
  margin: 0.5rem 0;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
}

button {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
}

button:hover {
  background-color: #0056b3;
}
</style>
  