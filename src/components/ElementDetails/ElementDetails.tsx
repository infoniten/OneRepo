import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { Element, Service, SecurityPrincipal, ValidationIssue } from '../../types/integration';
import Badge from '../Badge/Badge';
import './ElementDetails.css';

interface ElementDetailsProps {
  element: Element & {
    warnings?: ValidationIssue[];
    errors?: ValidationIssue[];
  };
}

const isService = (element: Element | Service): element is Service => {
  return 'service' in element;
};

const isElement = (element: Element | Service): element is Element => {
  return 'type' in element;
};

export const ElementDetails: React.FC<ElementDetailsProps> = ({ element }) => {
  const warningCount = element.warn || 0;
  const errorCount = element.error || 0;

  if (!element) {
    return (
      <Paper elevation={3} sx={{ p: 2, m: 2 }}>
        <Typography variant="body1">No element selected</Typography>
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper elevation={3} sx={{ p: 2, m: 2 }}>
        <div className="element-header">
          <Typography variant="h6" gutterBottom>
            {isElement(element) && element.name ? element.name : isService(element) ? element.service : 'Unnamed Element'}
          </Typography>
          <div className="element-badges">
            {warningCount > 0 && <Badge type="warning" count={warningCount} />}
            {errorCount > 0 && <Badge type="error" count={errorCount} />}
          </div>
        </div>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Type: {isService(element) ? element.service : element.type}
          {isService(element) && element.subType && ` (${element.subType})`}
        </Typography>

        {isService(element) && element.connectionInfo && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Connection Details:</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary={`URL: ${element.connectionInfo.url}`}
                  secondary={`Host: ${element.connectionInfo.host}, Port: ${element.connectionInfo.port}`}
                />
              </ListItem>
            </List>
          </Box>
        )}

        {isElement(element) && element.connection && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Connection Details:</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary={`URL: ${element.connection.url}`}
                  secondary={`Host: ${element.connection.host}, Port: ${element.connection.port}`}
                />
              </ListItem>
            </List>
          </Box>
        )}

        {isElement(element) && element.security && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Security:</Typography>
            <List dense>
              {element.security.principals.map((principal: SecurityPrincipal, index: number) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`Principal: ${principal.principal}`}
                    secondary={`Operations: ${principal.operations.join(', ')}${principal.group ? `, Groups: ${principal.group.join(', ')}` : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {isElement(element) && element.kafkaConfig && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Kafka Configuration:</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary={`Max Message Bytes: ${element.kafkaConfig.max_message_bytes}`}
                  secondary={`Retention MS: ${element.kafkaConfig.retention_ms}`}
                />
              </ListItem>
            </List>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default ElementDetails; 