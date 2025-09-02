<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

// const searchQuery = ref('');

const rooms = ref([]);
const loading = ref(false);
const deleteDialog = ref(false);
const roomToDelete = ref(null);
const toast = useToast();

// Type options for filter
const types = [
    'Single Room',
    'Share Room',
];

// Category options for filter
const categories = [
    'Meeting room',
    'Conference room',
    'Meeting room II',
    'Conference Room II',
    'Multimedia Room',
    'Meeting room III',
];

// Initialize filters
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    name: { value: null, matchMode: 'contains' },
    type: { value: null, matchMode: 'contains' },
    category: { value: null, matchMode: 'contains' },
});

const clearFilter = () => {
    filters.value = {
        global: { value: null, matchMode: 'contains' },
        name: { value: null, matchMode: 'contains' },
        type: { value: null, matchMode: 'contains' },
        category: { value: null, matchMode: 'contains' },
    };
};

const fetchRooms = async () => {
    try {
        const response = await fetch(`/api/rooms`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch rooms');
        }

        const data = await response.json();
        rooms.value = data;
    } catch (error) {
        console.error('Error fetching rooms:', error.message);
    } finally {
        loading.value = false;
    }
};

const confirmDeleteRoom = (room) => {
    roomToDelete.value = room;
    deleteDialog.value = true;
};

const deleteRoom = async () => {
    if (!roomToDelete.value) return;
    
    try {
        loading.value = true;
        const response = await fetch(`/api/rooms/${roomToDelete.value._id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete room');
        }

        // Remove the room from the list
        rooms.value = rooms.value.filter(room => room._id !== roomToDelete.value._id);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Room ${roomToDelete.value.name} deleted successfully`,
            life: 3000
        });
        
        deleteDialog.value = false;
        roomToDelete.value = null;
    } catch (error) {
        console.error('Error deleting room:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete room',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchRooms();
});

</script>

<template>
<div class="room-info-container">
    <Toast position="top-right" />
    <div class="card">
        <div class="header-section">
            <h1 class="page-title">Room Information Management</h1>
            <p class="page-subtitle">Manage and view all available rooms in the system</p>
        </div>
        <DataTable 
            v-model:filters="filters" 
            :value="rooms" 
            paginator 
            showGridlines 
            :rows="10" 
            dataKey="id"
            filterDisplay="menu" 
            :loading="loading"
            :globalFilterFields="['name','type','category']"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} rooms"
            class="custom-datatable"
        >
            <template #header>
                <div class="flex items-center gap-4 header-controls">
                    <div class="left-controls">
                        <span class="p-input-icon-left search-wrapper">
                            <i class="pi pi-search" />
                            <InputText v-model="filters['global'].value" placeholder="Search rooms..." class="search-input"/>
                        </span>
                        <Button 
                            type="button" 
                            label="Clear Filters" 
                            class="p-button-outlined"
                            @click="clearFilter()"
                        />
                    </div>
                    <div class="right-controls">
                        <Button 
                            type="button" 
                            label="Add New Room" 
                            class="p-button-primary"
                            icon="pi pi-plus"
                            @click="$router.push('/createRoom')"
                        />
                    </div>
                </div>
            </template>

            <template #empty> No room found. </template>
            <template #loading> Loading rooms. Please wait. </template>

            <Column field="index" header="No." style="min-width: 5rem">
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>

            <Column field="name" header="Name" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.name }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText 
                        v-model="filterModel.value" 
                        type="text" 
                        class="p-2 w-full" 
                        placeholder="Search by name"
                    />
                </template>
            </Column>

            <Column field="type" header="Type" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.type }}
                </template>
                <template #filter="{ filterModel }">
                    <Select 
                        v-model="filterModel.value" 
                        :options="types" 
                        placeholder="Select type" 
                        class="p-2 w-full" 
                        :showClear="true"
                    >
                        <template #option="slotProps">
                            <Tag :value="slotProps.option"/>
                        </template>
                    </Select>
                </template>
            </Column>

            <Column field="category" header="Category" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.category }}
                </template>
                <template #filter="{ filterModel }">
                    <Select 
                        v-model="filterModel.value" 
                        :options="categories" 
                        placeholder="Select category" 
                        class="p-2 w-full" 
                        :showClear="true"
                    >
                        <template #option="slotProps">
                            <Tag :value="slotProps.option"/>
                        </template>
                    </Select>
                </template>
            </Column>

            <Column field="capacity" header="Capacity" sortable style="min-width: 10rem"></Column>

            <Column field="price" header="Price" sortable style="min-width: 10rem"></Column>
            

            <Column header="Actions" :exportable="false" style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex gap-4 justify-between">
                        <router-link 
                            :to="`/roomdetails/${slotProps.data._id}`" 
                            class="p-button p-button-primary p-button-sm mr-2"
                        >
                            View
                        </router-link>
                        <Button 
                            type="button" 
                            class="p-button p-button-danger p-button-sm ml-2"
                            @click="confirmDeleteRoom(slotProps.data)"
                        >
                            Delete
                        </Button>
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <Dialog 
        v-model:visible="deleteDialog" 
        header="Confirm Delete" 
        :modal="true"
        :style="{ width: '450px' }" 
        :closable="false"
    >
        <div class="confirmation-content">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span v-if="roomToDelete">Are you sure you want to delete room <b>{{ roomToDelete.name }}</b>?</span>
        </div>
        <template #footer>
            <Button 
                label="No" 
                icon="pi pi-times" 
                class="p-button-text" 
                @click="deleteDialog = false" 
            />
            <Button 
                label="Yes" 
                icon="pi pi-check" 
                class="p-button-danger" 
                @click="deleteRoom" 
                :loading="loading" 
            />
        </template>
    </Dialog>
</div>
</template>

<style scoped>
.room-info-container {
    padding: 2rem;
    background-color: #f8f9fa;
    min-height: calc(100vh - 200px); /* Further reduced height for less empty space */
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

.right-controls {
    flex-shrink: 0;
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
    background-color: #00a316;
    color: #ffffff;
    border-color: #00a316;
    white-space: nowrap;
    min-width: fit-content;
    padding: 0.5rem 1rem;
}

:deep(.p-button-primary:hover) {
    background-color: #90ff96;
    color: #000000;
    border-color: #90ff96;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

:deep(.p-button-primary:focus) {
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

:deep(.p-button-primary.p-button-sm) {
    background-color: #3f65ff;
    border-color: #3f65ff;
    color: rgb(255, 255, 255);
    text-decoration: none;
    padding: 0.4rem 0.8rem;
    margin-right: 3px;
}

/* :deep(.p-button-primary.p-button-sm:hover) {
    background-color: #9ed8ff;
    border-color: #9ed8ff;
    color:#000000;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
} */

:deep(.p-button-primary.p-button-sm:focus) {
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

:deep(.p-button-danger.p-button-sm) {
    background-color: #ff4e4e;
    border-color: #ff4e4e;
    color: rgb(255, 255, 255);
    text-decoration: none;
    padding: 0.4rem 0.8rem;
}

:deep(.p-button-danger.p-button-sm:hover) {
    background-color: #ffafb7;
    border-color: #ffafb7;
    color:#000000;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}

:deep(.p-button-danger.p-button-sm:focus) {
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

:deep(.p-button-outlined) {
    /* Change initial state */
    background-color: transparent !important; 
    color: #346bf6 !important;
    border-color: #346bf6 !important;
    white-space: nowrap;
    min-width: fit-content;
    padding: 0.5rem 1rem;
}

:deep(.p-button-outlined:hover) {
    /* Change hover state */
    background-color: #346bf6 !important;
    color: #ffffff !important;
    border-color: #346bf6 !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(52, 107, 246, 0.2);
}

:deep(.p-button-outlined:focus) {
    box-shadow: 0 0 0 2px rgba(52, 107, 246, 0.2);
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

:deep(.p-dialog) {
    border-radius: 8px;
    background-color: white;
}

:deep(.p-dialog .p-dialog-header) {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    padding: 1rem;
}

:deep(.p-dialog .p-dialog-content) {
    padding: 1.5rem;
    background-color: white;
}

:deep(.p-dialog .p-dialog-footer) {
    border-top: 1px solid #e9ecef;
    padding: 1rem;
    background-color: white;
}

:deep(.search-input) {
    width: 100%;
    min-height: 42px;
}

:deep(.p-button-danger) {
    background-color: #dc3545;
    border-color: #dc3545;
    color: black;
}

:deep(.p-button-danger:hover) {
    background-color: #c82333;
    border-color: #bd2130;
}
</style>