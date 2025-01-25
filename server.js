require('dotenv').config(); 
const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const sharp = require('sharp'); 


const app = express();

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});
app.use(express.static(__dirname + ""));

// Serve arquivos estáticos da pasta "public"
app.use(express.static('public'));

app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
}));

app.use(express.json());

// Conexão com o MongoDB
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Conectado ao MongoDB"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// Modelo do Projeto
const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    photos: [String],
    createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model("Project", projectSchema);

// Rota para obter os projetos
app.get("/test/projects", async (req, res) => {
    try {
        console.log("Recebendo requisição para obter projetos...");
        const projects = await Project.find();
        console.log("Projetos encontrados no banco:", projects); 
        res.json(projects);
    } catch (err) {
        console.error("Erro ao buscar projetos:", err);
        res.status(500).json({ error: "Erro ao buscar projetos" });
    }
});

// Função para redimensionar e comprimir imagens
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

// Rota para adicionar um novo projeto com imagens em base64
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
