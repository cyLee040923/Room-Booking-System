<script setup>
// imports
import { ref, inject, onMounted, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// credentials
const credentials = ref({
    email: '',
    password: ''
});

const { isAuthenticated, hideNav } = inject('auth')
const showPassword = ref(false);
const errorMessage = ref(''); // Add a ref to store error messages

// Hide nav when component is mounted
onMounted(() => {
  hideNav()
});

onBeforeMount(() => {
  const token = localStorage.getItem('token');
  if (token) {
    router.push('/home');
  } 
});

// methods
const login = async () => {
    try {
        // Reset error message
        errorMessage.value = '';

        // fetch
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials.value)
        });

        console.log('Response:', response);
        console.log('Response Text:', await response.clone().text());

        // response
        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
          console.warn('Empty response from server');
          localStorage.setItem('token', ''); 
          isAuthenticated.value = true;
          //router.push('/home');
          window.location.href = '/home';
          return;
        }
    
        const text = await response.text();
        if (!text) {
            console.warn('Empty response body');
            localStorage.setItem('token', ''); // Assuming token is empty
            isAuthenticated.value = true;
            return;
        }

        const data = JSON.parse(text);

        if (!response.ok) {
            console.log("login failed");
            errorMessage.value = data.message || 'Invalid email or password'; // Set error message
            throw new Error(data.message);
        }

        // save token to local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId); 
        localStorage.setItem('admin', data.admin);

        isAuthenticated.value = true;
        //router.push('/home');
        window.location.href = '/home';
    } catch (error) {
        if (!errorMessage.value) {
            errorMessage.value = 'An unexpected error occurred'; // Fallback error message
        }
        console.error(error);
    }
};

onMounted(() => {
    if (hideNav) {
        hideNav();
    }
});
</script>

<template>
    <main>
        <div class="container-fluid mt-5">
            <div class="card">
                <div class="card-body">
                    <form @submit.prevent="login">
                        <div class="mb-5">
                            <label for="email" class="form-label">Email: </label>
                            <input type="email" class="form-control" v-model="credentials.email" id="email"
                                aria-describedby="emailHelp" required>
                        </div>
                        <div class="mb-5">
                            <label for="password" class="form-label">Password: </label>
                            <div class="input-group">
                                <input :type="showPassword ? 'text' : 'password'" class="form-control" v-model="credentials.password" id="password" required>
                                <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                                    {{ showPassword ? 'Hide' : 'Show' }}
                                </button>
                            </div>
                        </div>
                        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div> <!-- Display error message -->
                        <button type="submit" class="btn btn-primary">Login</button>
                    </form>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
main {
    background-image: url('@/images/login.png');
    background-size: cover;
    background-position: center;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
}
.card {
    width: 30%;
    background-color: rgba(255, 255, 255, 0.8);
    margin: 0 auto;
}
</style>