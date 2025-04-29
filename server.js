import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { handleLLMRequest, getAvailableStands } from './dist-server/server/llmHandler.js';

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
    const stands = await fs.readdir(integrationDir, { withFileTypes: true });
    
    const integrationFiles = [];
    
    for (const stand of stands) {
      if (stand.isDirectory()) {
        const standPath = path.join(integrationDir, stand.name);
        const flows = await fs.readdir(standPath, { withFileTypes: true });
        
        for (const flow of flows) {
          if (flow.isDirectory()) {
            const yamlPath = path.join(standPath, flow.name, 'integration.yaml');
            try {
              await fs.access(yamlPath);
              integrationFiles.push({
                stand: stand.name,
                flow: flow.name,
                path: `/integration/${stand.name}/${flow.name}/integration.yaml`
              });
            } catch (err) {
              console.warn(`No integration.yaml found in ${stand.name}/${flow.name}`);
            }
          }
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
app.get('/integration/:stand/:flow/integration.yaml', noCache, async (req, res) => {
  const filePath = path.join(__dirname, 'integration', req.params.stand, req.params.flow, 'integration.yaml');
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Serving integration file: ${req.params.stand}/${req.params.flow}/integration.yaml`);
    res.type('text/yaml').send(data);
  } catch (err) {
    console.error('Error reading integration file:', err);
    res.status(404).json({ error: 'Integration file not found' });
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Get available stands
app.get('/api/stands', async (req, res) => {
  try {
    const stands = await getAvailableStands();
    res.json(stands);
  } catch (error) {
    console.error('Error getting stands:', error);
    res.status(500).json({ error: 'Failed to get stands' });
  }
});

// Handle LLM requests
app.post('/api/chat', async (req, res) => {
  try {
    const { question, stand } = req.body;
    const response = await handleLLMRequest({ question, stand });
    res.json({ response });
  } catch (error) {
    console.error('Error handling chat request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Endpoint for updating integration files
app.post('/api/integrations/update', async (req, res) => {
  try {
    const { stand, flow, content } = req.body;
    
    // Validate required fields
    if (!stand || !flow || !content) {
      return res.status(400).json({ error: 'Missing required fields: stand, flow, or content' });
    }

    // Ensure the path is safe and within the integration directory
    const filePath = path.join(__dirname, 'integration', stand, flow, 'integration.yaml');
    const integrationDir = path.join(__dirname, 'integration');
    
    if (!filePath.startsWith(integrationDir)) {
      return res.status(403).json({ error: 'Invalid path' });
    }

    // Ensure the directory exists
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });

    // Write the file
    await fs.writeFile(filePath, content, 'utf8');
    
    console.log(`Updated integration file: ${stand}/${flow}/integration.yaml`);
    res.json({ success: true, message: 'Integration file updated successfully' });
  } catch (err) {
    console.error('Error updating integration file:', err);
    res.status(500).json({ error: 'Failed to update integration file' });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 