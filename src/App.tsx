import { useState, useEffect, useCallback } from 'react';
import { Box, CssBaseline, CircularProgress, Typography } from '@mui/material';
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

  // Функция для загрузки списка интеграций
  const fetchIntegrations = useCallback(async () => {
    try {
      const loadedIntegrations = await loadIntegrations();
      
      // Проверяем, изменился ли список интеграций
      const currentIntegrationsJson = JSON.stringify(integrations);
      const loadedIntegrationsJson = JSON.stringify(loadedIntegrations);
      const hasChanges = currentIntegrationsJson !== loadedIntegrationsJson;
      
      if (hasChanges) {
        console.log('Detected changes in integrations, updating state...');
        setIntegrations(loadedIntegrations);
        
        // Если нет выбранной интеграции, выбираем первую
        if (!selectedIntegration && loadedIntegrations.length > 0) {
          setSelectedIntegration(loadedIntegrations[0]);
        } else if (selectedIntegration) {
          // Если есть выбранная интеграция, обновляем её данные
          const updatedIntegration = loadedIntegrations.find(
            integration => integration.name === selectedIntegration.name
          );
          if (updatedIntegration) {
            setSelectedIntegration(updatedIntegration);
          } else if (loadedIntegrations.length > 0) {
            // Если выбранная интеграция больше не существует, выбираем первую
            setSelectedIntegration(loadedIntegrations[0]);
          }
        }
      }
      
      if (loading) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки интеграций');
      setLoading(false);
    }
  }, [integrations, selectedIntegration, loading]);

  // Инициализация и настройка интервала обновления
  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;

    const pollIntegrations = async () => {
      if (!isSubscribed) return;

      await fetchIntegrations();
      
      // Планируем следующий запрос только после завершения текущего
      timeoutId = setTimeout(pollIntegrations, 5000);
    };

    // Запускаем первый запрос
    pollIntegrations();

    return () => {
      isSubscribed = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchIntegrations]);

  const handleIntegrationSelect = useCallback((integration: Integration) => {
    setSelectedIntegration(integration);
    setSelectedElement(null);
    setIsModalOpen(false);
  }, []);

  const handleElementClick = useCallback((elementId: string | number) => {
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
  }, [selectedIntegration]);

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
            key={selectedIntegration.name}
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