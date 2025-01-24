const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
const uri = "sua-string-de-conexao-do-mongodb"; // Substitua pela string de conexão do Atlas
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

// Rota para buscar todos os projetos
app.get("/api/projects", async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar projetos" });
    }
});

// Rota para adicionar um novo projeto
app.post("/api/projects", async (req, res) => {
    try {
        const newProject = new Project(req.body);
        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: "Erro ao adicionar projeto" });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
