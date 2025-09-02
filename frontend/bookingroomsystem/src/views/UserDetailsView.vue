<script setup>
import Button from 'primevue/button';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const user = ref({
    company: '',
    username: '',
    email: '',
    mobile: '',
    department: ''
});

const isEditing = ref(false);
const isAdmin = computed(() => localStorage.getItem('admin') === 'on');

const fetchUser = async () => {
    try {
        const userId = route.params.id;
        if (userId){
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            user.value = data;
        }
    } catch (err) {
        console.error('Failed to fetch user data:', err);
    }
}

const saveUser = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }

        const response = await fetch(`/api/users/${user.value._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(user.value)
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
        user.value = data;
        console.log('User saved successfully:', data);
        isEditing.value = false;
    } catch (error) {
        console.error('Error saving user:', error.message);
    }
};

onMounted(() => {
    fetchUser();
});
</script>

<template>
    <div class="profile-container">
        <div class="profile-card">
            <h1 class="profile-title">User Details</h1>

            <form v-if="isEditing" @submit.prevent="saveUser" class="profile-form">
                <div class="form-group">
                    <label for="company">Company:</label>
                    <input id="company" v-model="user.company" class="form-control" />
                </div>
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input id="username" v-model="user.username" class="form-control" />
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input id="email" v-model="user.email" class="form-control" />
                </div>
                <div class="form-group">
                    <label for="mobile">Mobile:</label>
                    <input id="mobile" v-model="user.mobile" class="form-control" />
                </div>
                <div class="form-group">
                    <label for="department">Department:</label>
                    <input id="department" v-model="user.department" class="form-control" />
                </div>
                <div class="form-actions">
                    <Button type="submit" label="Save Changes" class="btn btn-save p-button-success" />
                    <Button type="button" label="Cancel" class="btn btn-cancel p-button-secondary" @click="isEditing = false" />
                </div>
            </form>

            <form v-else class="profile-form">
                <div class="form-group">
                    <label for="company">Company:</label>
                    <input id="company" :value="user.company" class="form-control" disabled />
                </div>
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input id="username" :value="user.username" class="form-control" disabled />
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input id="email" :value="user.email" class="form-control" disabled />
                </div>
                <div class="form-group">
                    <label for="mobile">Mobile:</label>
                    <input id="mobile" :value="user.mobile" class="form-control" disabled />
                </div>
                <div class="form-group">
                    <label for="department">Department:</label>
                    <input id="department" :value="user.department" class="form-control" disabled />
                </div>
                <div class="form-actions">
                    <Button v-if="isAdmin" type="button" label="Edit" class="btn btn-edit p-button-primary" @click="isEditing = true" />
                    <Button type="button" label="Back" class="btn-back p-button-secondary" @click="router.go(-1)" />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.profile-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
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
    font-weight: 600;
    transition: background-color 0.3s ease, transform 0.3s ease;
}

.btn:active {
    transform: scale(0.98);
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