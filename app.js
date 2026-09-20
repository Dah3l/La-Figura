// Default Services Data
const defaultServices = [
    { id: 1, name: 'Corte Clásico', price: 150, duration: 30, icon: '✂️' },
    { id: 2, name: 'Corte Moderno', price: 200, duration: 40, icon: '🎨' },
    { id: 3, name: 'Afeitado Tradicional', price: 100, duration: 20, icon: '🪒' },
    { id: 4, name: 'Barba Completa', price: 120, duration: 25, icon: '🧔' },
    { id: 5, name: 'Corte + Barba', price: 250, duration: 50, icon: '💯' },
    { id: 6, name: 'Peinado', price: 80, duration: 15, icon: '💈' }
];

// Default Barber Info
const defaultBarberInfo = {
    whatsappNumber: '+5355555555',
    barberName: 'Barbería Cubana',
    address: 'La Habana, Cuba'
};

// Admin password (in production, this should be server-side)
const ADMIN_PASSWORD = 'admin123';

// State Management
let services = [];
let barberInfo = {};
let isAdminLoggedIn = false;
let editingServiceId = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderServices();
    renderBookingServices();
    setupEventListeners();
    setMinDate();
});

// Load data from localStorage
function loadData() {
    const savedServices = localStorage.getItem('barberServices');
    const savedBarberInfo = localStorage.getItem('barberInfo');

    if (savedServices) {
        services = JSON.parse(savedServices);
    } else {
        services = [...defaultServices];
        saveServices();
    }

    if (savedBarberInfo) {
        barberInfo = JSON.parse(savedBarberInfo);
    } else {
        barberInfo = { ...defaultBarberInfo };
        saveBarberInfo();
    }

    // Populate barber info form
    document.getElementById('whatsappNumber').value = barberInfo.whatsappNumber;
    document.getElementById('barberName').value = barberInfo.barberName;
    document.getElementById('barberAddress').value = barberInfo.address;
}

// Save services to localStorage
function saveServices() {
    localStorage.setItem('barberServices', JSON.stringify(services));
}

// Save barber info to localStorage
function saveBarberInfo() {
    localStorage.setItem('barberInfo', JSON.stringify(barberInfo));
}

// Render services on the main page
function renderServices() {
    const container = document.getElementById('servicesContainer');
    container.innerHTML = '';

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="service-icon">${service.icon || '✂️'}</div>
            <h3>${service.name}</h3>
            <div class="price">$${service.price} CUP</div>
            <div class="duration">${service.duration} minutos</div>
        `;
        container.appendChild(card);
    });
}

// Render services checkboxes in booking form
function renderBookingServices() {
    const container = document.getElementById('bookingServices');
    container.innerHTML = '';

    services.forEach(service => {
        const item = document.createElement('div');
        item.className = 'service-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" id="service_${service.id}" value="${service.id}" data-price="${service.price}">
            <label for="service_${service.id}">${service.name} - $${service.price} CUP</label>
        `;
        container.appendChild(item);
    });

    // Add event listeners to checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalPrice);
    });
}

// Update total price when services are selected
function updateTotalPrice() {
    let total = 0;
    document.querySelectorAll('#bookingServices input[type="checkbox"]:checked').forEach(checkbox => {
        total += parseFloat(checkbox.dataset.price);
    });
    document.getElementById('totalPrice').textContent = `$${total} CUP`;
}

// Set minimum date to today
function setMinDate() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Setup Event Listeners
function setupEventListeners() {
    // Booking form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);

    // Admin login
    document.getElementById('loginForm').addEventListener('submit', handleAdminLogin);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Service form submission
    document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);

    // Cancel edit
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);

    // Barber info form
    document.getElementById('barberInfoForm').addEventListener('submit', handleBarberInfoSubmit);

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Handle booking form submission
function handleBooking(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    // Get selected services
    const selectedServices = [];
    let total = 0;
    document.querySelectorAll('#bookingServices input[type="checkbox"]:checked').forEach(checkbox => {
        const service = services.find(s => s.id == checkbox.value);
        if (service) {
            selectedServices.push(service.name);
            total += service.price;
        }
    });

    if (selectedServices.length === 0) {
        alert('Por favor, selecciona al menos un servicio.');
        return;
    }

    // Format date for display
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Create WhatsApp message
    const message = `👋 Hola, quiero reservar una cita:%0A%0A` +
                    `👤 *Nombre:* ${name}%0A` +
                    `📞 *Teléfono:* ${phone}%0A` +
                    `📅 *Fecha:* ${formattedDate}%0A` +
                    `⏰ *Hora:* ${time}%0A` +
                    `✂️ *Servicios:* ${selectedServices.join(', ')}%0A` +
                    `💰 *Total:* $${total} CUP%0A%0A` +
                    `¡Espero confirmación. Gracias!`;

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${barberInfo.whatsappNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault();

    const password = document.getElementById('adminPassword').value;

    if (password === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        renderAdminServices();
        
        // Clear password field
        document.getElementById('adminPassword').value = '';
    } else {
        alert('Contraseña incorrecta. Por favor intenta de nuevo.');
    }
}

// Handle logout
function handleLogout() {
    isAdminLoggedIn = false;
    editingServiceId = null;
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('serviceForm').reset();
    document.getElementById('cancelEdit').style.display = 'none';
}

// Render admin services table
function renderAdminServices() {
    const tbody = document.getElementById('adminServicesList');
    tbody.innerHTML = '';

    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service.icon || '✂️'} ${service.name}</td>
            <td>$${service.price} CUP</td>
            <td>${service.duration} min</td>
            <td>
                <button class="action-btn btn-edit" onclick="editService(${service.id})">Editar</button>
                <button class="action-btn btn-delete" onclick="deleteService(${service.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Edit service
window.editService = function(id) {
    const service = services.find(s => s.id === id);
    if (service) {
        editingServiceId = id;
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name;
        document.getElementById('servicePrice').value = service.price;
        document.getElementById('serviceDuration').value = service.duration;
        
        document.getElementById('cancelEdit').style.display = 'inline-block';
        document.querySelector('.service-form button[type="submit"]').textContent = 'Actualizar Servicio';
        
        // Scroll to form
        document.getElementById('serviceForm').scrollIntoView({ behavior: 'smooth' });
    }
};

// Delete service
window.deleteService = function(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
        services = services.filter(s => s.id !== id);
        saveServices();
        renderAdminServices();
        renderServices();
        renderBookingServices();
    }
};

// Handle service form submission
function handleServiceSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('serviceName').value.trim();
    const price = parseFloat(document.getElementById('servicePrice').value);
    const duration = parseInt(document.getElementById('serviceDuration').value) || 30;

    if (editingServiceId) {
        // Update existing service
        const serviceIndex = services.findIndex(s => s.id === editingServiceId);
        if (serviceIndex !== -1) {
            services[serviceIndex] = {
                ...services[serviceIndex],
                name,
                price,
                duration
            };
        }
        editingServiceId = null;
        document.getElementById('cancelEdit').style.display = 'none';
        document.querySelector('.service-form button[type="submit"]').textContent = 'Guardar Servicio';
    } else {
        // Add new service
        const icons = ['✂️', '🎨', '🪒', '🧔', '💯', '💈', '👨‍🦱', '✨'];
        const newService = {
            id: Date.now(),
            name,
            price,
            duration,
            icon: icons[Math.floor(Math.random() * icons.length)]
        };
        services.push(newService);
    }

    saveServices();
    renderAdminServices();
    renderServices();
    renderBookingServices();
    
    document.getElementById('serviceForm').reset();
    alert('Servicio guardado exitosamente.');
}

// Cancel edit
function cancelEdit() {
    editingServiceId = null;
    document.getElementById('serviceForm').reset();
    document.getElementById('cancelEdit').style.display = 'none';
    document.querySelector('.service-form button[type="submit"]').textContent = 'Guardar Servicio';
}

// Handle barber info submission
function handleBarberInfoSubmit(e) {
    e.preventDefault();

    barberInfo.whatsappNumber = document.getElementById('whatsappNumber').value.trim();
    barberInfo.barberName = document.getElementById('barberName').value.trim();
    barberInfo.address = document.getElementById('barberAddress').value.trim();

    saveBarberInfo();
    
    // Update logo if barber name changed
    document.querySelector('.logo h1').textContent = `✂️ ${barberInfo.barberName}`;
    
    alert('Información actualizada exitosamente.');
}

// Make functions globally available
window.renderAdminServices = renderAdminServices;
