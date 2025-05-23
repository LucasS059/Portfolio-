require('dotenv').config();
const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const sharp = require('sharp');
const axios = require('axios');

const app = express();

// Middleware para servir arquivos estáticos
app.use(express.static('public'));

// Middleware para parsing de JSON e formulários
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middleware para CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Middleware para logs
app.use((req, res, next) => {
    console.log(`Requisição recebida: ${req.method} ${req.url}`);
    next();
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

app.post('/formContato', async (req, res) => {
    const { nome, email, mensagem } = req.body;

    if (!nome || !email || !mensagem) {
        return res.status(400).json({ error: 'Formulário incompleto' });
    }

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
});

// Configuração do servidor
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse em http://localhost:${PORT}`);
});