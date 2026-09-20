// home.js - Lógica específica para la página de inicio

document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedServices();
    loadBusinessInfo();
});

// Cargar servicios destacados (primeros 3)
async function loadFeaturedServices() {
    const container = document.getElementById('featured-services');
    
    try {
        // Obtener servicios activos ordenados por position/price
        const { data, error } = await db.from('services')
            .select('*')
            .eq('is_active', true)
            .order('position', { ascending: true, nullsFirst: false })
            .limit(3);
        
        if (error) throw error;
        
        // Ordenar en cliente si es necesario
        let services = data || [];
        services = services.sort((a, b) => {
            if (a.position === null && b.position === null) return a.price - b.price;
            if (a.position === null) return 1;
            if (b.position === null) return -1;
            return a.position - b.position;
        }).slice(0, 3);
        
        if (services.length > 0) {
            container.innerHTML = services.map(service => `
                <div class="service-card">
                    ${service.image_url ? `<img src="${escapeHtml(service.image_url)}" alt="${escapeHtml(service.name)}" class="service-image" loading="lazy" onerror="this.style.display='none'">` : ''}
                    <h3>${escapeHtml(service.name)}</h3>
                    <p class="service-price">${service.price} CUP</p>
                    <p class="service-duration">⏱️ ${service.duration} min</p>
                    ${service.description ? `<p class="service-desc">${escapeHtml(service.description)}</p>` : ''}
                    <a href="booking.html" class="btn btn-sm btn-outline">Reservar</a>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted">No hay servicios disponibles</p>';
        }
    } catch (error) {
        console.error('Error cargando servicios:', error);
        container.innerHTML = '<p class="error-msg">Error al cargar servicios. Verifica la conexión.</p>';
    }
}

// Cargar información del negocio
async function loadBusinessInfo() {
    try {
        const { data, error } = await db.from('business_config').select('*').single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            if (data.business_name) {
                document.querySelector('.logo').textContent = data.business_name.toUpperCase();
                document.title = `${data.business_name} - Barbería Cuba`;
            }
            if (data.address) {
                document.getElementById('info-address').textContent = data.address;
            }
            if (data.phone) {
                document.getElementById('info-phone').textContent = `+53 ${data.phone}`;
            }
        } else {
            // Valores por defecto
            document.getElementById('info-address').textContent = 'La Habana, Cuba';
            document.getElementById('info-phone').textContent = '+53 5XXX XXXX';
        }
    } catch (error) {
        console.error('Error cargando info del negocio:', error);
        document.getElementById('info-address').textContent = 'La Habana, Cuba';
        document.getElementById('info-phone').textContent = '+53 5XXX XXXX';
    }
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
