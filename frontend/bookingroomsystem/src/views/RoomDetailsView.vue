<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from "vue-router";
import Button from 'primevue/button';

const route = useRoute();
const router = useRouter();

const room = ref({});

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

const isAdmin = computed(() => localStorage.getItem('admin') === 'on');

const handleImageError = (event) => {
    event.target.src = '/placeholder-room.jpg'; // Fallback image
};

onMounted(() => {
    fetchRoom();
});

</script>


<template>
    <div class="room-details-container">
        <div class="room-details-card">
            <div class="room-image-section">
                <img 
                    v-if="room.imageUrl" 
                    :src="room.imageUrl" 
                    :alt="room.name"
                    class="room-image"
                    @error="handleImageError"
                />
                <div class="room-badge" v-if="room.type">{{ room.type }}</div>
                <div class="room-category-badge" v-if="room.category">{{ room.category }}</div>
            </div>
            
            <div class="room-info-section">
                <div class="room-header">
                    <h1 class="room-name">{{ room.name }}</h1>
                    <p class="room-location"><i class="pi pi-map-marker" style="margin-right: 5px;"></i>{{ room.location }}</p>
                </div>

                <div class="room-divider"></div>
                
                <div class="room-highlights">
                    <div class="highlight-item">
                        <span class="highlight-icon"><i class="pi pi-users"></i></span>
                        <div class="highlight-text">
                            <div class="highlight-label">Capacity</div>
                            <div class="highlight-value">{{ room.capacity }} people</div>
                        </div>
                    </div>
                    
                    <div class="highlight-item">
                        <span class="highlight-icon"><i class="pi pi-dollar"></i></span>
                        <div class="highlight-text">
                            <div class="highlight-label">Price</div>
                            <div class="highlight-value">${{ room.price }}/hour</div>
                        </div>
                    </div>
                    
                    <div class="highlight-item">
                        <span class="highlight-icon"><i class="pi pi-plus-circle"></i></span>
                        <div class="highlight-text">
                            <div class="highlight-label">Additional</div>
                            <div class="highlight-value">${{ room.additional_price_per_participant }}/person</div>
                        </div>
                    </div>
                </div>
                
                <div class="room-divider"></div>
                
                <div class="room-description-section">
                    <h2>Description</h2>
                    <p>{{ room.description }}</p>
                </div>
                
                <div class="room-actions">
                    <Button 
                        v-if="!isAdmin"
                        type="button" 
                        label="Book Now" 
                        class="p-button-raised p-button-primary book-button" 
                        @click="router.push(`/bookings/book/${room._id}`)"
                    />
                    
                    <div class="secondary-actions">
                        <Button 
                            v-if="isAdmin"
                            type="button" 
                            label="Edit" 
                            class="no-underline"
                            @click="$router.push(`/rooms/${room._id}/edit`)"
                        />
                        <Button 
                            type="button" 
                            label="Back" 
                            class="no-underline"
                            @click="router.go(-1)"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.room-details-container {
    padding: 30px;
    max-width: 1200px;
    margin: 0 auto;
    background-color: #f8f9fa;
    min-height: calc(100vh - 100px);
}

.room-details-card {
    display: flex;
    background: white;
    border-radius: 16px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.room-image-section {
    position: relative;
    width: 45%;
    overflow: hidden;
}

.room-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.room-image:hover {
    transform: scale(1.05);
}

.room-badge, .room-category-badge {
    position: absolute;
    padding: 8px 16px;
    border-radius: 30px;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.room-badge {
    top: 20px;
    left: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
}

.room-category-badge {
    top: 20px;
    right: 20px;
    background-color: rgba(70, 130, 180, 0.8);
    color: white;
}

.room-info-section {
    width: 55%;
    padding: 40px;
}

.room-header {
    margin-bottom: 20px;
}

.room-name {
    font-size: 2.5rem;
    font-weight: 700;
    color: #333;
    margin: 0 0 10px 0;
}

.room-location {
    font-size: 1.1rem;
    color: #666;
    display: flex;
    align-items: center;
    margin: 0;
}

.room-divider {
    height: 1px;
    background-color: #eaeaea;
    margin: 25px 0;
}

.room-highlights {
    display: flex;
    justify-content: space-between;
    margin: 30px 0;
}

.highlight-item {
    display: flex;
    align-items: center;
    flex: 1;
    margin-right: 20px;
}

.highlight-icon {
    width: 50px;
    height: 50px;
    background-color: #f0f7ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #4682b4;
    margin-right: 15px;
}

.highlight-text {
    display: flex;
    flex-direction: column;
}

.highlight-label {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 3px;
}

.highlight-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
}

.room-description-section h2 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 15px;
}

.room-description-section p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #555;
}

.room-actions {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
}

.book-button {
    width: 100%;
    padding: 15px;
    font-size: 1.2rem;
    font-weight: 600;
    border-radius: 8px;
    margin-bottom: 15px;
    background-color: #4682b4 !important;
    border-color: #4682b4 !important;
    transition: all 0.3s ease;
}

.book-button:hover {
    background-color: #3b6e99 !important;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(70, 130, 180, 0.3);
}

.secondary-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.no-underline {
    text-decoration: none;
}

/* Responsive Styles */
@media (max-width: 992px) {
    .room-details-card {
        flex-direction: column;
    }
    
    .room-image-section, .room-info-section {
        width: 100%;
    }
    
    .room-image-section {
        height: 350px;
    }
}

@media (max-width: 768px) {
    .room-details-container {
        padding: 15px;
    }
    
    .room-info-section {
        padding: 25px;
    }
    
    .room-highlights {
        flex-direction: column;
        gap: 20px;
    }
    
    .highlight-item {
        margin-right: 0;
    }
    
    .room-name {
        font-size: 2rem;
    }
}
</style>
