-- ============================================
-- SCRIPT SQL PARA SUPABASE
-- Barbería Cuba - Esquema de Base de Datos
-- ============================================

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: business_config
-- Configuración del negocio (nombre, teléfono, dirección)
-- ============================================
CREATE TABLE IF NOT EXISTS business_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL DEFAULT 'Barbería Cuba',
    phone VARCHAR(20) NOT NULL DEFAULT '5351234567',
    address TEXT NOT NULL DEFAULT 'La Habana, Cuba',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO business_config (business_name, phone, address) 
VALUES ('Barbería Cuba', '5351234567', 'La Habana, Cuba')
ON CONFLICT DO NOTHING;

-- ============================================
-- TABLA: services
-- Servicios de barbería con precios y duración
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- en minutos
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar servicios iniciales de ejemplo
INSERT INTO services (name, price, duration, description) VALUES
('Corte Clásico', 500, 30, 'Corte de cabello tradicional con tijera y máquina'),
('Corte Moderno', 600, 40, 'Corte de cabello con diseño y estilizado'),
('Barba Completa', 400, 25, 'Perfilado y recorte de barba con toalla caliente'),
('Corte + Barba', 800, 50, 'Servicio combinado de corte y arreglo de barba'),
('Afeitado Tradicional', 350, 30, 'Afeitado completo con navaja y productos premium'),
('Diseño Especial', 200, 15, 'Diseños y figuras personalizadas'),
('Corte Niño', 400, 30, 'Corte especializado para niños'),
('Manicure', 300, 20, 'Limpieza y cuidado de uñas'),
('Tratamiento Capilar', 500, 30, 'Hidratación y nutrición del cabello'),
('Servicio VIP', 1500, 90, 'Experiencia completa: corte, barba, manicure y tratamiento')
ON CONFLICT DO NOTHING;

-- ============================================
-- TABLA: appointments
-- Citas/reservas de clientes
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_price INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    barber VARCHAR(100),
    date DATE NOT NULL,
    time TIME NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price ASC);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments(created_at DESC);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: business_config
-- Lectura pública, escritura restringida
-- ============================================
CREATE POLICY "Configuración es de lectura pública" ON business_config
    FOR SELECT USING (true);

CREATE POLICY "Inserción anónima permitida" ON business_config
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Actualización anónima permitida" ON business_config
    FOR UPDATE USING (true);

-- ============================================
-- POLÍTICAS: services
-- Lectura pública, escritura/anulación restringida
-- ============================================
CREATE POLICY "Servicios activos son de lectura pública" ON services
    FOR SELECT USING (active = true OR auth.role() = 'authenticated');

CREATE POLICY "Inserción anónima permitida en servicios" ON services
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Actualización anónima permitida en servicios" ON services
    FOR UPDATE USING (true);

CREATE POLICY "Eliminación anónima permitida en servicios" ON services
    FOR DELETE USING (true);

-- ============================================
-- POLÍTICAS: appointments
-- Los usuarios pueden crear citas, admin puede ver todas
-- ============================================
CREATE POLICY "Crear citas permitido" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin puede ver todas las citas" ON appointments
    FOR SELECT USING (true);

CREATE POLICY "Admin puede actualizar citas" ON appointments
    FOR UPDATE USING (true);

CREATE POLICY "Admin puede eliminar citas" ON appointments
    FOR DELETE USING (true);

-- ============================================
-- TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_business_config_updated_at
    BEFORE UPDATE ON business_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTARIOS EN LAS TABLAS
-- ============================================
COMMENT ON TABLE business_config IS 'Configuración general del negocio de barbería';
COMMENT ON TABLE services IS 'Catálogo de servicios ofrecidos con precios en CUP';
COMMENT ON TABLE appointments IS 'Reservas y citas de clientes';

COMMENT ON COLUMN services.price IS 'Precio del servicio en Pesos Cubanos (CUP)';
COMMENT ON COLUMN services.duration IS 'Duración estimada del servicio en minutos';
COMMENT ON COLUMN appointments.status IS 'Estado: pending, confirmed, cancelled, completed';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
