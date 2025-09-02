<script setup>
    import { ref, onMounted } from 'vue';

    const profile = ref({
        company: '',
        username: '',
        email: '',
        mobile: '',
        department: ''
    });

    const isEditing = ref(false);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No token found. Please log in.');
            }

            const response = await fetch('/api/profile', {
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
                    throw new Error('User profile not found.');
                } else {
                    throw new Error('Failed to fetch profile. Server responded with status: ' + response.status);
                }
            }

            const data = await response.json();
            profile.value = data; // Assuming `profile` is a reactive variable
            console.log('Profile fetched successfully:', data);
        } catch (error) {
            console.error('Error fetching profile:', error.message);
        }
    };

    const saveProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No token found. Please log in.');
            }

            const response = await fetch(`/api/users/${profile.value._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(profile.value)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('Forbidden: Invalid token.');
                } else {
                    throw new Error('Failed to save profile. Server responded with status: ' + response.status);
                }
            }

            const data = await response.json();
            //profile.value = data; // Assuming `profile` is a reactive variable
            console.log('Profile saved successfully:', data);
            isEditing.value = false;
        } catch (error) {
            console.error('Error saving profile:', error.message);
        }
    };

    onMounted(() => {
        fetchProfile();
    });


</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1 class="profile-title">User Profile</h1>

      <form v-if="isEditing" @submit.prevent="saveProfile" class="profile-form">
        <div class="form-group">
          <label for="company">Company:</label>
          <input id="company" style="background-color: #f9f9f9; color: #777;" v-model="profile.company" class="form-control" readonly/>
        </div>
        <div class="form-group">
          <label for="username">Username:</label>
          <input id="username" style="background-color: #f9f9f9; color: #777;" v-model="profile.username" class="form-control" readonly/>
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input id="email" style="background-color: #f9f9f9; color: #777;" v-model="profile.email" class="form-control" readonly/>
        </div>
        <div class="form-group">
          <label for="mobile">Mobile:</label>
          <input id="mobile" v-model="profile.mobile" class="form-control" />
        </div>
        <div class="form-group">
          <label for="department">Department:</label>
          <input id="department" style="background-color: #f9f9f9; color: #777;" v-model="profile.department" class="form-control" readonly/>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-save">Save Changes</button>
          <button type="button" class="btn btn-cancel" @click="isEditing = false">Cancel</button>
        </div>
      </form>

      <form v-else class="profile-form">
        <div class="form-group">
          <label for="company">Company:</label>
          <input id="company" :value="profile.company" class="form-control" disabled />
        </div>
        <div class="form-group">
          <label for="username">Username:</label>
          <input id="username" :value="profile.username" class="form-control" disabled />
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input id="email" :value="profile.email" class="form-control" disabled />
        </div>
        <div class="form-group">
          <label for="mobile">Mobile:</label>
          <input id="mobile" :value="profile.mobile" class="form-control" disabled />
        </div>
        <div class="form-group">
          <label for="department">Department:</label>
          <input id="department" :value="profile.department" class="form-control" disabled />
        </div>
        <div class="form-actions">
          <button type="button" @click="isEditing = true" class="btn btn-edit">Edit Profile</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isEditing: false,
      profile: {
        company: ' ',
        username: ' ',
        email: ' ',
        mobile: '',
        department: ' '
      }
    };
  },
  methods: {
    saveProfile() {
      // Save profile logic here
      this.isEditing = false;
    }
  }
};
</script>

<style scoped>
/* Global Styles */
body {
  margin: 0;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

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
  max-width: 500px;
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
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
  display: block;
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

.form-control:disabled {
  background-color: #f9f9f9;
  color: #777;
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

.btn:active {
  transform: scale(0.98);
}

.btn-save {
  background-color: #007bff;
  color: white;
}

.btn-save:hover {
  background-color: #0056b3;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background-color: #5a6268;
}

.btn-edit {
  background-color: #28a745;
  color: white;
}

.btn-edit:hover {
  background-color: #218838;
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

  