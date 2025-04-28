import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, List, ListItem, ListItemText, IconButton, Chip, Divider, TextField, Button, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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

const ALL_OPERATIONS = ['read', 'write', 'describe', 'delete', 'alter'];

type Principal = { principal: string; operations: string[]; group: string[] };

const KafkaSection = ({ element, onSave }: { element: Element, onSave?: (patch: Partial<Element>) => void }) => {
  const [editMode, setEditMode] = useState(false);
  const [partitions, setPartitions] = useState(element.partitions || 1);
  const [config, setConfig] = useState<{ key: string; value: string }[]>(
    element.configuration
      ? Object.entries(element.configuration).map(([key, value]) => ({ key, value: String(value) }))
      : []
  );
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [security, setSecurity] = useState<Principal[]>(
    element.security
      ? element.security.principals.map(p => ({
          principal: p.principal,
          operations: p.operations,
          group: p.group ?? []
        }))
      : []
  );
  const [editAclIdx, setEditAclIdx] = useState<number | null>(null);
  const [newAcl, setNewAcl] = useState<Principal>({ principal: '', operations: [], group: [] });
  const [addMode, setAddMode] = useState(false);

  const handleConfigChange = (idx: number, field: 'key' | 'value', value: string) => {
    setConfig(cfg => cfg.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleRemoveConfig = (idx: number) => {
    setConfig(cfg => cfg.filter((_, i) => i !== idx));
  };

  const handleAddConfig = () => {
    if (newKey.trim()) {
      setConfig(cfg => [...cfg, { key: newKey.trim(), value: newValue.trim() }]);
      setNewKey('');
      setNewValue('');
    }
  };

  const handleSave = () => {
    const configuration = config.reduce((acc, { key, value }) => {
      acc[key] = isNaN(Number(value)) ? value : Number(value);
      return acc;
    }, {} as Record<string, any>);
    onSave && onSave({ partitions, configuration });
    setEditMode(false);
  };

  const handleAclChange = (idx: number, field: string, value: any) => {
    setSecurity(list => list.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleAclRemove = (idx: number) => {
    setSecurity(list => list.filter((_, i) => i !== idx));
  };
  const handleAclEdit = (idx: number) => {
    setEditAclIdx(idx);
  };
  const handleAclAdd = () => {
    setSecurity(list => [...list, { ...newAcl }]);
    setNewAcl({ principal: '', operations: [], group: [] });
    setAddMode(false);
  };

  if (!isKafkaElement(element)) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Kafka Configuration
      </Typography>
      {!editMode && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            size="medium"
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setEditMode(true)}
          >
            Редактировать
          </Button>
        </Box>
      )}
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
            secondary={editMode ? (
              <TextField
                type="number"
                size="small"
                variant="outlined"
                inputProps={{ min: 1 }}
                value={partitions}
                onChange={e => setPartitions(Number(e.target.value))}
                sx={{ width: 100 }}
              />
            ) : partitions}
          />
        </ListItem>
      </List>

      {(config.length > 0 || editMode) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Конфигурация
          </Typography>
          <List dense>
            {config.map((item, idx) => (
              <ListItem key={idx} sx={{ alignItems: 'center', gap: 2 }}
                secondaryAction={editMode && (
                  <IconButton edge="end" size="small" onClick={() => handleRemoveConfig(idx)}>
                    ❌
                  </IconButton>
                )}>
                {editMode ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                    <TextField
                      label="Key"
                      size="small"
                      variant="outlined"
                      value={item.key}
                      onChange={e => handleConfigChange(idx, 'key', e.target.value)}
                      sx={{ width: 180 }}
                    />
                    <TextField
                      label="Value"
                      size="small"
                      variant="outlined"
                      value={item.value}
                      onChange={e => handleConfigChange(idx, 'value', e.target.value)}
                      sx={{ width: 180 }}
                    />
                  </Box>
                ) : (
                  <ListItemText primary={item.key} secondary={item.value} />
                )}
              </ListItem>
            ))}
            {editMode && (
              <ListItem sx={{ alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                  <TextField
                    label="Key"
                    size="small"
                    variant="outlined"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    sx={{ width: 180 }}
                  />
                  <TextField
                    label="Value"
                    size="small"
                    variant="outlined"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    sx={{ width: 180 }}
                  />
                  <IconButton size="small" onClick={handleAddConfig} color="primary">
                    ➕
                  </IconButton>
                </Box>
              </ListItem>
            )}
          </List>
        </>
      )}
      {editMode && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>Сохранить</Button>
          <Button variant="text" onClick={() => setEditMode(false)}>Отмена</Button>
        </Box>
      )}

      {element.security && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Security
            </Typography>
          </Box>
          <List dense>
            {security.map((principal, idx) => (
              <ListItem key={idx} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                {editAclIdx === idx ? (
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <TextField
                      label="Principal"
                      value={principal.principal}
                      onChange={e => handleAclChange(idx, 'principal', e.target.value)}
                      size="small"
                      sx={{ mb: 1, width: 260 }}
                    />
                    <Autocomplete
                      multiple
                      options={ALL_OPERATIONS}
                      value={principal.operations}
                      onChange={(_, value) => handleAclChange(idx, 'operations', value)}
                      renderInput={params => <TextField {...params} label="Operations" size="small" sx={{ mb: 1, width: 260 }} />}
                    />
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
                      value={principal.group || []}
                      onChange={(_, value) => handleAclChange(idx, 'group', value)}
                      renderInput={params => <TextField {...params} label="Groups" size="small" sx={{ width: 260 }} />}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button size="small" variant="contained" onClick={() => handleAclEdit(idx)}>Сохранить</Button>
                      <Button size="small" onClick={() => setEditAclIdx(null)}>Отмена</Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>{principal.principal}</Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Operations:</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {principal.operations.map((op, i) => (
                          <Chip key={i} label={op} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                    {principal.group && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Groups:</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {principal.group.map((g, i) => (
                            <Chip key={i} label={g} size="small" color="secondary" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        variant="text"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => handleAclEdit(idx)}
                      >
                        Редактировать
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleAclRemove(idx)}
                      >
                        Удалить
                      </Button>
                    </Box>
                  </Box>
                )}
              </ListItem>
            ))}
            {addMode ? (
              <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ width: '100%', mb: 1 }}>
                  <TextField
                    label="Principal"
                    value={newAcl.principal}
                    onChange={e => setNewAcl(a => ({ ...a, principal: e.target.value }))}
                    size="small"
                    sx={{ mb: 1, width: 260 }}
                  />
                  <Autocomplete
                    multiple
                    options={ALL_OPERATIONS}
                    value={newAcl.operations}
                    onChange={(_, value) => setNewAcl(a => ({ ...a, operations: value }))}
                    renderInput={params => <TextField {...params} label="Operations" size="small" sx={{ mb: 1, width: 260 }} />}
                  />
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={newAcl.group}
                    onChange={(_, value) => setNewAcl(a => ({ ...a, group: value }))}
                    renderInput={params => <TextField {...params} label="Groups" size="small" sx={{ width: 260 }} />}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="contained" onClick={handleAclAdd}>Добавить</Button>
                    <Button size="small" onClick={() => setAddMode(false)}>Отмена</Button>
                  </Box>
                </Box>
              </ListItem>
            ) : null}
          </List>
          {!addMode && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <Button
                size="medium"
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddMode(true)}
                sx={{ mt: 1 }}
              >
                Добавить новый ACL
              </Button>
            </Box>
          )}
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

export const ElementDetailsModal: React.FC<ElementDetailsModalProps & { onKafkaSave?: (patch: Partial<Element>) => void }> = ({ element, open, onClose, onKafkaSave }) => {
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
          <KafkaSection element={element} onSave={onKafkaSave} />
        )}
      </DialogContent>
    </Dialog>
  );
}; 