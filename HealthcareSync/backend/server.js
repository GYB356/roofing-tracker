const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? 'https://healthcaresync.com' : 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced Security Headers
app.use(helmet({
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
    frameguard: { action: 'deny' }
}));

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'", 
            process.env.NODE_ENV === 'production' 
                ? 'wss://healthcaresync.com' 
                : ['ws://localhost:3000', 'http://localhost:3000']
        ],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? true : null
    }
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Additional Rate Limiters
const sensitiveApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many requests for sensitive operations'
});

// Apply to sensitive routes
app.use('/api/medical-records', sensitiveApiLimiter);
app.use('/api/telemedicine', sensitiveApiLimiter);

// HIPAA Compliance Logging
const logHIPAAEvent = (req, event, additionalData = {}) => {
    const logData = {
        event,
        userId: req.user ? req.user.id : 'unknown',
        timestamp: new Date().toISOString(),
        ...additionalData
    };
    console.log('HIPAA Log:', logData);
};

// Example usage of HIPAA logging
app.use((req, res, next) => {
    logHIPAAEvent(req, 'API Access', { path: req.path });
    next();
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Mock database
let invoices = [
    {
        id: 'INV-001',
        patientId: 'P-001',
        patientName: 'John Doe',
        description: 'Annual checkup',
        amount: '150.00',
        dueDate: '2023-12-31',
        status: 'pending',
        createdAt: '2023-11-01',
        insuranceProvider: 'Blue Cross',
        insuranceCoverage: '80'
    },
    {
        id: 'INV-002',
        patientId: 'P-002',
        patientName: 'Jane Smith',
        description: 'Lab tests',
        amount: '75.50',
        dueDate: '2023-12-15',
        status: 'paid',
        createdAt: '2023-11-05',
        paidDate: '2023-11-10'
    }
];

let paymentMethods = [
    {
        id: 'PM-001',
        userId: 'U-001',
        cardHolder: 'John Doe',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123'
    }
];

let insuranceDetails = [
    {
        id: 'INS-001',
        userId: 'U-001',
        provider: 'Blue Cross',
        policyNumber: 'BC-12345',
        documentUrl: '/uploads/sample-document.pdf'
    }
];

// Mock data for new components
let appointments = [];
let medicalRecords = [];
let telemedicineSessions = [];
let staffSchedules = [];
let messages = [];

// WebSocket event handlers
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Telemedicine
    socket.on('joinTelemedicineSession', (sessionId) => {
        console.log(`Joining telemedicine session: ${sessionId}`);
        socket.join(sessionId);
    });
    
    socket.on('telemedicineSignal', ({ sessionId, signal }) => {
        socket.to(`telemedicine-${sessionId}`).emit('telemedicineSignal', signal);
    });

    // Real-time messaging
    socket.on('joinChat', (roomId) => {
        socket.join(`chat-${roomId}`);
        logHIPAAEvent({ headers: socket.handshake.headers }, 'Joined chat room', { roomId });
    });

    socket.on('sendMessage', (message) => {
        const roomId = message.roomId;
        io.to(`chat-${roomId}`).emit('newMessage', message);
        logHIPAAEvent({ headers: socket.handshake.headers }, 'Sent message', { roomId });
    });

    // Device Integration
    socket.on('deviceData', (data) => {
        io.emit('deviceUpdate', data);
        logHIPAAEvent({ headers: socket.handshake.headers }, 'Device data received', { deviceId: data.deviceId });
    });

    // Staff Schedule Updates
    socket.on('scheduleUpdate', (data) => {
        io.emit('scheduleChanged', data);
        logHIPAAEvent({ headers: socket.handshake.headers }, 'Schedule updated', { staffId: data.staffId });
    });

    socket.on('leaveTelemedicineSession', (sessionId) => {
        console.log(`Leaving telemedicine session: ${sessionId}`);
        socket.leave(sessionId);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// API Routes

// Invoices
app.get('/api/invoices', (req, res) => {
    logHIPAAEvent(req, 'Fetched invoices');
    res.json(invoices);
});

app.post('/api/invoices', (req, res) => {
    const newInvoice = {
        id: `INV-${uuidv4().substring(0, 8)}`,
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    invoices.push(newInvoice);
    logHIPAAEvent(req, `Created invoice ${newInvoice.id}`);
    
    // Notify all clients about the new invoice
    io.emit('invoiceUpdated', newInvoice);
    
    res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id/pay', (req, res) => {
    const { id } = req.params;
    const invoiceIndex = invoices.findIndex(inv => inv.id === id);
    
    if (invoiceIndex === -1) {
        return res.status(404).json({ message: 'Invoice not found' });
    }
    
    invoices[invoiceIndex] = {
        ...invoices[invoiceIndex],
        status: 'paid',
        paidDate: new Date().toISOString()
    };
    
    logHIPAAEvent(req, `Paid invoice ${id}`);
    
    // Notify all clients about the updated invoice
    io.emit('invoiceUpdated', invoices[invoiceIndex]);
    
    res.json(invoices[invoiceIndex]);
});

app.delete('/api/invoices/:id', (req, res) => {
    const { id } = req.params;
    const invoiceIndex = invoices.findIndex(inv => inv.id === id);
    
    if (invoiceIndex === -1) {
        return res.status(404).json({ message: 'Invoice not found' });
    }
    
    invoices.splice(invoiceIndex, 1);
    logHIPAAEvent(req, `Deleted invoice ${id}`);
    
    // Notify all clients about the deleted invoice
    io.emit('invoiceDeleted', id);
    
    res.status(204).end();
});

// Payment Methods
app.get('/api/payment-methods', (req, res) => {
    logHIPAAEvent(req, 'Fetched payment methods');
    res.json(paymentMethods);
});

app.post('/api/payment-methods', (req, res) => {
    const newPaymentMethod = {
        id: `PM-${uuidv4().substring(0, 8)}`,
        ...req.body,
        userId: req.headers['x-user-id'] || 'U-001' // In production, get from authenticated user
    };
    
    paymentMethods.push(newPaymentMethod);
    logHIPAAEvent(req, `Added payment method ${newPaymentMethod.id}`);
    
    // Notify all clients about the new payment method
    io.emit('paymentMethodUpdated', newPaymentMethod);
    
    res.status(201).json(newPaymentMethod);
});

app.put('/api/payment-methods/:id', (req, res) => {
    const { id } = req.params;
    const methodIndex = paymentMethods.findIndex(method => method.id === id);
    
    if (methodIndex === -1) {
        return res.status(404).json({ message: 'Payment method not found' });
    }
    
    paymentMethods[methodIndex] = {
        ...paymentMethods[methodIndex],
        ...req.body
    };
    
    logHIPAAEvent(req, `Updated payment method ${id}`);
    
    // Notify all clients about the updated payment method
    io.emit('paymentMethodUpdated', paymentMethods[methodIndex]);
    
    res.json(paymentMethods[methodIndex]);
});

app.delete('/api/payment-methods/:id', (req, res) => {
    const { id } = req.params;
    const methodIndex = paymentMethods.findIndex(method => method.id === id);
    
    if (methodIndex === -1) {
        return res.status(404).json({ message: 'Payment method not found' });
    }
    
    paymentMethods.splice(methodIndex, 1);
    logHIPAAEvent(req, `Deleted payment method ${id}`);
    
    // Notify all clients about the deleted payment method
    io.emit('paymentMethodDeleted', id);
    
    res.status(204).end();
});

// Insurance
app.get('/api/insurance', (req, res) => {
    logHIPAAEvent(req, 'Fetched insurance details');
    res.json(insuranceDetails);
});

app.post('/api/insurance', upload.single('document'), (req, res) => {
    const { provider, policyNumber } = req.body;
    const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const newInsurance = {
        id: `INS-${uuidv4().substring(0, 8)}`,
        userId: req.headers['x-user-id'] || 'U-001', // In production, get from authenticated user
        provider,
        policyNumber,
        documentUrl
    };
    
    insuranceDetails.push(newInsurance);
    logHIPAAEvent(req, `Added insurance ${newInsurance.id}`);
    
    // Notify all clients about the new insurance
    io.emit('insuranceUpdated', newInsurance);
    
    res.status(201).json(newInsurance);
});

app.put('/api/insurance/:id', upload.single('document'), (req, res) => {
    const { id } = req.params;
    const { provider, policyNumber } = req.body;
    const insuranceIndex = insuranceDetails.findIndex(ins => ins.id === id);
    
    if (insuranceIndex === -1) {
        return res.status(404).json({ message: 'Insurance not found' });
    }
    
    const documentUrl = req.file 
        ? `/uploads/${req.file.filename}` 
        : insuranceDetails[insuranceIndex].documentUrl;
    
    insuranceDetails[insuranceIndex] = {
        ...insuranceDetails[insuranceIndex],
        provider,
        policyNumber,
        documentUrl
    };
    
    logHIPAAEvent(req, `Updated insurance ${id}`);
    
    // Notify all clients about the updated insurance
    io.emit('insuranceUpdated', insuranceDetails[insuranceIndex]);
    
    res.json(insuranceDetails[insuranceIndex]);
});

app.delete('/api/insurance/:id', (req, res) => {
    const { id } = req.params;
    const insuranceIndex = insuranceDetails.findIndex(ins => ins.id === id);
    
    if (insuranceIndex === -1) {
        return res.status(404).json({ message: 'Insurance not found' });
    }
    
    // Delete associated document if exists
    if (insuranceDetails[insuranceIndex].documentUrl) {
        const filePath = path.join(__dirname, insuranceDetails[insuranceIndex].documentUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    
    insuranceDetails.splice(insuranceIndex, 1);
    logHIPAAEvent(req, `Deleted insurance ${id}`);
    
    // Notify all clients about the deleted insurance
    io.emit('insuranceDeleted', id);
    
    res.status(204).end();
});

// Telemedicine
app.get('/api/telemedicine/sessions', (req, res) => {
    // Logic to get telemedicine sessions
    res.json({ message: 'List of telemedicine sessions' });
});

app.post('/api/telemedicine/sessions', (req, res) => {
    // Logic to create a new telemedicine session
    res.json({ message: 'Telemedicine session created' });
});

// Additional Telemedicine routes
app.get('/api/telemedicine/sessions/:id', (req, res) => {
    const session = telemedicineSessions.find(s => s.id === req.params.id);
    if (!session) {
        return res.status(404).json({ message: 'Session not found' });
    }
    logHIPAAEvent(req, 'Accessed telemedicine session');
    res.json(session);
});

app.put('/api/telemedicine/sessions/:id', (req, res) => {
    const { id } = req.params;
    const sessionIndex = telemedicineSessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
        return res.status(404).json({ message: 'Session not found' });
    }
    
    telemedicineSessions[sessionIndex] = {
        ...telemedicineSessions[sessionIndex],
        ...req.body,
        id: id // Prevent ID from being changed
    };
    
    logHIPAAEvent(req, 'Updated telemedicine session');
    io.to(`telemedicine-${id}`).emit('sessionUpdated', telemedicineSessions[sessionIndex]);
    res.json(telemedicineSessions[sessionIndex]);
});

// Add this after the other telemedicine routes
app.delete('/api/telemedicine/sessions/:id', (req, res) => {
    const { id } = req.params;
    const sessionIndex = telemedicineSessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
        return res.status(404).json({ message: 'Session not found' });
    }
    
    telemedicineSessions.splice(sessionIndex, 1);
    logHIPAAEvent(req, 'Deleted telemedicine session', { sessionId: id });
    
    // Notify all participants in the session
    io.to(`telemedicine-${id}`).emit('sessionDeleted', id);
    res.status(204).end();
});

// Appointments
app.get('/api/appointments', (req, res) => {
    logHIPAAEvent(req, 'Fetched appointments');
    res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
    const newAppointment = {
        id: uuidv4(),
        ...req.body,
        status: 'scheduled',
        createdAt: new Date().toISOString()
    };
    appointments.push(newAppointment);
    logHIPAAEvent(req, 'Created appointment');
    io.emit('appointmentCreated', newAppointment);
    res.status(201).json(newAppointment);
});

// Additional Appointment routes
app.put('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);
    
    if (appointmentIndex === -1) {
        return res.status(404).json({ message: 'Appointment not found' });
    }
    
    appointments[appointmentIndex] = {
        ...appointments[appointmentIndex],
        ...req.body,
        id: id
    };
    
    logHIPAAEvent(req, 'Updated appointment');
    io.emit('appointmentUpdated', appointments[appointmentIndex]);
    res.json(appointments[appointmentIndex]);
});

app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);
    
    if (appointmentIndex === -1) {
        return res.status(404).json({ message: 'Appointment not found' });
    }
    
    appointments.splice(appointmentIndex, 1);
    logHIPAAEvent(req, 'Deleted appointment');
    io.emit('appointmentDeleted', id);
    res.status(204).end();
});

// Medical Records
app.get('/api/medical-records/:patientId', (req, res) => {
    const { patientId } = req.params;
    const records = medicalRecords.filter(record => record.patientId === patientId);
    logHIPAAEvent(req, 'Accessed medical records', { patientId });
    res.json(records);
});

app.post('/api/medical-records', upload.single('file'), (req, res) => {
    const newRecord = {
        id: uuidv4(),
        ...req.body,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
        createdAt: new Date().toISOString()
    };
    medicalRecords.push(newRecord);
    logHIPAAEvent(req, 'Created medical record');
    res.status(201).json(newRecord);
});

// Additional Medical Records routes
app.put('/api/medical-records/:id', upload.single('file'), (req, res) => {
    const { id } = req.params;
    const recordIndex = medicalRecords.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
        return res.status(404).json({ message: 'Medical record not found' });
    }
    
    const updatedRecord = {
        ...medicalRecords[recordIndex],
        ...req.body,
        id: id
    };
    
    if (req.file) {
        // Delete old file if it exists
        if (medicalRecords[recordIndex].fileUrl) {
            const oldFilePath = path.join(__dirname, medicalRecords[recordIndex].fileUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        updatedRecord.fileUrl = `/uploads/${req.file.filename}`;
    }
    
    medicalRecords[recordIndex] = updatedRecord;
    logHIPAAEvent(req, 'Updated medical record');
    res.json(updatedRecord);
});

// Add after the existing Medical Records routes
app.delete('/api/medical-records/:id', (req, res) => {
    const { id } = req.params;
    const recordIndex = medicalRecords.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
        return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Delete associated file if it exists
    if (medicalRecords[recordIndex].fileUrl) {
        const filePath = path.join(__dirname, medicalRecords[recordIndex].fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    
    medicalRecords.splice(recordIndex, 1);
    logHIPAAEvent(req, 'Deleted medical record', { recordId: id });
    res.status(204).end();
});

// Staff Scheduling
app.get('/api/staff-schedules', (req, res) => {
    logHIPAAEvent(req, 'Fetched staff schedules');
    res.json(staffSchedules);
});

app.post('/api/staff-schedules', (req, res) => {
    const newSchedule = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    staffSchedules.push(newSchedule);
    logHIPAAEvent(req, 'Created staff schedule');
    io.emit('scheduleUpdated', newSchedule);
    res.status(201).json(newSchedule);
});

// Additional Staff Scheduling routes
app.put('/api/staff-schedules/:id', (req, res) => {
    const { id } = req.params;
    const scheduleIndex = staffSchedules.findIndex(schedule => schedule.id === id);
    
    if (scheduleIndex === -1) {
        return res.status(404).json({ message: 'Schedule not found' });
    }
    
    staffSchedules[scheduleIndex] = {
        ...staffSchedules[scheduleIndex],
        ...req.body,
        id: id
    };
    
    logHIPAAEvent(req, 'Updated staff schedule');
    io.emit('scheduleUpdated', staffSchedules[scheduleIndex]);
    res.json(staffSchedules[scheduleIndex]);
});

app.delete('/api/staff-schedules/:id', (req, res) => {
    const { id } = req.params;
    const scheduleIndex = staffSchedules.findIndex(schedule => schedule.id === id);
    
    if (scheduleIndex === -1) {
        return res.status(404).json({ message: 'Schedule not found' });
    }
    
    staffSchedules.splice(scheduleIndex, 1);
    logHIPAAEvent(req, 'Deleted staff schedule');
    io.emit('scheduleDeleted', id);
    res.status(204).end();
});

// Messaging
app.get('/api/messages/:roomId', (req, res) => {
    const { roomId } = req.params;
    const roomMessages = messages.filter(msg => msg.roomId === roomId);
    logHIPAAEvent(req, 'Fetched messages', { roomId });
    res.json(roomMessages);
});

app.post('/api/messages', (req, res) => {
    const newMessage = {
        id: uuidv4(),
        ...req.body,
        timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    logHIPAAEvent(req, 'Sent message');
    io.to(`chat-${newMessage.roomId}`).emit('newMessage', newMessage);
    res.status(201).json(newMessage);
});

// Add after the existing Messages routes
app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    const messageIndex = messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
        return res.status(404).json({ message: 'Message not found' });
    }
    
    const deletedMessage = messages[messageIndex];
    messages.splice(messageIndex, 1);
    logHIPAAEvent(req, 'Deleted message', { messageId: id, roomId: deletedMessage.roomId });
    io.to(`chat-${deletedMessage.roomId}`).emit('messageDeleted', id);
    res.status(204).end();
});

// Device Integration Routes
app.get('/api/devices', (req, res) => {
    // Mock device list - in production, this would come from a database
    const devices = [
        { id: 'DEV-001', type: 'heart_monitor', status: 'active' },
        { id: 'DEV-002', type: 'blood_pressure', status: 'inactive' }
    ];
    logHIPAAEvent(req, 'Fetched devices list');
    res.json(devices);
});

app.post('/api/devices/register', (req, res) => {
    const newDevice = {
        id: `DEV-${uuidv4().substring(0, 8)}`,
        ...req.body,
        registeredAt: new Date().toISOString()
    };
    logHIPAAEvent(req, 'Registered new device', { deviceId: newDevice.id });
    res.status(201).json(newDevice);
});

app.get('/api/devices/:id/data', (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    // Mock device data - in production, this would come from a database
    const deviceData = {
        deviceId: id,
        readings: [],
        startDate,
        endDate
    };
    logHIPAAEvent(req, 'Fetched device data', { deviceId: id });
    res.json(deviceData);
});

// Add after the existing Device Integration routes
app.delete('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    // In a real implementation, you would remove the device from your database
    // Here we just log the event since we're using mock data
    logHIPAAEvent(req, 'Deleted device', { deviceId: id });
    io.emit('deviceDeleted', id);
    res.status(204).end();
});

// HIPAA Documentation Routes
app.get('/api/hipaa/documents', (req, res) => {
    // Mock HIPAA documents list
    const documents = [
        { id: 'DOC-001', title: 'Privacy Policy', version: '1.0' },
        { id: 'DOC-002', title: 'Patient Rights', version: '1.1' }
    ];
    logHIPAAEvent(req, 'Fetched HIPAA documents list');
    res.json(documents);
});

app.get('/api/hipaa/documents/:id', (req, res) => {
    const { id } = req.params;
    // Mock single document fetch
    const document = {
        id,
        title: 'Privacy Policy',
        version: '1.0',
        content: 'Document content here...'
    };
    logHIPAAEvent(req, 'Accessed HIPAA document', { documentId: id });
    res.json(document);
});

app.post('/api/hipaa/acknowledgments', (req, res) => {
    const acknowledgment = {
        id: `ACK-${uuidv4().substring(0, 8)}`,
        userId: req.headers['x-user-id'],
        documentId: req.body.documentId,
        acknowledgedAt: new Date().toISOString()
    };
    logHIPAAEvent(req, 'Recorded HIPAA acknowledgment', { documentId: req.body.documentId });
    res.status(201).json(acknowledgment);
});

// Add after the existing HIPAA Documentation routes
app.delete('/api/hipaa/documents/:id', (req, res) => {
    const { id } = req.params;
    // In a real implementation, you would archive rather than delete HIPAA documents
    // to maintain compliance records
    logHIPAAEvent(req, 'Archived HIPAA document', { documentId: id });
    res.status(204).end();
});

// Analytics Dashboard
app.get('/api/analytics/dashboard', (req, res) => {
    const analytics = {
        patientCount: medicalRecords.length,
        appointmentCount: appointments.length,
        telemedicineSessionCount: telemedicineSessions.length,
        activeDevices: 0, // To be implemented with actual device tracking
        messageCount: messages.length,
        staffScheduleCount: staffSchedules.length
    };
    logHIPAAEvent(req, 'Accessed analytics dashboard');
    res.json(analytics);
});

// Additional Analytics endpoints
app.get('/api/analytics/appointments', (req, res) => {
    const appointmentAnalytics = {
        total: appointments.length,
        byStatus: appointments.reduce((acc, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
        }, {}),
        byMonth: appointments.reduce((acc, apt) => {
            const month = new Date(apt.scheduledTime).toLocaleString('default', { month: 'long' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {})
    };
    logHIPAAEvent(req, 'Accessed appointment analytics');
    res.json(appointmentAnalytics);
});

app.get('/api/analytics/telemedicine', (req, res) => {
    const telemedicineAnalytics = {
        total: telemedicineSessions.length,
        byStatus: telemedicineSessions.reduce((acc, session) => {
            acc[session.status] = (acc[session.status] || 0) + 1;
            return acc;
        }, {}),
        byDoctor: telemedicineSessions.reduce((acc, session) => {
            acc[session.doctorId] = (acc[session.doctorId] || 0) + 1;
            return acc;
        }, {})
    };
    logHIPAAEvent(req, 'Accessed telemedicine analytics');
    res.json(telemedicineAnalytics);
});

// Additional Analytics routes
app.get('/api/analytics/medical-records', (req, res) => {
    const recordsAnalytics = {
        total: medicalRecords.length,
        byType: medicalRecords.reduce((acc, record) => {
            acc[record.type] = (acc[record.type] || 0) + 1;
            return acc;
        }, {}),
        byMonth: medicalRecords.reduce((acc, record) => {
            const month = new Date(record.createdAt).toLocaleString('default', { month: 'long' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {})
    };
    logHIPAAEvent(req, 'Accessed medical records analytics');
    res.json(recordsAnalytics);
});

app.get('/api/analytics/messaging', (req, res) => {
    const messagingAnalytics = {
        total: messages.length,
        byRoom: messages.reduce((acc, msg) => {
            acc[msg.roomId] = (acc[msg.roomId] || 0) + 1;
            return acc;
        }, {}),
        byDate: messages.reduce((acc, msg) => {
            const date = new Date(msg.timestamp).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {})
    };
    logHIPAAEvent(req, 'Accessed messaging analytics');
    res.json(messagingAnalytics);
});

// Add a route to delete acknowledgments if needed
app.delete('/api/hipaa/acknowledgments/:id', (req, res) => {
    const { id } = req.params;
    // In a real implementation, you would archive rather than delete acknowledgments
    // to maintain compliance records
    logHIPAAEvent(req, 'Archived HIPAA acknowledgment', { acknowledgmentId: id });
    res.status(204).end();
});

// Billing API
app.get('/api/billing/invoices', (req, res) => {
    // Logic to get billing invoices
    res.json({ message: 'List of billing invoices' });
});

app.post('/api/billing/invoices', (req, res) => {
    // Logic to create a new billing invoice
    res.json({ message: 'Billing invoice created' });
});

// Staff Scheduling API
app.get('/api/staff/schedule', (req, res) => {
    // Logic to get staff schedule
    res.json({ message: 'Staff schedule' });
});

app.post('/api/staff/schedule', (req, res) => {
    // Logic to update staff schedule
    res.json({ message: 'Staff schedule updated' });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    logHIPAAEvent(req, 'Server Error', { error: err.message });
    res.status(500).json({ message: 'An error occurred' });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 