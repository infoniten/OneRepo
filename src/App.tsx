import React, { useState, useEffect } from 'react';
import { Box, Container, CssBaseline, CircularProgress, Typography } from '@mui/material';
import IntegrationList from './components/IntegrationList/IntegrationList';
import IntegrationFlow from './components/IntegrationFlow/IntegrationFlow';
import { ElementDetailsModal } from './components/ElementDetailsModal/ElementDetailsModal';
import { Integration, Element, Service } from './types/integration';
import { loadIntegrations } from './utils/integrationLoader';

function App() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedElement, setSelectedElement] = useState<Element | Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const loadedIntegrations = await loadIntegrations();
        setIntegrations(loadedIntegrations);
        if (loadedIntegrations.length > 0) {
          setSelectedIntegration(loadedIntegrations[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки интеграций');
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleIntegrationSelect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setSelectedElement(null);
    setIsModalOpen(false);
  };

  const handleElementClick = (elementId: string | number) => {
    let element: Element | Service | null = null;
    
    selectedIntegration?.segments.forEach(segment => {
      segment.elements.forEach(el => {
        if (el.id === elementId) {
          element = el;
        }
        el.services?.forEach(service => {
          if (service.id === elementId) {
            element = service;
          }
        });
      });
    });

    setSelectedElement(element);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      
      {/* Левая панель со списком интеграций */}
      <Box sx={{ width: 300, flexShrink: 0, borderRight: '1px solid #e0e0e0' }}>
        <IntegrationList
          integrations={integrations}
          selectedIntegration={selectedIntegration}
          onSelectIntegration={handleIntegrationSelect}
        />
      </Box>

      {/* Основной контент */}
      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        {selectedIntegration && (
          <IntegrationFlow
            integration={selectedIntegration}
            selectedElementId={selectedElement?.id || null}
            onElementClick={handleElementClick}
          />
        )}
      </Box>

      {/* Модальное окно с деталями */}
      <ElementDetailsModal
        element={selectedElement}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Box>
  );
}

export default App; 