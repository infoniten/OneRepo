import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, List, ListItem, ListItemText, IconButton, Chip, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Element, Service } from '../../types/integration';

interface ElementDetailsModalProps {
  element: Element | Service | null;
  open: boolean;
  onClose: () => void;
}

const isElement = (element: Element | Service): element is Element => {
  return 'type' in element;
};

const isKafkaElement = (element: Element | Service): boolean => {
  return isElement(element) && element.type.toLowerCase() === 'kafka';
};

const formatRetentionMs = (ms: number): string => {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  return `${days} дней`;
};

const formatBytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb} MB`;
};

const KafkaSection = ({ element }: { element: Element }) => {
  if (!isKafkaElement(element)) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Kafka Configuration
      </Typography>
      <List dense>
        <ListItem>
          <ListItemText
            primary="Topic Name"
            secondary={element.name}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Partitions"
            secondary={element.partitions}
          />
        </ListItem>
        {element.configuration && (
          <>
            <ListItem>
              <ListItemText
                primary="Max Message Size"
                secondary={element.configuration?.['max.message.bytes'] ? formatBytes(element.configuration['max.message.bytes']) : '-'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Retention Period"
                secondary={element.configuration?.['retention.ms'] ? formatRetentionMs(element.configuration['retention.ms']) : '-'}
              />
            </ListItem>
          </>
        )}
      </List>

      {element.security && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Security
          </Typography>
          <List dense>
            {element.security.principals.map((principal, index) => (
              <ListItem key={index}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {principal.principal}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Operations:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {principal.operations.map((op, i) => (
                        <Chip key={i} label={op} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  {principal.group && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Groups:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {principal.group.map((g, i) => (
                          <Chip key={i} label={g} size="small" color="secondary" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {element.connectionInfo && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Connection Info
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Host"
                secondary={element.connectionInfo.host}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Port"
                secondary={element.connectionInfo.port}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="URL"
                secondary={element.connectionInfo.url}
              />
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );
};

export const ElementDetailsModal: React.FC<ElementDetailsModalProps> = ({ element, open, onClose }) => {
  if (!element) return null;

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
        <Box>
          <Typography variant="h6" component="div">
            {isElement(element) ? element.name : element.service}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {element.type}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isElement(element) && isKafkaElement(element) && (
          <KafkaSection element={element} />
        )}
      </DialogContent>
    </Dialog>
  );
}; 