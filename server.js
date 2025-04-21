import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { handleLLMRequest } from './dist-server/server/llmHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Добавляем middleware для отключения кэширования для API endpoints
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Expires', '0');
  res.set('Pragma', 'no-cache');
  next();
};

// Serve integration files
app.use('/integration', noCache, express.static(path.join(__dirname, 'integration')));

// Эндпоинт для получения списка интеграций
app.get('/api/integrations/list', noCache, async (req, res) => {
  try {
    const integrationDir = path.join(__dirname, 'integration');
    const directories = await fs.readdir(integrationDir, { withFileTypes: true });
    
    const integrationFiles = [];
    
    for (const dirent of directories) {
      if (dirent.isDirectory()) {
        const integrationPath = path.join(integrationDir, dirent.name, 'integration.yaml');
        try {
          await fs.access(integrationPath);
          integrationFiles.push(`/integration/${dirent.name}/integration.yaml`);
        } catch (err) {
          console.warn(`No integration.yaml found in ${dirent.name}`);
        }
      }
    }

    console.log('Sending integration list:', integrationFiles);
    res.json(integrationFiles);
  } catch (err) {
    console.error('Error reading integration directories:', err);
    res.status(500).json({ error: 'Failed to read integration directories' });
  }
});

// Эндпоинт для получения конкретной интеграции
app.get('/integration/:dir/integration.yaml', noCache, async (req, res) => {
  const filePath = path.join(__dirname, 'integration', req.params.dir, 'integration.yaml');
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Serving integration file: ${req.params.dir}/integration.yaml`);
    res.type('text/yaml').send(data);
  } catch (err) {
    console.error('Error reading integration file:', err);
    res.status(404).json({ error: 'Integration file not found' });
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.post('/api/llm', async (req, res) => {
  try {
    const response = await handleLLMRequest({ question: req.body.prompt });
    res.json({ response });
  } catch (error) {
    console.error('Error processing LLM request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 