import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { Integration } from '../../types/integration';

interface IntegrationListProps {
  integrations: Integration[];
  selectedIntegration: Integration | null;
  onSelectIntegration: (integration: Integration) => void;
}

const IntegrationList: React.FC<IntegrationListProps> = ({
  integrations,
  selectedIntegration,
  onSelectIntegration,
}) => {
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRight: '1px solid #e0e0e0' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        Интеграционные потоки
      </Typography>
      <List>
        {integrations.map((integration) => (
          <ListItem key={integration.name} disablePadding>
            <ListItemButton
              selected={selectedIntegration?.name === integration.name}
              onClick={() => onSelectIntegration(integration)}
            >
              <ListItemText
                primary={integration.name}
                secondary={integration.description}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: selectedIntegration?.name === integration.name ? 'bold' : 'normal',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default IntegrationList; 