# Guía de Integración: API Backend PolloPOS con la App Móvil

Esta guía contiene la especificación completa de la API REST construida en Node.js, Express y PostgreSQL para conectar la aplicación Android móvil de **Pollo que hace pollo** (PolloPOS).

---

## 1. Configuración de Red y URLs Base

Al desarrollar en Android, la URL base depende del entorno de prueba:

| Entorno de Prueba | URL Base de la API |
| :--- | :--- |
| **Emulador de Android Studio** | `http://10.0.2.2:3000/api/` |
| **Dispositivo Físico por Wi-Fi (Desarrollo)** | `http://<IP_DE_TU_PC>:3000/api/` *(ej. http://192.168.1.15:3000/api/)* |
| **Servidor en Producción (Cloud)** | `https://pollobackend-production.up.railway.app/api/` |

> **Importante para Android:** Si utilizas conexiones HTTP locales en desarrollo (no HTTPS), recuerda agregar en tu `AndroidManifest.xml` del nuevo proyecto:
> ```xml
> android:usesCleartextTraffic="true"
> ```

---

## 2. Autenticación y Manejo de Roles (RBAC)

La API utiliza tokens **JWT (JSON Web Tokens)** con una vigencia de 8 horas.

### Header requerido en peticiones protegidas:
```http
Authorization: Bearer <TOKEN_JWT_AQUI>
```

### Roles del Sistema y Matriz de Permisos:

* **`admin`**: Acceso total al sistema. Puede gestionar personal (crear/editar cajeros y cocineros), configurar sucursales, dar de alta productos y categorías, ver reportes analíticos de horas pico y más vendidos, y cerrar turnos.
* **`cajero`**: Terminal de mostrador. Puede abrir turno con fondo de caja, registrar pedidos, aplicar descuentos (códigos, porcentajes o cortesías), procesar pagos (efectivo, tarjeta, QR, mixto), registrar movimientos de caja chica (egresos por compras e ingresos extra), marcar productos como agotados/disponibles, consultar el estado de pedidos y realizar el arqueo/cierre de caja.
* **`cocina`**: Pantalla KDS (Kitchen Display System). Puede consultar los pedidos en curso (`estado=cocina`), visualizar notas de preparación ("pechuga", "sin ají") y cambiar el estado a `listo` o `entregado`. No tiene acceso a funciones de cobro, reportes financieros ni cierre de caja.

---

## 3. Catálogo de Endpoints de la API

### A. Módulo: Autenticación (`/api/auth`)

#### 1. Iniciar Sesión (Usuario y Contraseña o PIN Rápido)
* **Método:** `POST /api/auth/login`
* **Acceso:** Público
* **Cuerpo JSON (Opción 1 - Credenciales):**
```json
{
  "nombre_usuario": "carlos.caja1",
  "password": "cajero123"
}
```
* **Cuerpo JSON (Opción 2 - PIN Rápido):**
```json
{
  "pin_rapido": "0231"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "usuario": {
    "usuario_id": 2,
    "nombre_usuario": "carlos.caja1",
    "nombre_completo": "Carlos Méndez (Cajero)",
    "sucursal_id": 1,
    "sucursal_nombre": "Sucursal Centro",
    "rol_id": 2,
    "rol_nombre": "cajero"
  },
  "turno_activo": {
    "turno_id": 5,
    "fondo_inicial": 100.00,
    "abierto_en": "2026-09-25T08:00:00.000Z",
    "estado": "abierto"
  }
}
```

#### 2. Consultar Usuario Autenticado
* **Método:** `GET /api/auth/me`
* **Acceso:** Todos los roles autenticados

---

### B. Módulo: Turnos y Arqueo de Caja (`/api/turnos`)

#### 1. Registrar Apertura de Turno (Fondo Inicial)
* **Método:** `POST /api/turnos/abrir`
* **Roles:** `admin`, `cajero`
* **Cuerpo JSON:**
```json
{
  "fondo_inicial": 150.00,
  "sucursal_id": 1
}
```

#### 2. Consultar Turno Activo del Cajero
* **Método:** `GET /api/turnos/activo`
* **Roles:** `admin`, `cajero`

#### 3. Resumen Financiero en Vivo del Turno (Arqueo X)
* **Método:** `GET /api/turnos/activo/resumen`
* **Roles:** `admin`, `cajero`
* **Respuesta:**
```json
{
  "success": true,
  "resumen": {
    "turno_id": 5,
    "cajero_nombre": "Carlos Méndez",
    "fondo_inicial": 150.00,
    "total_ventas": 1240.50,
    "total_efectivo": 720.00,
    "total_tarjeta": 200.50,
    "total_qr": 320.00,
    "total_ingresos_extra": 50.00,
    "total_egresos_gastos": 85.00,
    "total_pedidos": 28,
    "efectivo_esperado": 835.00,
    "estado": "abierto"
  }
}
```

#### 4. Registrar Movimiento de Caja Chica (Egresos e Ingresos Extra)
* **Método:** `POST /api/turnos/movimientos`
* **Roles:** `admin`, `cajero`
* **Cuerpo JSON (Egreso por gasto urgente):**
```json
{
  "tipo": "EGRESO",
  "monto": 45.00,
  "concepto": "Compra de bolsa de carbón y hielo"
}
```
* **Cuerpo JSON (Ingreso de cambio extra):**
```json
{
  "tipo": "INGRESO",
  "monto": 50.00,
  "concepto": "Inyección de monedas de cambio por administración"
}
```

#### 5. Listar Movimientos de Caja Chica del Turno Activo
* **Método:** `GET /api/turnos/movimientos`
* **Roles:** `admin`, `cajero`

#### 6. Cierre Formal de Caja y Arqueo (Arqueo Z)
* **Método:** `POST /api/turnos/cerrar`
* **Roles:** `admin`, `cajero`
* **Cuerpo JSON:**
```json
{
  "efectivo_contado": 835.00
}
```
* **Respuesta:**
```json
{
  "success": true,
  "mensaje": "Turno de caja cerrado exitosamente",
  "arqueo": {
    "fondo_inicial": 150.00,
    "efectivo_esperado": 835.00,
    "efectivo_contado": 835.00,
    "diferencia": 0.00,
    "estado_arqueo": "CUADRADO"
  }
}
```

#### 7. Historial de Cierres de Turno
* **Método:** `GET /api/turnos/historial?limit=20`
* **Roles:** `admin`, `cajero`

---

### C. Módulo: Catálogo y Productos (`/api/productos`)

#### 1. Obtener Menú Agrupado por Categorías (Para UI de Ventas)
* **Método:** `GET /api/productos/menu`
* **Acceso:** Libre / Autenticado
* **Respuesta:**
```json
{
  "success": true,
  "menu": [
    {
      "categoria_id": 1,
      "nombre": "Pollo frito",
      "productos": [
        {
          "producto_id": 2,
          "nombre": "1/4 de pollo frito",
          "descripcion": "Con papas incluidas",
          "precio": 14.00,
          "disponible": true,
          "imagen_url": "https://storage.googleapis.com/pollopos-bucket/productos/cuarto_pollo_frito.webp",
          "imagen_emoji": "🍗"
        }
      ]
    }
  ]
}
```

#### 2. Marcar Producto como Agotado / Disponible
* **Método:** `PATCH /api/productos/:id/disponibilidad`
* **Roles:** `admin`, `cajero`
* **Cuerpo JSON:**
```json
{
  "disponible": false
}
```

#### 3. Crear Producto Nuevo
* **Método:** `POST /api/productos`
* **Roles:** `admin`
* **Cuerpo JSON:**
```json
{
  "categoria_id": 1,
  "nombre": "Alitas BBQ (6 uds)",
  "descripcion": "Bañadas en salsa bbq con papas",
  "precio": 22.00,
  "disponible": true,
  "imagen_url": "https://midominio.com/alitas.webp",
  "imagen_emoji": "🍗"
}
```

#### 4. Modificar Producto
* **Método:** `PUT /api/productos/:id`
* **Roles:** `admin`

---

### D. Módulo: Pedidos y Cocina (`/api/pedidos`)

#### 1. Crear Nuevo Pedido
* **Método:** `POST /api/pedidos`
* **Roles:** `admin`, `cajero`
* **Cuerpo JSON:**
```json
{
  "tipo_entrega": "mesa",
  "mesa_id": 3,
  "codigo_descuento": "PROMO10",
  "descuento_porcentaje": 0,
  "items": [
    {
      "producto_id": 2,
      "cantidad": 2,
      "notas": "Pechugas bien doradas"
    },
    {
      "producto_id": 5,
      "cantidad": 2,
      "notas": "Gaseosa fría"
    }
  ]
}
```

#### 2. Consultar Pedidos (Monitor de Cocina KDS y Ventas)
* **Método:** `GET /api/pedidos?estado=cocina`
* **Parámetros Opcionales:**
  * `estado`: `en_cocina`, `cocina`, `listo`, `entregado`, `cancelado`
  * `turno_id`: ID del turno actual
* **Roles:** `admin`, `cajero`, `cocina`

#### 3. Actualizar Estado de Preparación del Pedido
* **Método:** `PATCH /api/pedidos/:id/estado`
* **Roles:** `admin`, `cajero`, `cocina`
* **Cuerpo JSON:**
```json
{
  "estado": "listo"
}
```

#### 4. Cancelar Pedido
* **Método:** `POST /api/pedidos/:id/cancelar`
* **Roles:** `admin`, `cajero`
* **Cuerpo JSON:**
```json
{
  "motivo_cancelacion": "Cliente se retiró por urgencia personal"
}
```

---

### E. Módulo: Pagos y Facturación (`/api/pagos`)

#### 1. Procesar Cobro de Pedido
* **Método:** `POST /api/pagos`
* **Roles:** `admin`, `cajero`

##### Ejemplo 1: Pago en Efectivo con Vuelto
```json
{
  "pedido_id": 12,
  "metodo_pago": "efectivo",
  "monto_recibido": 50.00
}
```

##### Ejemplo 2: Pago con Tarjeta o QR
```json
{
  "pedido_id": 12,
  "metodo_pago": "qr",
  "referencia": "Banco Unión QR - Transacción #88921"
}
```

##### Ejemplo 3: Pago Mixto (Efectivo + Digital)
```json
{
  "pedido_id": 12,
  "metodo_pago": "mixto",
  "monto_efectivo": 20.00,
  "monto_digital": 21.40,
  "referencia": "MIXTO|EF:20.00|DIG:21.40 (Efectivo: Bs. 20.00, Digital: Bs. 21.40)"
}
```

#### 2. Obtener Recibo / Comprobante para Impresión Térmica
* **Método:** `GET /api/pagos/recibo/:pedido_id`
* **Roles:** `admin`, `cajero`
* **Respuesta:**
```json
{
  "success": true,
  "recibo": {
    "pedido_id": 12,
    "numero_orden": 15,
    "sucursal": {
      "nombre": "Pollo que hace pollo - Sucursal Centro",
      "direccion": "Av. Principal #123",
      "telefono": "+591 70012345"
    },
    "fecha_hora": "25/09/2026, 12:45:00",
    "cajero": "Carlos Méndez",
    "tipo_entrega": "mesa",
    "mesa": 3,
    "items": [
      {
        "producto": "1/4 de pollo frito",
        "cantidad": 2,
        "precio_unitario": 14.00,
        "subtotal": 28.00,
        "notas": "Pechugas bien doradas"
      }
    ],
    "subtotal": 28.00,
    "descuento": 0.00,
    "total": 28.00,
    "pago": {
      "metodo": "efectivo",
      "monto_recibido": 50.00,
      "monto_efectivo": 28.00,
      "monto_digital": 0.00,
      "vuelto": 22.00,
      "referencia": null
    }
  }
}
```

---

### F. Módulo: Gestión de Personal y Empleados (`/api/usuarios`)

#### 1. Listar Usuarios / Empleados
* **Método:** `GET /api/usuarios`
* **Roles:** `admin`

#### 2. Crear Nuevo Empleado (Cajero, Cocina o Admin)
* **Método:** `POST /api/usuarios`
* **Roles:** `admin`
* **Cuerpo JSON:**
```json
{
  "sucursal_id": 1,
  "rol_id": 2,
  "nombre_completo": "Ana Rojas",
  "nombre_usuario": "ana.caja",
  "password": "Password123",
  "pin_rapido": "4455",
  "correo": "ana@pollopos.com",
  "telefono": "78901234"
}
```

#### 3. Actualizar Datos o Asignar Rol / Sucursal
* **Método:** `PUT /api/usuarios/:id`
* **Roles:** `admin`

#### 4. Activar o Desactivar Usuario
* **Método:** `PATCH /api/usuarios/:id/estado`
* **Roles:** `admin`
* **Cuerpo JSON:**
```json
{
  "activo": false
}
```

---

### G. Módulo: Reportes y Business Intelligence (`/api/reportes`)

* **`GET /api/reportes/diario`** (Admin y Cajero): Ventas brutas del día, ticket promedio, cantidad de pedidos y partición exacta de efectivo vs digital.
* **`GET /api/reportes/turnos`** (Admin y Cajero): Histórico de cierres de caja y arqueos.
* **`GET /api/reportes/mas-vendidos`** (Solo Admin): Ranking de productos más vendidos en el período con cantidades y recaudación.
* **`GET /api/reportes/horas-pico`** (Solo Admin): Distribución horaria de afluencia y volumen de ventas.

---

## 4. Patrón de Consumo Recomendado en Android (Retrofit 2)

### A. Dependencias en `app/build.gradle.kts`:
```kotlin
dependencies {
    // Retrofit y conversor Gson
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    // OkHttp y Logging Interceptor
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}
```

### B. Interceptor para Inyección Automática del Token:
```java
public class AuthInterceptor implements Interceptor {
    private final SessionManager sessionManager;

    public AuthInterceptor(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        String token = sessionManager.getAuthToken();

        if (token != null && !token.isEmpty()) {
            Request authorized = original.newBuilder()
                    .header("Authorization", "Bearer " + token)
                    .build();
            return chain.proceed(authorized);
        }

        return chain.proceed(original);
    }
}
```

### C. Cliente Retrofit Central:
```java
public class ApiClient {
    private static final String BASE_URL = "http://10.0.2.2:3000/api/"; // o URL de Railway
    private static Retrofit retrofit = null;

    public static Retrofit getClient(Context context) {
        if (retrofit == null) {
            SessionManager session = new SessionManager(context);
            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(new AuthInterceptor(session))
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }
}
```
