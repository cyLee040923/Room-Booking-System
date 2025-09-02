<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const newUser = ref({
    company: '',
    username: '',
    email: '',
    password: '',
    mobile: '',
    department: '',
    isAdmin: false
});

const loading = ref(false);
const error = ref('');
const success = ref('');

const createUser = async () => {
    loading.value = true;
    error.value = '';
    success.value = '';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newUser.value)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized: Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Forbidden: You do not have permission to create users.');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create user.');
            }
        }

        const data = await response.json();
        console.log('User created successfully:', data);
        success.value = 'User created successfully!';
        
        // Reset form after successful creation
        newUser.value = {
            company: '',
            username: '',
            email: '',
            password: '',
            mobile: '',
            department: '',
            isAdmin: false
        };
        
        // Redirect to users list after 2 seconds
        setTimeout(() => {
            router.push('/users');
        }, 2000);
    } catch (err) {
        error.value = err.message;
        console.error('Error creating user:', err.message);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1 class="profile-title">Create New User</h1>

      <div v-if="success" class="alert alert-success">
        {{ success }}
      </div>
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <form @submit.prevent="createUser" class="profile-form">
        <div class="form-group">
          <label for="company">Company:</label>
          <input id="company" v-model="newUser.company" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="username">Username:</label>
          <input id="username" v-model="newUser.username" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input id="email" type="email" v-model="newUser.email" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input id="password" type="password" v-model="newUser.password" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="mobile">Mobile:</label>
          <input id="mobile" v-model="newUser.mobile" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="department">Department:</label>
          <input id="department" v-model="newUser.department" class="form-control" required />
        </div>
        <div class="form-group checkbox-group">
          <input id="isAdmin" type="checkbox" v-model="newUser.isAdmin" />
          <label for="isAdmin">Administrator</label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-save" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create User' }}
          </button>
          <button type="button" class="btn btn-cancel" @click="router.push('/users')">Cancel</button>
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

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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