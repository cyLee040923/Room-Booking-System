<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Select from 'primevue/select';

const bookingRecords = ref([]);
const loading = ref(false);

// Status options for filter
const statuses = [
    'pending payment',
    'pending approval',
    'confirmed'
];

// Initialize filters
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    bookingId: { value: null, matchMode: 'contains' },
    roomName: { value: null, matchMode: 'contains' },
    date: { value: null, matchMode: 'dateIs' },
    status: { value: null, matchMode: 'equals' }
});

const clearFilter = () => {
    filters.value = {
        global: { value: null, matchMode: 'contains' },
        bookingId: { value: null, matchMode: 'contains' },
        roomName: { value: null, matchMode: 'contains' },
        date: { value: null, matchMode: 'dateIs' },
        status: { value: null, matchMode: 'equals' }
    };
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
};

// const getStartTime = (timeslots) => {
//     if (!timeslots || timeslots.length === 0) return '-';
//     return timeslots[0];
// };

// const getEndTime = (timeslots) => {
//     if (!timeslots || timeslots.length === 0) return '-';
//     return timeslots[timeslots.length - 1];
// };

const getStartTime = (timeslots) => {
    if (!timeslots || timeslots.length === 0) return '-';
    // Sort timeslots chronologically
    const sortedSlots = [...timeslots].sort((a, b) => {
        const [hourA] = a.split(':').map(Number);
        const [hourB] = b.split(':').map(Number);
        return hourA - hourB;
    });
    return sortedSlots[0];
}

const getEndTime = (timeslots) => {
    if (!timeslots || timeslots.length === 0) return '-';
    
    // Sort timeslots chronologically
    const sortedSlots = [...timeslots].sort((a, b) => {
        const [hourA] = a.split(':').map(Number);
        const [hourB] = b.split(':').map(Number);
        return hourA - hourB;
    });
    
    const startTime = sortedSlots[sortedSlots.length - 1]; // Get the last timeslot
    const [hour, minute] = startTime.split(':').map(Number); // Split the time into hour and minute
    const endTime = new Date();
    endTime.setHours(hour, minute + 59); // Add 59 minutes to the start time

    return endTime.toTimeString().slice(0, 5); // Format as HH:MM
}


const getStatusSeverity = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending payment':
            return 'danger';
        case 'pending approval':
            return 'warn';
        case 'confirmed':
            return 'success';
        default:
            return null;
    }
};

// const getStatusStyle = (status) => {
//     switch (status?.toLowerCase()) {
//         case 'pending payment':
//             return {
//                 backgroundColor: '#B71C1C', // Darker red color for pending payment
//                 color: '#ffffff'
//             };
//         case 'pending approval':
//             return {
//                 backgroundColor: '#FFA000', // Darker yellow color for pending approval
//                 color: '#ffffff'
//             };
//         case 'confirmed':
//             return {
//                 backgroundColor: '#1B5E20', // Dark green color for confirmed
//                 color: '#ffffff'
//             };
//         default:
//             return {};
//     }
// };

const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending payment':
            return 'danger';
        case 'pending approval':
            return 'warn'
        case 'confirmed':
            return 'success';
        default:
            return {};
    }
};

const fetchBookingRecords = async () => {
    try {
        loading.value = true;
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found. Please log in.');
        }

        const response = await fetch('/api/bookings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        bookingRecords.value = data;
    } catch (error) {
        console.error('Error:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchBookingRecords();
});
</script>

<template>
<div class="room-info-container">
    <div class="card">
        <div class="header-section">
            <h1 class="page-title">Booking Records</h1>
            <p class="page-subtitle">View and manage all booking records</p>
        </div>
        <DataTable 
            v-model:filters="filters" 
            :value="bookingRecords" 
            paginator 
            showGridlines 
            :rows="10" 
            dataKey="id"
            filterDisplay="menu" 
            :loading="loading"
            :globalFilterFields="['bookingId', 'username', 'roomName','date']"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bookings"
            class="custom-datatable"
        >
            <template #header>
                <div class="flex items-center gap-4 header-controls">
                    <div class="left-controls">
                        <span class="p-input-icon-left search-wrapper">
                            <i class="pi pi-search" />
                            <InputText v-model="filters['global'].value" placeholder="Search bookings..." class="search-input"/>
                        </span>
                        <Button 
                            type="button" 
                            label="Clear Filters" 
                            class="p-button-outlined"
                            @click="clearFilter()"
                        />
                    </div>
                </div>
            </template>

            <template #empty> No booking found. </template>
            <template #loading> Loading booking records. Please wait. </template>

            <Column field="index" header="No." style="min-width: 5rem">
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>

            <Column field="_id" header="Booking ID" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data._id }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText 
                        v-model="filterModel.value" 
                        type="text" 
                        class="p-2 w-full" 
                        placeholder="Search booking ID"
                    />
                </template>
            </Column>

            <Column field="userName" header="Username" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.username }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText 
                        v-model="filterModel.value" 
                        type="text" 
                        class="p-2 w-full" 
                        placeholder="Search username"
                    />
                </template>
            </Column>

            <Column field="roomName" header="Room" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.roomName }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText 
                        v-model="filterModel.value" 
                        type="text" 
                        class="p-2 w-full" 
                        placeholder="Search room"
                    />
                </template>
            </Column>

            <Column field="date" header="Date" sortable dataType="date" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ formatDate(data.date) }}
                </template>
                <template #filter="{ filterModel }">
                    <Calendar 
                        v-model="filterModel.value" 
                        dateFormat="dd/mm/yy" 
                        placeholder="Select date" 
                        class="p-2 w-full"
                    />
                </template>
            </Column>

            <Column field="timeslots" header="Start Time" style="min-width: 10rem">
                <template #body="slotProps">
                    {{ getStartTime(slotProps.data.timeslots) }}
                </template>
            </Column>

            <Column field="timeslots" header="End Time" style="min-width: 10rem">
                <template #body="slotProps">
                    {{ getEndTime(slotProps.data.timeslots) }}
                </template>
            </Column>
            
            <Column field="status" header="Status" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="getStatusSeverity(data.status)" :style="getStatusStyle(data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Select 
                        v-model="filterModel.value" 
                        :options="statuses" 
                        placeholder="Select Status" 
                        class="p-2 w-full" 
                        :showClear="true"
                    >
                        <template #option="slotProps">
                            <Tag :value="slotProps.option" :severity="getStatusSeverity(slotProps.option)" :style="getStatusStyle(slotProps.option)" />
                        </template>
                    </Select>
                </template>
            </Column>

            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <router-link 
                        :to="`/bookingHistory/${slotProps.data._id}`" 
                        class="p-button p-button-primary p-button-sm"
                    >
                        View
                    </router-link>
                </template>
            </Column>
        </DataTable>
    </div>
</div>
</template>

<style scoped>
.room-info-container {
    padding: 2rem;
    background-color: #f8f9fa;
    min-height: calc(100vh - 200px);
}

.header-section {
    margin-bottom: 2rem;
    text-align: center;
}

.page-title {
    font-size: 2rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.page-subtitle {
    color: #6c757d;
    font-size: 1.1rem;
}

.header-controls {
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.left-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.search-wrapper {
    width: 400px;
    display: inline-flex;
}

:deep(.custom-datatable) {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    padding: 1rem;
}

:deep(.p-datatable) {
    background-color: white;
}

:deep(.p-datatable .p-datatable-header) {
    background-color: white;
    border: none;
    padding: 1rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background-color: white;
    color: #2c3e50;
    font-weight: 600;
    padding: 1rem;
    border-bottom: 2px solid #e9ecef;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    background-color: white;
    border-bottom: 1px solid #e9ecef;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    background-color: white;
    color: #2c3e50;
    padding: 1rem;
    border-bottom: 1px solid #e9ecef;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background-color: #f8f9fa !important;
}

:deep(.p-button) {
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-weight: 500;
}

:deep(.p-button-primary) {
    background-color: #4CAF50;
    color: #000000;
    border-color: #45a049;
    white-space: nowrap;
    min-width: fit-content;
    padding: 0.5rem 1rem;
}

:deep(.p-button-primary:hover) {
    background-color: #2E7D32;
    color: #000000;
    border-color: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

:deep(.p-button-primary:focus) {
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

:deep(.p-button-primary.p-button-sm) {
    background-color: #bfe5ff;
    border-color: #bfe5ff;
    color: rgb(18, 0, 214);
    text-decoration: none;
    padding: 0.4rem 0.8rem;
}

:deep(.p-button-primary.p-button-sm:hover) {
    background-color: #40aaf0;
    border-color: #40aaf0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

:deep(.p-button-primary.p-button-sm:focus) {
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

:deep(.p-button-outlined) {
    background-color: #4CAF50;
    color: #000000;
    border-color: #45a049;
    white-space: nowrap;
    min-width: fit-content;
    padding: 0.5rem 1rem;
}

:deep(.p-button-outlined:hover) {
    background-color: #2E7D32;
    color: #000000;
    border-color: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

:deep(.p-button-outlined:focus) {
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

:deep(.p-inputtext) {
    border-radius: 6px;
    border: 1px solid #ced4da;
    padding: 0.5rem 1rem;
    background-color: white;
    color: #2c3e50;
}

:deep(.p-input-icon-left) {
    width: 100%;
    display: inline-flex;
}

:deep(.p-input-icon-left i) {
    color: #6c757d;
    font-size: 1.1rem;
    margin-top: 2px;
}

:deep(.p-inputtext:enabled:focus) {
    border-color: #2c3e50;
    box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
    background-color: white;
}

:deep(.p-inputtext:enabled:hover) {
    border-color: #2c3e50;
}

:deep(.p-inputtext::placeholder) {
    color: #6c757d;
}

:deep(.p-paginator) {
    background-color: white;
    border: none;
    padding: 1rem;
    color: #000000;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
    color: #000000;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    background-color: #4CAF50;
    color: #000000;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page:not(.p-highlight):hover) {
    background-color: #f8f9fa;
    color: #000000;
}

:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last) {
    color: #000000;
}

:deep(.p-paginator .p-dropdown-label) {
    color: #000000;
}

:deep(.p-paginator .p-paginator-current) {
    color: #000000;
}

:deep(.search-input) {
    width: 100%;
    min-height: 42px;
}
</style>





