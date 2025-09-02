<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref, provide, onMounted, watch } from 'vue'

const router = useRouter();
const isAuthenticated = ref(false);
const isAdmin = ref(false);

const logout = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to logout');
        }

        // Remove the token from local storage
        localStorage.removeItem('token');

        isAuthenticated.value = false;

        // Redirect to the login page
        router.push('/');
    } catch (error) {
        console.error('Error during logout:', error.message);
    }
};
const userName = ref('')

const fetchIsAdmin = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }
        isAdmin.value = localStorage.getItem('admin') === 'on'
        console.log('Admin: ', isAdmin.value)
    } catch (error) {
        console.error('Error during fetchIsAdmin:', error.message);
    }
}

const fetchName = async () => {
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
        userName.value = data;
    } catch (error) {
        console.error('Error fetching profile:', error.message);
    }
};

//const showMenu = ref(false)
const showNav = ref(true) // New ref to control nav visibility

// const toggleMenu = () => {
//   showMenu.value = !showMenu.value
// }

const hideNav = () => {
    showNav.value = false
}

const showNavBar = () => {
    showNav.value = true
}

provide('auth', {
    isAuthenticated,
    hideNav,
    showNavBar
})

watch(isAuthenticated, (newValue) => {
    if (newValue) {
        showNavBar()
    } else {
        hideNav()
    }
})

onMounted(() => {
    const token = localStorage.getItem('token');
    isAuthenticated.value = !!token;
    if (isAuthenticated.value) {
        fetchName();
        fetchIsAdmin();
    }
});
</script>

<!-- Users nav bar -->
<template>
    <div class="page-container">
        <nav v-if="isAuthenticated && !isAdmin" class="menubar">
            <div class="left">
                <a href="/home" @click="goToHome">
                    <span>&#127968;</span> Room Booking System
                </a>
            </div>
            <div class="right">
                <span>Welcome, {{ userName.username }}</span>
                <a href="/bookings">Bookings</a>
                <a href="/myBookings">My Bookings</a>
                <a href="/profile">Profile</a>
                <a href="/AboutUs">About us</a>
                <a href="#" @click="logout">Logout</a>
            </div>
        </nav>
        <!-- admin nav bar -->
        <nav v-if="isAuthenticated && isAdmin" class="menubar">
            <div class="left">
                <a href="/home" @click="goToHome">
                    <span>&#127968;</span>Room Booking System</a>
            </div>
            <div class="right">
                <span>Welcome, {{ userName.username }}</span>
                <a href="/rooms">Room Information</a>
                <a href="/users">User Information</a>
                <!-- <a href="/bookings">Bookings</a>
                <a href="/myBookings">My Bookings</a> -->
                <a href="/BookingRecords">Booking Record</a>
                <a href="/profile">Profile</a>
                <a href="/AboutUs">About us</a>
                <a href="#" @click="logout">Logout</a>
            </div>
        </nav>

        <div class="main-content">
            <RouterView />
        </div>

        <footer class="footer">
            <div class="row">
                <div class="col-6 col-md-4">
                    <img style="width: 60%; max-width: 200px;" class="company-image" src="@/images/AboutUs.jpg" alt="Company Image" />
                </div>
                <div class="col-6 col-md-4"> 
                    <nav v-if="isAuthenticated" class="grid grid-flow-col gap-4 justify-center">
                        <a href="/AboutUs" class="text-white"> About us</a>
                        <a href="/bookings" class="text-white"> Bookings</a>
                    </nav>
                   
  
                        <div style="min-height: 30px; padding-top: 50px;">
                            <a>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    class="fill-current text-white">
                                    <path
                                        d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z">
                                    </path>
                                </svg>
                            </a>
                            <a>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    class="fill-current text-white">
                                    <path
                                        d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z">
                                    </path>
                                </svg>
                            </a>
                            <a>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    className="fill-current">
                                    <path
                                        d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z">
                                    </path>
                                </svg>
                            </a>
                        </div>
                        

                        <aside>
                            <p>Room Booking System © 2025 - Comp4117 Group C Project</p>
                        </aside>
          
                </div>

                <div class="col-12 col-md-4">
                    <nav class="grid grid-flow-col gap-4 justify-center">
                        <p>
                            <strong>HK Headquarter</strong><br />
                            Unit 219, 2/F, 
                            16 Science Park West Avenue, <br />
                            Shatin, New Territories, 
                            Hong Kong
                        </p>
                        <P>
                            TRONICO TECHNOLOGY CO. LTD.

                            (852) 9667 7650

                            kuju@tronico.com.hk
                        </P>
                    </nav>
                </div>
            </div>
        </footer>
    </div>
</template>




<style scoped>
.menubar {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #333;
    /* Background color for the navbar */
    color: white;
    /* Text color */
}

.left a {
    color: white;
    text-decoration: none;
    font-weight: bold;
    font-size: 1.2em;
}

.right {
    display: flex;
    align-items: center;
    gap: 20px;
    /* Adds space between items */
}

.right span {
    margin-right: 40px; /* Add more gap between username and routes */
    font-weight: bold;
    color: white;
}

.right a {
    color: white;
    text-decoration: none;
}

.page-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
}

.main-content {
    flex: 1;
    overflow-y: auto;
    /* padding-bottom: 20px; */
    padding-bottom: 0;
}

.footer {
    margin-top: auto;
    background-color: #a19f9f;
    padding: 5px;
    text-align: center;
    position: sticky;
    bottom: 0;
    width: 100%;
    z-index: 1000;
}

/* 
.footer{
    background-color: #a19f9f;
    color: rgb(192, 184, 184);
    padding: 5px;
    text-align: center;
} */
</style>