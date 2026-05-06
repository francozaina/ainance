# 💸 Ai.nance

Aplicación web full stack desarrollada con **React + Node.js**, orientada a la gestión financiera para freelancers y trabajadores remotos.

El proyecto centraliza herramientas útiles para quienes cobran en dólares o trabajan con múltiples plataformas de pago, incorporando:

- Calculadora inteligente de comisiones
- Conversión de monedas en tiempo real
- Gestión de finanzas personales
- Chatbot con IA integrado
- Sistema de autenticación de usuarios

Fue desarrollado como proyecto personal para portfolio, con foco en construir una aplicación moderna, útil y escalable.

---

## 🚀 Live Demo

https://ainance-blond.vercel.app/

---

## 🛠️ Tecnologías utilizadas

### Frontend

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Axios**
- **Lucide React**

### Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **bcryptjs**

### APIs y Servicios

- **Google Gemini AI API**
- **API de cotizaciones de dólar**

---

## 📌 Características principales

### 💰 Calculadora de cobros

Permite calcular automáticamente cuánto dinero recibe realmente el usuario luego de:

- Comisiones variables
- Comisiones fijas
- Conversión USD → ARS
- Cotización actual del dólar

Incluye desglose completo del cálculo final.

---

### 🤖 Chatbot con IA

Asistente integrado utilizando **Google Gemini AI**, pensado para ayudar con:

- Finanzas
- Cobros internacionales
- Consultas generales
- Soporte dentro de la plataforma

---

### 💱 Conversor de monedas

Visualización y conversión de cotizaciones en tiempo real.

Incluye:

- Dólar oficial
- Dólar blue
- Diferentes tipos de cambio

---

### 📊 Gestor financiero

Sistema para administrar gastos y movimientos financieros.

Permite:

- Registrar gastos
- Visualizar movimientos
- Organizar finanzas personales
- Asociar datos al usuario autenticado

---

### 🔐 Sistema de autenticación

Autenticación completa mediante:

- Registro de usuarios
- Login
- JWT Tokens
- Protección de rutas
- Persistencia de sesión

---

## 🧠 Objetivo del proyecto

El objetivo principal fue desarrollar una aplicación full stack moderna que combine:

- Arquitectura frontend/backend
- Integración de APIs externas
- Manejo de autenticación
- Persistencia de datos
- Uso de inteligencia artificial
- Experiencia de usuario moderna
- Organización escalable de código

Además, el proyecto busca ser una aplicación real orientada a usuarios freelancers que cobran en dólares y necesitan herramientas financieras simples.

---

## 📂 Estructura general

El proyecto está dividido en dos partes principales:

### Frontend

- **Screens / Views** → pantallas principales de la aplicación
- **Components** → componentes reutilizables
- **Context API** → manejo de autenticación global
- **API Layer** → comunicación con backend
- **Types** → tipado centralizado con TypeScript
- **Styles** → diseño responsive con Tailwind

### Backend

- **Routes** → endpoints de la API
- **Models** → esquemas de MongoDB
- **Middleware** → autenticación y validaciones
- **Services** → lógica externa y APIs
- **Database** → conexión y configuración de MongoDB

---

## 🔧 Instalación y Configuración Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/ainance.git
```

---

### 2. Entrar al proyecto

```bash
cd ainance
```

---

## ⚙️ Configuración del Backend

### 3. Instalar dependencias del backend

```bash
npm install
```

### 4. Configurar variables de entorno

Crear un archivo `.env` basado en `.env.example`

Ejemplo:

```env
PORT=5000
MONGO_URI=tu_uri_mongodb
JWT_SECRET=tu_secret
GEMINI_API_KEY=tu_api_key
```

### 5. Ejecutar backend

```bash
npm run dev
```

El servidor debería correr en:

```bash
http://localhost:5000
```

---

## 🎨 Configuración del Frontend

### 6. Entrar a frontend

```bash
cd frontend
```

### 7. Instalar dependencias

```bash
npm install
```

### 8. Ejecutar frontend

```bash
npm run dev
```

La aplicación debería ejecutarse en:

```bash
http://localhost:5173
```

---

## 📸 Funcionalidades destacadas

- Diseño responsive moderno
- Navegación SPA
- Estado global de autenticación
- Integración con IA
- API REST propia
- Arquitectura modular
- Persistencia de datos en MongoDB
- Manejo de errores y validaciones

---

## 👤 Autor

**Franco Zaina**  
* 🎓 Ciencias de la Computación — **UBA (Exactas)**  
* 💻 Egresado en informática — **ORT Argentina**  
* 🔗 [LinkedIn Profile](https://www.linkedin.com/in/franco-rom%C3%A1n-zaina-a2bb9a238/)  
* 📧 fran.roman.zeta@gmail.com

