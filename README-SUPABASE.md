# 📋 Guía Completa: Conectar tu Barbería con Supabase

## Paso 1: Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y regístrate (gratis)
2. Haz clic en **"New Project"**
3. Completa los datos:
   - **Name**: `barberia-cubana` (o el nombre que quieras)
   - **Database Password**: Guarda esta contraseña en un lugar seguro
   - **Region**: Elige la más cercana a Cuba (us-east-1 o similar)
4. Haz clic en **"Create new project"**
5. Espera 2-3 minutos mientras se crea tu proyecto

---

## Paso 2: Ejecutar el script SQL

1. En tu dashboard de Supabase, ve a **SQL Editor** (en el menú izquierdo)
2. Haz clic en **"New query"**
3. Copia TODO el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor
5. Haz clic en **"Run"** (o presiona Ctrl+Enter)
6. Deberías ver mensajes de éxito para cada tabla creada

### Verificar que las tablas se crearon:
- Ve a **Table Editor** en el menú izquierdo
- Deberías ver 3 tablas: `services`, `business_config`, `appointments`

---

## Paso 3: Obtir credenciales de API

1. Ve a **Settings** (engranaje en la parte inferior izquierda)
2. Haz clic en **API**
3. Copia estos dos valores:
   - **Project URL**: Se ve como `https://xxxxx.supabase.co`
   - **anon/public key**: Una cadena larga que empieza con `eyJ...`

⚠️ **IMPORTANTE**: NO uses la `service_role key` en el frontend (es secreta)

---

## Paso 4: Configurar tu aplicación

Abre el archivo `index.html` y busca estas líneas:

```javascript
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';
```

Reemplaza con tus valores reales:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Guarda el archivo.

---

## Paso 5: Probar localmente

1. Abre `index.html` en tu navegador
2. Deberías ver una alerta de "Conexión exitosa" en la consola (F12)
3. Prueba editar servicios desde el panel de admin
4. Los cambios deberían guardarse en Supabase

---

## Paso 6: Subir a Cloudflare Pages

### Opción A: Con GitHub (recomendado)

1. **Sube tu código a GitHub:**
   ```bash
   cd /workspace
   git init
   git add .
   git commit -m "Configuración con Supabase"
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```

2. **Conecta con Cloudflare Pages:**
   - Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
   - Workers & Pages → Create Application → Pages
   - Connect to Git → Selecciona tu repositorio
   - **Build command**: Déjalo vacío
   - **Build output directory**: Déjalo vacío o pon `.`
   - Save and Deploy

### Opción B: Upload manual

1. Comprime los archivos en un ZIP
2. En Cloudflare Pages, usa "Direct Upload"
3. Sube el ZIP

---

## Paso 7: Variables de entorno en Cloudflare (opcional)

Si quieres ocultar las credenciales:

1. En Cloudflare Pages, ve a tu proyecto
2. Settings → Environment variables
3. Agrega:
   - `SUPABASE_URL` = tu URL
   - `SUPABASE_ANON_KEY` = tu key
4. Redeploy

Luego modifica `index.html` para leer de variables de entorno (requiere build process).

---

## ✅ Verificación final

1. **Panel de Admin**: 
   - Entra a `/index.html#admin`
   - Contraseña: `admin123`
   - Edita un servicio
   - Verifica en Supabase Table Editor que el cambio se reflejó

2. **Reserva de citas**:
   - Llena el formulario de reserva
   - Debería abrir WhatsApp con los datos
   - Verifica en Supabase que la cita se guardó en `appointments`

3. **Configuración del negocio**:
   - Cambia el número de WhatsApp desde el admin
   - Verifica que se actualizó en `business_config`

---

## 🔒 Seguridad importante

### Para producción, deberías:

1. **Habilitar autenticación real**:
   ```sql
   -- En SQL Editor de Supabase
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
   
   Luego ve a Authentication → Providers → Email y habilítalo

2. **Mejorar RLS policies**:
   - Las políticas actuales permiten lectura pública
   - Para mayor seguridad, requiere autenticación para todo

3. **Ocultar contraseña de admin**:
   - Actualmente está hardcodeada en `app.js`
   - Para producción, usa Supabase Auth con email/password

---

## 🆘 Solución de problemas

### Error: "Supabase no está configurado"
- Verifica que copiaste correctamente las credenciales
- Asegúrate de que la URL empieza con `https://`
- Revisa que la key sea la `anon` no la `service_role`

### Error: "permission denied for table"
- Ejecuta nuevamente el script SQL para crear las políticas RLS
- Verifica en Database → Policies que existan las 6 políticas

### Los datos no se guardan
- Abre la consola del navegador (F12)
- Busca errores rojos
- Verifica en Supabase Logs si hay errores

### Error CORS
- Asegúrate de usar la URL correcta de Supabase
- Las keys anon están diseñadas para uso en frontend

---

## 📊 Estructura de la base de datos

### Tabla: services
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | BIGINT | ID único (autoincremental) |
| name | VARCHAR | Nombre del servicio |
| price | INTEGER | Precio en CUP |
| duration | INTEGER | Duración en minutos |
| description | TEXT | Descripción opcional |
| active | BOOLEAN | Si está disponible |
| created_at | TIMESTAMP | Fecha creación |
| updated_at | TIMESTAMP | Última actualización |

### Tabla: business_config
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | BIGINT | ID único |
| whatsapp_number | VARCHAR | Número de WhatsApp |
| barber_name | VARCHAR | Nombre del negocio |
| address | TEXT | Dirección física |
| currency | VARCHAR | Moneda (CUP) |
| updated_at | TIMESTAMP | Última actualización |

### Tabla: appointments
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | BIGINT | ID único |
| customer_name | VARCHAR | Nombre del cliente |
| customer_phone | VARCHAR | Teléfono |
| appointment_date | DATE | Fecha de la cita |
| appointment_time | VARCHAR | Hora |
| services | JSONB | Lista de servicios |
| total_price | INTEGER | Total a pagar |
| status | VARCHAR | Estado (pending/confirmed/cancelled) |
| created_at | TIMESTAMP | Fecha creación |

---

## 🎉 ¡Listo!

Tu barbería ahora tiene:
- ✅ Base de datos en la nube
- ✅ Datos persistentes entre dispositivos
- ✅ Panel de administración funcional
- ✅ Reservas por WhatsApp
- ✅ Hosting gratuito en Cloudflare Pages

¿Necesitas ayuda adicional? ¡Avísame!
