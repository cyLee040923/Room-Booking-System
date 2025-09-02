<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const fileInput = ref(null);
const loading = ref(false);
const error = ref('');
const success = ref('');

const initialRoomState = {
  room_number: '',
  name: '',
  type: '',
  category: '',
  capacity: '',
  additional_price_per_participant: '',
  location: '',
  availability: true,
  under_maintenance: false,
  price: '',
  description: '',
  highlight: false,
  image: null,
};

const room = ref({ ...initialRoomState });

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    room.value.image = file;
    console.log('Selected file:', file);
  }
};

const createRoom = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in.');
    }

    const formData = new FormData();
    Object.keys(room.value).forEach(key => {
      if (key === 'image' && room.value[key]) {
        formData.append('image', room.value[key]);
      } else if (typeof room.value[key] === 'boolean') {
        formData.append(key, room.value[key].toString());
      } else if (room.value[key] !== null && room.value[key] !== undefined) {
        formData.append(key, room.value[key]);
      }
    });

    const response = await fetch('/api/rooms', {  
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create room');
    }

    const data = await response.json();
    console.log('Room created successfully:', data);
    success.value = 'Room created successfully!';

    // Reset form after successful creation
    room.value = { ...initialRoomState };
    if (fileInput.value) {
      fileInput.value.value = '';
    }

    // Redirect to rooms list after 2 seconds
    setTimeout(() => {
      router.push('/rooms');
    }, 2000);

  } catch (err) {
    error.value = err.message;
    console.error('Error creating room:', err.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1 class="profile-title">Create New Room</h1>

      <div v-if="success" class="alert alert-success">
        {{ success }}
      </div>
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <form @submit.prevent="createRoom" class="profile-form">
        <div class="form-row">
          <div class="form-group">
            <label for="room_number">Room Number:</label>
            <input id="room_number" v-model="room.room_number" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="name">Name:</label>
            <input id="name" v-model="room.name" class="form-control" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="type">Type:</label>
            <select id="type" v-model="room.type" class="form-control" required>
              <option value="Single Room">Single Room</option>
              <option value="Share Room">Share Room</option>
            </select>
          </div>
          <div class="form-group">
            <label for="category">Category:</label>
            <input id="category" v-model="room.category" class="form-control" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="capacity">Capacity:</label>
            <input id="capacity" v-model="room.capacity" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="additional_price">Additional Price per Participant:</label>
            <input id="additional_price" v-model="room.additional_price_per_participant" class="form-control" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="location">Location:</label>
            <input id="location" v-model="room.location" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="price">Price:</label>
            <input id="price" v-model="room.price" class="form-control" required />
          </div>
        </div>

        <div class="form-group full-width">
          <label for="description">Description:</label>
          <textarea id="description" v-model="room.description" class="form-control" required></textarea>
        </div>

        <div class="form-group full-width">
          <label for="image">Room Image:</label>
          <input id="image" type="file" @change="handleFileChange" accept="image/*" ref="fileInput" class="form-control" />
        </div>

        <div class="form-row checkbox-row">
          <div class="form-group checkbox-group">
            <input id="availability" type="checkbox" v-model="room.availability" />
            <label for="availability">Available</label>
          </div>
          <div class="form-group checkbox-group">
            <input id="maintenance" type="checkbox" v-model="room.under_maintenance" />
            <label for="maintenance">Under Maintenance</label>
          </div>
          <div class="form-group checkbox-group">
            <input id="highlight" type="checkbox" v-model="room.highlight" />
            <label for="highlight">Highlight</label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-save" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create Room' }}
          </button>
          <button type="button" class="btn btn-cancel" @click="router.push('/rooms')">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Global Styles */
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  margin-top: 50px;
}

.profile-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  animation: fadeIn 0.5s ease-in-out;
}

.profile-title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 1.5rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.form-group {
  flex: 1;
  margin-bottom: 1rem;
}

.form-group.full-width {
  width: 100%;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
  display: block;
}

.checkbox-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.checkbox-group label {
  margin-bottom: 0;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn:active {
  transform: scale(0.98);
}

.btn-save {
  background-color: #007bff;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background-color: #5a6268;
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

