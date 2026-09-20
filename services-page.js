// services-page.js - Lógica para la página de servicios

document.addEventListener('DOMContentLoaded', () => {
    loadAllServices();
});

async function loadAllServices() {
    const container = document.getElementById('services-list');
    
    try {
        // Obtener todos los servicios activos ordenados por position o price
        const { data, error } = await db.from('services')
            .select('*')
            .eq('is_active', true)
            .order('position', { ascending: true, nullsFirst: false });
        
        if (error) throw error;
        
        // Ordenar en el cliente si es necesario
        let services = data || [];
        services = services.sort((a, b) => {
            if (a.position === null && b.position === null) return a.price - b.price;
            if (a.position === null) return 1;
            if (b.position === null) return -1;
            return a.position - b.position;
        });
        
        if (services.length > 0) {
            container.innerHTML = services.map(service => `
                <div class="service-card">
                    ${service.image_url ? `<img src="${escapeHtml(service.image_url)}" alt="${escapeHtml(service.name)}" class="service-image" loading="lazy" onerror="this.style.display='none'">` : ''}
                    <h3>${escapeHtml(service.name)}</h3>
                    <p class="service-price">${service.price} CUP</p>
                    <p class="service-duration">⏱️ ${service.duration} min</p>
                    ${service.description ? `<p class="service-desc">${escapeHtml(service.description)}</p>` : ''}
                    <a href="booking.html" class="btn btn-sm btn-primary">Reservar este servicio</a>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted">No hay servicios disponibles en este momento.</p>';
        }
    } catch (error) {
        console.error('Error cargando servicios:', error);
        container.innerHTML = '<p class="error-msg">Error al cargar servicios. Verifica la conexión con Supabase.</p>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
