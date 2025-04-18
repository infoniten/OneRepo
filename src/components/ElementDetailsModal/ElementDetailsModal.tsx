import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Element, Service } from '../../types/integration';

interface ElementDetailsModalProps {
  element: Element | Service | null;
  open: boolean;
  onClose: () => void;
}

const isService = (element: Element | Service): element is Service => {
  return 'service' in element;
};

const isElement = (element: Element | Service): element is Element => {
  return 'type' in element;
};

const ParameterSection = ({ title, params }: { title: string; params: Record<string, any> }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
      {title}
    </Typography>
    <List dense>
      {Object.entries(params).map(([key, value]) => (
        <ListItem key={key}>
          <ListItemText
            primary={`${key}:`}
            secondary={value !== undefined ? String(value) : '-'}
          />
        </ListItem>
      ))}
    </List>
  </Box>
);

export const ElementDetailsModal: React.FC<ElementDetailsModalProps> = ({ element, open, onClose }) => {
  if (!element) return null;

  const getInParams = (element: Element | Service) => {
    if (isService(element)) {
      return {
        host: element.connectionInfo?.host,
        port: element.connectionInfo?.port,
        url: element.connectionInfo?.url,
        dn_ist: element.dnName,
        dn_nat: undefined,
        dn_prom: undefined,
        kafka_topic: undefined,
        group_id: undefined,
        bootstrap: undefined,
      };
    }
    return {
      host: element.connection?.url?.split(':')[0],
      port: element.connection?.port,
      url: element.connection?.url,
      dn_ist: undefined,
      dn_nat: undefined,
      dn_prom: undefined,
      kafka_topic: element.kafkaConfig?.max_message_bytes,
      group_id: undefined,
      bootstrap: undefined,
    };
  };

  const getOutParams = (element: Element | Service) => {
    if (isService(element)) {
      return {
        host: element.destinationInfo?.host,
        port: element.destinationInfo?.port,
        url: element.destinationInfo?.url,
        dn_ist: undefined,
        dn_nat: undefined,
        dn_prom: undefined,
      };
    }
    return {
      host: undefined,
      port: undefined,
      url: undefined,
      dn_ist: undefined,
      dn_nat: undefined,
      dn_prom: undefined,
    };
  };

  const getCommonSettings = (_: Element | Service) => {
    return {
      max_buff_size: undefined,
      redelivery_count: undefined,
      cpu: undefined,
      memory: undefined,
    };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          minWidth: '400px',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {isElement(element) ? element.name : element.service}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <ParameterSection title="In-параметры" params={getInParams(element)} />
        <ParameterSection title="Out-параметры" params={getOutParams(element)} />
        <ParameterSection title="Общие настройки" params={getCommonSettings(element)} />
        
        {/* Схема валидации - пока просто заглушка */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Схема валидации
          </Typography>
          <Typography variant="body2" color="text.secondary">
            yaml.ois-schema.xsd
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}; 