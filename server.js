require('dotenv').config();
const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const fsp = require('fs/promises');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { body, validationResult } = require('express-validator');

const app = express();

// Necessário quando está atrás de proxy (Render/Heroku) para detectar HTTPS
app.set('trust proxy', 1);

// Segurança: Helmet para headers HTTP seguros
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://portfolio-yg0y.onrender.com"]
        }
    }
}));

// Segurança: Rate limiting para prevenir ataques de força bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use(limiter);

// Rate limiting específico para formulários
const formLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // limite de 5 envios por hora
    message: 'Muitos envios de formulário, tente novamente mais tarde.'
});

// Segurança: Sanitização de dados MongoDB para prevenir NoSQL injection
app.use(mongoSanitize());

// Middleware para servir arquivos estáticos
app.use(express.static('public', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (/(?:\.css|\.js|\.png|\.jpg|\.jpeg|\.svg|\.ico|\.webp|\.gif|\.woff2?)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Middleware para parsing de JSON e formulários
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middleware para CORS - Configuração mais segura
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3002',
    'https://portfolio-yg0y.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origin (como Postman) em desenvolvimento
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Middleware para logs
app.use((req, res, next) => {
    console.log(`Requisição recebida: ${req.method} ${req.url}`);
    next();
});

// Rotas explícitas para sitemap.xml e robots.txt com Content-Type adequado
app.get('/sitemap.xml', async (req, res) => {
    try {
        const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0];
        const host = req.headers.host;
        const baseUrl = `${proto}://${host}`;

        const htmlDir = path.resolve(__dirname, 'public/html');
        const entries = await fsp.readdir(htmlDir, { withFileTypes: true });

        const pages = [];
        // index.html -> '/'
        pages.push({ url: '/', file: path.join(htmlDir, 'index.html'), changefreq: 'weekly', priority: '1.0' });

        for (const ent of entries) {
            if (!ent.isFile()) continue;
            if (!ent.name.endsWith('.html')) continue;
            if (ent.name === 'index.html') continue;
            const url = `/html/${ent.name}`;
            let changefreq = 'monthly';
            let priority = '0.6';
            if (ent.name === 'projetos.html') priority = '0.8';
            if (ent.name.startsWith('add_')) priority = '0.4';
            pages.push({ url, file: path.join(htmlDir, ent.name), changefreq, priority });
        }

        const items = await Promise.all(pages.map(async (p) => {
            try {
                const stat = await fsp.stat(p.file);
                const lastmod = stat.mtime.toISOString();
                return `  <url>\n    <loc>${baseUrl}${p.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`;
            } catch (e) {
                return `  <url>\n    <loc>${baseUrl}${p.url}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`;
            }
        }));

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>\n`;

        res.set('Cache-Control', 'public, max-age=3600');
        res.type('application/xml').send(xml);
    } catch (err) {
        console.error('Erro ao gerar sitemap:', err);
        // Fallback: servir arquivo estático se existir
        const staticPath = path.resolve(__dirname, 'public', 'sitemap.xml');
        if (fs.existsSync(staticPath)) {
            return res.type('application/xml').sendFile(staticPath);
        }
        res.status(500).send('');
    }
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.resolve(__dirname, 'public', 'robots.txt'));
});

// Conexão com o MongoDB
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
    .then(() => console.log("Conectado ao MongoDB"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

/* Modelo do Projeto */
const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    photos: [String],
    createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model("Project", projectSchema);

/* Rota para obter os projetos */
app.get("/Portfolio/projects", async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        console.error("Erro ao buscar projetos:", err);
        res.status(500).json({ error: "Erro ao buscar projetos" });
    }
});

/* Modelo para Certificados */
const certificateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    certificateUrl: String,
    authenticityUrl: String
});
const Certificate = mongoose.model("Certificate", certificateSchema);

// /* Rota para obter os certificados */
// app.get("/Portfolio/certificates", async (req, res) => {
//     try {
//         const certificates = await Certificate.find();
//         res.json(certificates);
//     } catch (err) {
//         console.error("Erro ao buscar certificados:", err);
//         res.status(500).json({ error: "Erro ao buscar certificados" });
//     }
// });

app.get("/Portfolio/certificates", async (req, res) => {
    try {
        console.log("Buscando certificados...");
        const certificates = await Certificate.find();
        res.json(certificates);
    } catch (err) {
        console.error("Erro ao buscar certificados:", err);
        res.status(500).json({ error: "Erro ao buscar certificados" });
    }
});


/* Rota para adicionar um novo certificado */
app.post("/Portfolio/certificates", async (req, res) => {
    try {
        const { title, description, certificateUrl, authenticityUrl } = req.body;
        if (!title || !certificateUrl || !authenticityUrl) {
            return res.status(400).json({ error: "Título, URL do certificado e URL de autenticidade são obrigatórios." });
        }

        const newCertificate = new Certificate({
            title,
            description,
            certificateUrl,
            authenticityUrl
        });

        await newCertificate.save();
        console.log("Certificado adicionado:", newCertificate);
        res.status(201).json(newCertificate);
    } catch (err) {
        console.error("Erro ao adicionar certificado:", err);
        res.status(500).json({ error: "Erro ao adicionar certificado" });
    }
});

/* Função para redimensionar e comprimir imagens */
const resizeAndCompressImage = async (buffer) => {
    try {
        const resizedBuffer = await sharp(buffer)
            .resize(800)
            .jpeg({ quality: 70 })
            .toBuffer();

        return resizedBuffer;
    } catch (err) {
        console.error("Erro ao redimensionar e comprimir a imagem:", err);
        throw err;
    }
};

/* Rota para adicionar um novo projeto com imagens em base64 */
app.post("/Portfolio/projects", async (req, res) => {
    try {
        const { title, description, photos } = req.body;

        if (!Array.isArray(photos) || photos.length === 0) {
            return res.status(400).json({ error: "Deve enviar pelo menos uma foto." });
        }

        const processedPhotos = [];
        for (let photo of photos) {
            const buffer = Buffer.from(photo.split(",")[1], 'base64');
            const processedBuffer = await resizeAndCompressImage(buffer);
            const processedBase64 = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
            processedPhotos.push(processedBase64);
        }

        const newProject = new Project({
            title,
            description,
            photos: processedPhotos,
            createdAt: new Date()
        });

        await newProject.save();
        console.log("Projeto adicionado:", newProject);
        res.status(201).json(newProject);
    } catch (err) {
        console.error("Erro ao adicionar projeto:", err);
        res.status(500).json({ error: "Erro ao adicionar projeto" });
    }
});

/* Rota para servir o index.html como fallback */
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/html/index.html'));
});

// Rota de contato com validação e rate limiting
app.post('/formContato',
    formLimiter,
    [
        body('nome')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Nome deve ter entre 2 e 100 caracteres')
            .matches(/^[A-Za-zÀ-ÿ\s]+$/)
            .withMessage('Nome deve conter apenas letras'),
        body('email')
            .trim()
            .isEmail()
            .normalizeEmail()
            .withMessage('Email inválido'),
        body('mensagem')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Mensagem deve ter entre 10 e 1000 caracteres')
    ],
    async (req, res) => {
        // Validação dos dados
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: errors.array() 
            });
        }

        const { nome, email, mensagem } = req.body;

        try {
            const response = await axios.post(process.env.FORMSPREE_URL, {
                nome,
                email,
                mensagem
            });

            console.log("Resposta do Formspree:", response.data);
            res.status(200).json({ message: 'Formulário enviado com sucesso!' });
        } catch (error) {
            console.error("Erro ao enviar o formulário:", error.response ? error.response.data : error.message);
            res.status(500).json({ error: 'Erro ao enviar o formulário' });
        }
    }
);

// Configuração do servidor
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse em http://localhost:${PORT}`);
});