<script>
import { ref, onMounted, watch, computed } from 'vue';
// import DatePicker from 'vue-datepicker-next';

export default {
    setup() {
        const timeRange = ref([null, null]);

        const generateTimeOptions = () => {
            const options = [];
            for (let hour = 0; hour < 24; hour++) {
                const formattedHour = hour.toString().padStart(2, '0') + ':00';
                options.push(formattedHour);
            }
            return options;
        };

        const timeOptions = ref(generateTimeOptions());

        const handleTimeRangeChange = (event) => {
            const [start, end] = event.target.value.split(' to ');
            if (start && end && start !== end) {
                timeRange.value = [start, end];
            }
        };

        const dateRange = ref([null, null]);
        const today = new Date();
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        const minDate = computed(() => {
            return formatDate(today);
        });

        const maxDate = computed(() => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            return formatDate(futureDate);
        });

        const handleStartDateChange = () => {
            if (dateRange.value[1] && dateRange.value[1] < dateRange.value[0]) {
                dateRange.value[1] = null;
            }
            fetchRoomsByDateRange();
        };

        const handleEndDateChange = () => {
            fetchRoomsByDateRange();
        };

        const fetchRoomsByDateRange = async () => {
            if (dateRange.value[0] && dateRange.value[1]) {
                try {
                    const response = await fetch(`/api/rooms?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch rooms');
                    }
                    rooms.value = await response.json();
                } catch (error) {
                    console.error('Error fetching rooms:', error.message);
                }
            }
        };
        

        // const handleDateRangeChange = (start, end) => {
        //     dateRange.value = [start, end];
        // };

        const roomOptions = ref([
            { label: 'Select All', value: 'select_all', checked: false },
            { label: 'Single room', value: 'Single room', checked: false },
            { label: 'Share room', value: 'Share room', checked: false }
        ]);

        const categoryOptions = ref([
            { label: 'Select All', value: 'select_all', checked: false },
            { label: 'Meeting room', value: 'Meeting room', checked: false },
            { label: 'Conference room', value: 'Conference room', checked: false },
            { label: 'Meeting room II', value: 'Meeting room II', checked: false },
            { label: 'Conference Room II', value: 'Conference Room II', checked: false },
            { label: 'Multimedia Room', value: 'Multimedia Room', checked: false },
            { label: 'Meeting room III', value: 'Meeting room III', checked: false },
        ]);

        const capacityOptions = ref([
            { label: 'Select All', value: 'select_all', checked: false },
            { label: '≥5', value: '≥5', checked: false },
            { label: '≥10', value: '≥10', checked: false },
            { label: '≥20', value: '≥20', checked: false }
        ]);


        const priceOptions = ref([
            { label: 'Select All', value: 'select_all', checked: false },
            { label: '$0 - $100', value: 'below_100', checked: false },
            { label: '$101 - $200', value: '101_to_200', checked: false },
            { label: '$201 - $300', value: '201_to_300', checked: false },
            { label: '$301 or above', value: 'above_301', checked: false }
        ]);

        const availabilityOptions = ref([
            { label: 'Select All', value: 'select_all', checked: false },
            { label: 'Low Availability', value: 'low_availability', checked: false },
            { label: 'High Availability', value: 'high_availability', checked: false },
        ]);


        const toggleRoomSelectAll = () => {
            const selectAllOption = roomOptions.value.find(option => option.value === 'select_all');
            const isChecked = selectAllOption.checked;
            roomOptions.value.forEach(option => {
                option.checked = isChecked;
            });
        };

        const handleRoomOptionChange = (option) => {
            if (option.value === 'select_all') {
                toggleRoomSelectAll();
            } else {
                const allChecked = roomOptions.value.every(opt => opt.value === 'select_all' || opt.checked);
                roomOptions.value.find(opt => opt.value === 'select_all').checked = allChecked;
            }
        };

        const toggleCategorySelectAll = () => {
            const selectAllOption = categoryOptions.value.find(option => option.value === 'select_all');
            const isChecked = selectAllOption.checked;
            categoryOptions.value.forEach(option => {
                option.checked = isChecked;
            });
        };

        const handleCategoryOptionChange = (option) => {
            if (option.value === 'select_all') {
                toggleCategorySelectAll();
            } else {
                const allChecked = categoryOptions.value.every(opt => opt.value === 'select_all' || opt.checked);
                categoryOptions.value.find(opt => opt.value === 'select_all').checked = allChecked;
            }
        };

        const toggleCapacitySelectAll = () => {
            const selectAllOption = capacityOptions.value.find(option => option.value === 'select_all');
            const isChecked = selectAllOption.checked;
            capacityOptions.value.forEach(option => {
                option.checked = isChecked;
            });
        };

        const handleCapacityOptionChange = (option) => {
            if (option.value === 'select_all') {
                toggleCapacitySelectAll();
            } else {
                const allChecked = capacityOptions.value.every(opt => opt.value === 'select_all' || opt.checked);
                capacityOptions.value.find(opt => opt.value === 'select_all').checked = allChecked;
            }
        };

        const togglePriceSelectAll = () => {
            const selectAllOption = priceOptions.value.find(option => option.value === 'select_all');
            const isChecked = selectAllOption.checked;
            priceOptions.value.forEach(option => {
                option.checked = isChecked;
            });
        };

        const handlePriceOptionChange = (option) => {
            if (option.value === 'select_all') {
                togglePriceSelectAll();
            } else {
                const allChecked = priceOptions.value.every(opt => opt.value === 'select_all' || opt.checked);
                priceOptions.value.find(opt => opt.value === 'select_all').checked = allChecked;
            }
        };

        const toggleAvailabilitySelectAll = () => {
            const selectAllOption = availabilityOptions.value.find(option => option.value === 'select_all');
            const isChecked = selectAllOption.checked;
            availabilityOptions.value.forEach(option => {
                option.checked = isChecked;
            });
        };

        const handleAvailabilityOptionChange = (option) => {
            if (option.value === 'select_all') {
                toggleAvailabilitySelectAll();
            } else {
                const allChecked = availabilityOptions.value.every(opt => opt.value === 'select_all' || opt.checked);
                availabilityOptions.value.find(opt => opt.value === 'select_all').checked = allChecked;
            }
        };

        const searchQuery = ref('');
        const rooms = ref([]);

        let searchDebounceTimeout;

        watch(searchQuery, (newQuery) => {
            // Add debounce to prevent too many API calls
            if (searchDebounceTimeout) {
                clearTimeout(searchDebounceTimeout);
            }
            searchDebounceTimeout = setTimeout(() => {
                const query = newQuery ? `?name=${encodeURIComponent(newQuery)}` : '';
                fetchRooms(query);
            }, 10); // Wait 10ms after user stops typing
        });



        const fetchRooms = async (query = '') => {
            try {
                const response = await fetch(`/api/rooms${query}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch rooms');
                }
                rooms.value = await response.json();
            } catch (error) {
                console.error('Error fetching rooms:', error.message);
            }
        };

        const filteredRooms = computed(() => {
            return rooms.value.filter(room => {
                // Get selected options (excluding 'select_all')
                const selectedRoomTypes = roomOptions.value
                    .filter(opt => opt.checked && opt.value !== 'select_all')
                    .map(opt => opt.value);

                const selectedCategories = categoryOptions.value
                    .filter(opt => opt.checked && opt.value !== 'select_all')
                    .map(opt => opt.value);

                const selectedCapacities = capacityOptions.value
                    .filter(opt => opt.checked && opt.value !== 'select_all')
                    .map(opt => opt.value);

                // const selectedParticipants = participantOptions.value
                //     .filter(opt => opt.checked && opt.value !== 'select_all')
                //     .map(opt => opt.value);

                const selectedPrices = priceOptions.value
                    .filter(opt => opt.checked && opt.value !== 'select_all')
                    .map(opt => opt.value);

                const selectedAvailability = availabilityOptions.value
                    .filter(opt => opt.checked && opt.value !== 'select_all')
                    .map(opt => opt.value);

                // If no options are selected in a category, don't filter for that category
                const matchesRoomType = selectedRoomTypes.length === 0 ||
                    selectedRoomTypes.some(type => type.toLowerCase().trim() === room.type.toLowerCase().trim());

                const matchesCategory = selectedCategories.length === 0 ||
                    selectedCategories.includes(room.category);

                const matchesCapacity = selectedCapacities.length === 0 ||
                    checkCapacity(selectedCapacities, room.capacity);

                // const matchesParticipants = selectedParticipants.length === 0 || 
                //     checkParticipants(selectedParticipants, room.maxParticipants);

                const matchesPrice = selectedPrices.length === 0 ||
                    checkPrice(selectedPrices, room.price);

                const matchesAvailability = selectedAvailability.length === 0 ||
                    checkAvailability(selectedAvailability, room.availability);

                // Search query filter
                const matchesSearch = !searchQuery.value ||
                    room.name.toLowerCase().includes(searchQuery.value.toLowerCase());

                return matchesRoomType &&
                    matchesCategory &&
                    matchesCapacity &&
                    //    matchesParticipants && 
                    matchesPrice &&
                    matchesAvailability &&
                    matchesSearch;
            });
        });

        const currentPage = ref(1);
        const itemsPerPage = 6;

        const paginatedRooms = computed(() => {
            const startIndex = (currentPage.value - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            return filteredRooms.value.slice(startIndex, endIndex);
        });

        const totalPages = computed(() => {
            return Math.ceil(filteredRooms.value.length / itemsPerPage);
        });

        const handlePageChange = (page) => {
            currentPage.value = page;
        };

        const getPageNumbers = computed(() => {
            const pages = [];
            for (let i = 1; i <= totalPages.value; i++) {
                pages.push(i);
            }
            return pages;
        });




        // Helper functions for checking ranges
        const checkCapacity = (selectedCapacities, roomCapacity) => {
            return selectedCapacities.some(capacity => {
                switch (capacity) {
                    case '≥5': return roomCapacity >= 5;
                    case '≥10': return roomCapacity >= 10;
                    case '≥20': return roomCapacity >= 20;
                    default: return false;
                }
            });
        };

        const checkPrice = (selectedPrices, price) => {
            return selectedPrices.some(range => {
                switch (range) {
                    case 'below_100': return price <= 100;
                    case '101_to_200': return price > 100 && price <= 200;
                    case '201_to_300': return price > 200 && price <= 300;
                    case 'above_301': return price > 300;
                    default: return false;
                }
            });
        };

        const checkAvailability = (selectedAvailability, availability) => {
            return selectedAvailability.some(status => {
                switch (status) {
                    case 'low_availability': return availability < 50;
                    case 'high_availability': return availability >= 50;
                    default: return false;
                }
            });
        };

        // Add watchers for filter changes
        watch([
            roomOptions,
            categoryOptions,
            capacityOptions,
            // participantOptions,
            priceOptions,
            availabilityOptions
        ], () => {
            currentPage.value = 1;
            fetchRooms();
        }, { deep: true });




        onMounted(() => {
            fetchRooms();
        });


        return {
            dateRange,
            minDate,
            maxDate,
            handleStartDateChange,
            handleEndDateChange,
            fetchRoomsByDateRange,
            timeRange,
            timeOptions,
            roomOptions,
            categoryOptions,
            capacityOptions,
            // participantOptions,
            priceOptions,
            availabilityOptions,
            handleTimeRangeChange,
            handleRoomOptionChange,
            handleCategoryOptionChange,
            handleCapacityOptionChange,
            // handleParticipantOptionChange,
            handlePriceOptionChange,
            handleAvailabilityOptionChange,
            // handleSearch,
            searchQuery,
            rooms,
            filteredRooms,
            currentPage,
            paginatedRooms,
            totalPages,
            handlePageChange,
            getPageNumbers
        };
    }
};
</script>

<template>
    <div class="container mt-5">
        <div class="text-center mb-4">
            <h1>Book for all desires</h1>
        </div>

        <div class="row mb-2">
            <div class="col-md-6">
                <label class="form-label">Date Range:</label>
            </div>
            <div class="col-md-6">
                <label class="form-label">Time Range:</label>
            </div>
        </div>

        <div class="row mb-3">
            <!-- Date Range -->
            <!-- <div class="col-md-6">
                <div class="d-flex align-items-center">
                    <input type="date" class="form-control" v-model="dateRange[0]" @change="fetchRoomsByDateRange" :max="new Date().toISOString().split('T')[0]" />
                    <span class="mx-2">to</span>
                    <input type="date" class="form-control" v-model="dateRange[1]" @change="fetchRoomsByDateRange" />
                </div>
            </div> -->

            <div class="col-md-6">
                <div class="d-flex align-items-center">
                    <input 
                        type="date" 
                        class="form-control" 
                        v-model="dateRange[0]" 
                        :min="minDate"
                        :max="maxDate"
                        @change="handleStartDateChange"
                    />
                    <span class="mx-2">to</span>
                    <input 
                        type="date" 
                        class="form-control" 
                        v-model="dateRange[1]" 
                        :min="dateRange[0] || minDate"
                        :max="maxDate"
                        :disabled="!dateRange[0]"
                        @change="handleEndDateChange"
                    />
                </div>
            </div>

            <!-- Time Range -->
            <div class="col-md-6">
                <div class="d-flex align-items-center">
                    <select v-model="timeRange[0]" class="form-control">
                        <option v-for="time in timeOptions" :key="time" :value="time">
                            {{ time }}
                        </option>
                    </select>
                    <span class="mx-2">to</span>
                    <select v-model="timeRange[1]" class="form-control">
                        <option v-for="time in timeOptions" :key="time" :value="time">
                            {{ time }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-6 col-md-4 col-lg-2">
            <label class="form-label">Room Type Options:</label>
            <div class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                data-bs-toggle="dropdown" aria-expanded="false">
                {{ roomOptions.filter(option => option.checked && option.value !== 'select_all').map(option => option.label).join(', ') || 'Select Room Options' }}
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                <li v-for="option in roomOptions" :key="option.value" class="dropdown-item">
                    <div class="form-check">
                    <input type="checkbox" class="form-check-input" :id="option.value"
                        v-model="option.checked" @change="handleRoomOptionChange(option)">
                    <label class="form-check-label">{{ option.label }}</label>
                    </div>
                </li>
                    </ul>
                </div>
            </div>
            <div class="col-6 col-md-4 col-lg-3">
                <label class="form-label">Category Options:</label>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButtonCategory"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        {{ categoryOptions.filter(option => option.checked && option.value !== 'select_all').map(option => option.label).join(', ') || 'Select Category Options' }}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButtonCategory">
                        <li v-for="option in categoryOptions" :key="option.value" class="dropdown-item">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" :id="option.value"
                                    v-model="option.checked" @change="handleCategoryOptionChange(option)">
                                <label class="form-check-label">{{ option.label }}</label>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-6 col-md-4 col-lg-2">
                <label class="form-label">Capacity Options:</label>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButtonCapacity"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        {{ capacityOptions.filter(option => option.checked && option.value !== 'select_all').map(option => option.label).join(', ') || 'Select Capacity Options' }}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButtonCapacity">
                        <li v-for="option in capacityOptions" :key="option.value" class="dropdown-item">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" :id="option.value"
                                    v-model="option.checked" @change="handleCapacityOptionChange(option)">
                                <label class="form-check-label">{{ option.label }}</label>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-6 col-md-4 col-lg-3">
                <label class="form-label">Price Options:</label>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButtonPrice"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        {{ priceOptions.filter(option => option.checked && option.value !== 'select_all').map(option => option.label).join(', ') || 'Select Price Options' }}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButtonPrice">
                        <li v-for="option in priceOptions" :key="option.value" class="dropdown-item">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" :id="option.value"
                                    v-model="option.checked" @change="handlePriceOptionChange(option)">
                                <label class="form-check-label">{{ option.label }}</label>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-6 col-md-4 col-lg-2">
                <label class="form-label">Availability Options:</label>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButtonAvailability"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        {{ availabilityOptions.filter(option => option.checked && option.value !== 'select_all').map(option => option.label).join(', ') || 'Select Availability Options' }}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButtonAvailability">
                        <li v-for="option in availabilityOptions" :key="option.value" class="dropdown-item">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" :id="option.value"
                                    v-model="option.checked" @change="handleAvailabilityOptionChange(option)">
                                <label class="form-check-label">{{ option.label }}</label>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="row mt-3">
            <div class="col-12">
            <div class="input-group">
                <input type="text" v-model="searchQuery" class="form-control" placeholder="Search keyword" />
                <button class="btn btn-primary" @click="fetchRooms">Search</button>
            </div>
            </div>
        </div>

        <div class="row mt-3">
            <div class="col-12">

                <div class="row">
                    <div class="col-md-4 mb-4" v-for="room in paginatedRooms" :key="room._id">
                        <div class="card h-200">
                            <img v-if="room.imageUrl" :src="room.imageUrl" :alt="room.name" class="room-image"
                                @error="handleImageError" />
                            <div class="card-body">
                                <h5 class="card-title font-weight-bold">{{ room.name }}</h5>
                                <p class="card-description">{{ room.description }}</p>
                                <p class="card-text"><strong>Price:</strong> {{ room.price }}</p>
                                <a :href="`/roomdetails/${room._id}`">
                                    <button id="Edit" class="btn btn-primary">More Details</button>
                                </a>
                                <a :href="`/bookings/book/${room._id}`">
                                    <button id="Edit" class="btn btn-success">Book Now!</button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <nav v-if="totalPages > 1" aria-label="Page navigation" class="mt-4">
                    <ul class="pagination justify-content-center">
                        <!-- Previous button -->
                        <li class="page-item" :class="{ disabled: currentPage === 1 }">
                            <button class="page-link" 
                                    @click="handlePageChange(currentPage - 1)"
                                    :disabled="currentPage === 1">
                                Previous
                            </button>
                        </li>

                        <!-- Page numbers -->
                        <li v-for="page in getPageNumbers" 
                            :key="page" 
                            class="page-item"
                            :class="{ active: currentPage === page }">
                            <button class="page-link" @click="handlePageChange(page)">
                                {{ page }}
                            </button>
                        </li>

                        <!-- Next button -->
                        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                            <button class="page-link" 
                                    @click="handlePageChange(currentPage + 1)"
                                    :disabled="currentPage === totalPages">
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
</template>

<style scoped>
.room-image {
    height: 200px;
    width: 100%;
    object-fit: cover;
}

.card-description {
    height: 100px;
    overflow: auto;
}

.pagination {
    margin-bottom: 2rem;
}

.page-link {
    color: #333;
    border-color: #dee2e6;
}

.page-item.active .page-link {
    background-color: #007bff;
    border-color: #007bff;
    color: white;
}

.page-item.disabled .page-link {
    color: #6c757d;
    pointer-events: none;
    background-color: #fff;
    border-color: #dee2e6;
}
</style>