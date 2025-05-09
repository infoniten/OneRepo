import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, List, ListItem, ListItemText, IconButton, Chip, Divider, TextField, Button, Autocomplete, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIconMui from '@mui/icons-material/Close';
import ReactFlow, { Background, Controls, Node, Edge, NodeProps, MarkerType, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Element, Service } from '../../types/integration';
import { motion } from 'framer-motion';
import Badge from '../Badge/Badge';

interface ElementDetailsModalProps {
  element: Element | Service | null;
  open: boolean;
  onClose: () => void;
  onKafkaSave?: (patch: Partial<Element>) => Promise<void>;
  onNginxSave?: (patch: Partial<Element>) => Promise<void>;
  onGeoBalancerSave?: (patch: Partial<Element>) => Promise<void>;
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

  const handleAclChange = (idx: number, field: string, value: any) => {
    setSecurity(list => list.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAclRemove = (idx: number) => {
    setSecurity(list => list.filter((_, i) => i !== idx));
  };

  const handleAclEdit = (idx: number) => {
    if (editAclIdx === idx) {
      onSave && onSave({
        ...element,
        security: {
          principals: security.map(p => ({
            principal: p.principal,
            operations: p.operations,
            group: p.group
          }))
        }
      });
      setEditAclIdx(null);
    } else {
      setEditAclIdx(idx);
    }
  };

  const handleAclAdd = () => {
    if (newAcl.principal.trim() && newAcl.operations.length > 0) {
      const updatedSecurity = [...security, { ...newAcl }];
      setSecurity(updatedSecurity);
      onSave && onSave({
        ...element,
        security: {
          principals: updatedSecurity.map(p => ({
            principal: p.principal,
            operations: p.operations,
            group: p.group
          }))
        }
      });
      setNewAcl({ principal: '', operations: [], group: [] });
      setAddMode(false);
    }
  };

  const handleSave = () => {
    const configuration = config.reduce((acc, { key, value }) => {
      acc[key] = isNaN(Number(value)) ? value : Number(value);
      return acc;
    }, {} as Record<string, any>);

    onSave && onSave({
      ...element,
      partitions,
      configuration,
      security: {
        principals: security.map(p => ({
          principal: p.principal,
          operations: p.operations,
          group: p.group
        }))
      }
    });
    setEditMode(false);
  };

  if (!isKafkaElement(element)) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Kafka Configuration
        </Typography>
        {((element.warn && element.warn > 0) || (element.error && element.error > 0)) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {element.warn && element.warn > 0 && <Badge type="warning" count={element.warn} />}
            {element.error && element.error > 0 && <Badge type="error" count={element.error} />}
          </Box>
        )}
      </Box>
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
            Configuration
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
          </List>
        </>
      )}
    </Box>
  );
};

const NginxSection = ({ element, onSave }: { element: Element, onSave?: (patch: Partial<Element>) => void }) => {
  const [requestSchemaContent, setRequestSchemaContent] = useState<string | undefined>(() => 
    element.requestSchemaValidation
  );
  const [responseSchemaContent, setResponseSchemaContent] = useState<string | undefined>(() => 
    element.responseSchemaValidation
  );
  const [showRequestSchema, setShowRequestSchema] = useState(false);
  const [showResponseSchema, setShowResponseSchema] = useState(false);
  const [modSecRules, setModSecRules] = useState<string[]>(() =>
    (element as any).modSecurityTurnedOffRules ? [...(element as any).modSecurityTurnedOffRules] : []
  );
  const [newRule, setNewRule] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [requestType, setRequestType] = useState<string[]>(() =>
    Array.isArray((element as any).requestType)
      ? (element as any).requestType
      : (typeof (element as any).requestType === 'string' && (element as any).requestType)
        ? [(element as any).requestType]
        : []
  );
  const [nginxPort, setNginxPort] = useState(() => (element as any).nginxPort || '');
  const [remoteHost, setRemoteHost] = useState(() => (element as any).remoteHost || '');
  const [editingRequestSchema, setEditingRequestSchema] = useState(false);
  const [editingResponseSchema, setEditingResponseSchema] = useState(false);
  const [tempRequestSchema, setTempRequestSchema] = useState('');
  const [tempResponseSchema, setTempResponseSchema] = useState('');

  useEffect(() => {
    setRequestSchemaContent(element.requestSchemaValidation);
    setResponseSchemaContent(element.responseSchemaValidation);
    setModSecRules((element as any).modSecurityTurnedOffRules ? [...(element as any).modSecurityTurnedOffRules] : []);
    setRequestType(
      Array.isArray((element as any).requestType)
        ? (element as any).requestType
        : (typeof (element as any).requestType === 'string' && (element as any).requestType)
          ? [(element as any).requestType]
          : []
    );
    setNginxPort((element as any).nginxPort || '');
    setRemoteHost((element as any).remoteHost || '');
  }, [element]);

  const handleViewSchema = async (filePath: string, type: 'request' | 'response') => {
    if (type === 'request') {
      setRequestSchemaContent(filePath);
      setTempRequestSchema(filePath);
      setShowRequestSchema(true);
    } else {
      setResponseSchemaContent(filePath);
      setTempResponseSchema(filePath);
      setShowResponseSchema(true);
    }
  };

  const handleSchemaEdit = (type: 'request' | 'response') => {
    if (type === 'request') {
      setEditingRequestSchema(true);
      setTempRequestSchema(requestSchemaContent || '');
    } else {
      setEditingResponseSchema(true);
      setTempResponseSchema(responseSchemaContent || '');
    }
  };

  const handleSchemaSave = (type: 'request' | 'response') => {
    if (type === 'request') {
      setRequestSchemaContent(tempRequestSchema);
      setEditingRequestSchema(false);
      onSave && onSave({
        ...element,
        requestType,
        nginxPort: nginxPort ? Number(nginxPort) : undefined,
        remoteHost,
        modSecurityTurnedOffRules: modSecRules,
        requestSchemaValidation: tempRequestSchema,
        responseSchemaValidation: responseSchemaContent
      });
    } else {
      setResponseSchemaContent(tempResponseSchema);
      setEditingResponseSchema(false);
      onSave && onSave({
        ...element,
        requestType,
        nginxPort: nginxPort ? Number(nginxPort) : undefined,
        remoteHost,
        modSecurityTurnedOffRules: modSecRules,
        requestSchemaValidation: requestSchemaContent,
        responseSchemaValidation: tempResponseSchema
      });
    }
  };

  const handleSchemaCancel = (type: 'request' | 'response') => {
    if (type === 'request') {
      setEditingRequestSchema(false);
      setTempRequestSchema(requestSchemaContent || '');
    } else {
      setEditingResponseSchema(false);
      setTempResponseSchema(responseSchemaContent || '');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'request' | 'response') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (type === 'request') {
          setRequestSchemaContent(content);
          onSave && onSave({
            requestType,
            nginxPort: nginxPort ? Number(nginxPort) : undefined,
            remoteHost,
            modSecurityTurnedOffRules: modSecRules,
            requestSchemaValidation: content,
            responseSchemaValidation: responseSchemaContent
          });
        } else {
          setResponseSchemaContent(content);
          onSave && onSave({
            requestType,
            nginxPort: nginxPort ? Number(nginxPort) : undefined,
            remoteHost,
            modSecurityTurnedOffRules: modSecRules,
            requestSchemaValidation: requestSchemaContent,
            responseSchemaValidation: content
          });
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleRemoveRule = (rule: string) => {
    const updatedRules = modSecRules.filter(r => r !== rule);
    setModSecRules(updatedRules);
    onSave && onSave({
      ...element,
      modSecurityTurnedOffRules: updatedRules
    });
  };

  const handleAddRule = () => {
    if (newRule.trim() && !modSecRules.includes(newRule.trim())) {
      const updatedRules = [...modSecRules, newRule.trim()];
      setModSecRules(updatedRules);
      onSave && onSave({
        ...element,
        modSecurityTurnedOffRules: updatedRules
      });
      setNewRule('');
    }
  };

  const handleDeleteSchema = (type: 'request' | 'response') => {
    if (type === 'request') {
      setRequestSchemaContent(undefined);
      onSave && onSave({
        ...element,
        requestType,
        nginxPort: nginxPort ? Number(nginxPort) : undefined,
        remoteHost,
        modSecurityTurnedOffRules: modSecRules,
        requestSchemaValidation: undefined,
        responseSchemaValidation: responseSchemaContent
      });
    } else {
      setResponseSchemaContent(undefined);
      onSave && onSave({
        ...element,
        requestType,
        nginxPort: nginxPort ? Number(nginxPort) : undefined,
        remoteHost,
        modSecurityTurnedOffRules: modSecRules,
        requestSchemaValidation: requestSchemaContent,
        responseSchemaValidation: undefined
      });
    }
  };

  const handleSave = () => {
    onSave && onSave({
      ...element,
      requestType,
      nginxPort: nginxPort ? Number(nginxPort) : undefined,
      remoteHost,
      modSecurityTurnedOffRules: modSecRules,
      requestSchemaValidation: requestSchemaContent,
      responseSchemaValidation: responseSchemaContent
    });
    setEditMode(false);
  };

  if (element.type.toLowerCase() !== 'nginx') return null;
  const nginx = element as Element & {
    requestType?: string;
    nginxPort?: number;
    remoteHost?: string;
    modSecurityTurnedOffRules?: string[];
    requestSchemaValidation?: string;
    responseSchemaValidation?: string;
  };
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Nginx Configuration
        </Typography>
        {((nginx.warn && nginx.warn > 0) || (nginx.error && nginx.error > 0)) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {nginx.warn && nginx.warn > 0 && <Badge type="warning" count={nginx.warn} />}
            {nginx.error && nginx.error > 0 && <Badge type="error" count={nginx.error} />}
          </Box>
        )}
      </Box>
      <List dense>
        <ListItem>
          <ListItemText
            primary="Request Type"
            secondary={editMode ? (
              <Select
                size="small"
                multiple
                value={requestType}
                onChange={e => setRequestType(typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[])}
                sx={{ width: 200 }}
                renderValue={(selected) => (selected as string[]).join(', ')}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            ) : requestType.join(', ')}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Nginx Port"
            secondary={editMode ? (
              <TextField
                size="small"
                type="number"
                value={nginxPort}
                onChange={e => setNginxPort(e.target.value)}
                sx={{ width: 200 }}
              />
            ) : nginxPort}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Remote Host"
            secondary={editMode ? (
              <TextField
                size="small"
                value={remoteHost}
                onChange={e => setRemoteHost(e.target.value)}
                sx={{ width: 200 }}
              />
            ) : remoteHost}
          />
        </ListItem>
        <ListItem>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 160, flex: '0 0 auto' }}>
              <InsertDriveFileIcon color="action" sx={{ mr: 1 }} />
              <Typography>Request Schema Validation</Typography>
            </Box>
            {nginx.requestSchemaValidation && (
              <Typography
                sx={{
                  color: 'text.secondary',
                  ml: 1,
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto'
                }}
                title={nginx.requestSchemaValidation.split('/').pop()}
              >
                {nginx.requestSchemaValidation.split('/').pop()?.replace(/^xs:schema>/, '')}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
              {nginx.requestSchemaValidation ? (
                <>
                  <IconButton size="small" onClick={() => handleViewSchema(nginx.requestSchemaValidation!, 'request')} title="Просмотреть">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <Button
                    size="small"
                    component="label"
                    sx={{ minWidth: 'unset', px: 1 }}
                  >
                    Заменить
                    <input type="file" hidden onChange={e => handleFileChange(e, 'request')} />
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteSchema('request')}
                    title="Удалить"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Button
                  size="small"
                  component="label"
                  sx={{ minWidth: 'unset', px: 1 }}
                >
                  Добавить
                  <input type="file" hidden onChange={e => handleFileChange(e, 'request')} />
                </Button>
              )}
            </Box>
          </Box>
        </ListItem>
        <ListItem>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 160, flex: '0 0 auto' }}>
              <InsertDriveFileIcon color="action" sx={{ mr: 1 }} />
              <Typography>Response Schema Validation</Typography>
            </Box>
            {nginx.responseSchemaValidation && (
              <Typography
                sx={{
                  color: 'text.secondary',
                  ml: 1,
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto'
                }}
                title={nginx.responseSchemaValidation.split('/').pop()}
              >
                {nginx.responseSchemaValidation.split('/').pop()?.replace(/^xs:schema>/, '')}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
              {nginx.responseSchemaValidation ? (
                <>
                  <IconButton size="small" onClick={() => handleViewSchema(nginx.responseSchemaValidation!, 'response')} title="Просмотреть">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <Button
                    size="small"
                    component="label"
                    sx={{ minWidth: 'unset', px: 1 }}
                  >
                    Заменить
                    <input type="file" hidden onChange={e => handleFileChange(e, 'response')} />
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteSchema('response')}
                    title="Удалить"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Button
                  size="small"
                  component="label"
                  sx={{ minWidth: 'unset', px: 1 }}
                >
                  Добавить
                  <input type="file" hidden onChange={e => handleFileChange(e, 'response')} />
                </Button>
              )}
            </Box>
          </Box>
        </ListItem>
      </List>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {!editMode ? (
          <Button variant="outlined" size="small" onClick={() => setEditMode(true)}>
            Редактировать
          </Button>
        ) : (
          <>
            <Button variant="contained" size="small" onClick={handleSave}>
              Сохранить
            </Button>
            <Button variant="text" size="small" onClick={() => setEditMode(false)}>
              Отмена
            </Button>
          </>
        )}
      </Box>
      {modSecRules.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Disabled modSecurity Rules
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {modSecRules.map((rule, idx) => (
              <Chip
                key={idx}
                label={rule}
                color="info"
                onDelete={() => handleRemoveRule(rule)}
                deleteIcon={<CloseIconMui />}
                sx={{ fontSize: '1rem' }}
              />
            ))}
          </Box>
        </>
      )}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
        <TextField
          size="small"
          label="Add Rule"
          value={newRule}
          onChange={e => setNewRule(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddRule(); }}
          sx={{ width: 200 }}
        />
        <Button variant="contained" size="small" onClick={handleAddRule} disabled={!newRule.trim() || modSecRules.includes(newRule.trim())}>
          Добавить
        </Button>
      </Box>
      <Dialog open={showRequestSchema} onClose={() => setShowRequestSchema(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Request Schema Content
            {!editingRequestSchema ? (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleSchemaEdit('request')}
              >
                Редактировать
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => handleSchemaSave('request')}
                >
                  Сохранить
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSchemaCancel('request')}
                >
                  Отмена
                </Button>
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {editingRequestSchema ? (
            <TextField
              multiline
              fullWidth
              minRows={10}
              maxRows={20}
              value={tempRequestSchema}
              onChange={(e) => setTempRequestSchema(e.target.value)}
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                } 
              }}
            />
          ) : (
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-all',
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              {requestSchemaContent}
            </pre>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showResponseSchema} onClose={() => setShowResponseSchema(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Response Schema Content
            {!editingResponseSchema ? (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleSchemaEdit('response')}
              >
                Редактировать
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => handleSchemaSave('response')}
                >
                  Сохранить
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSchemaCancel('response')}
                >
                  Отмена
                </Button>
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {editingResponseSchema ? (
            <TextField
              multiline
              fullWidth
              minRows={10}
              maxRows={20}
              value={tempResponseSchema}
              onChange={(e) => setTempResponseSchema(e.target.value)}
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                } 
              }}
            />
          ) : (
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-all',
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              {responseSchemaContent}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

interface Server {
  host: string;
  port: number;
}

interface HealthCheck {
  url: string;
  port: number;
  interval: number;
  rise: number;
  fall: number;
  timeout: number;
  expect: string;
}

const GeoBalancerSection = ({ element, onSave }: { element: Element, onSave?: (patch: Partial<Element>) => void }) => {
  const [editMode, setEditMode] = useState(false);
  const [servers, setServers] = useState<Server[]>(
    element.servers || []
  );
  const [healthCheck, setHealthCheck] = useState<HealthCheck>(
    element.healthCheck || {
      url: '',
      port: 0,
      interval: 0,
      rise: 0,
      fall: 0,
      timeout: 0,
      expect: ''
    }
  );

  useEffect(() => {
    setServers(element.servers || []);
    setHealthCheck(element.healthCheck || {
      url: '',
      port: 0,
      interval: 0,
      rise: 0,
      fall: 0,
      timeout: 0,
      expect: ''
    });
  }, [element]);

  const handleAddServer = () => {
    if (!editMode) return;
    const newServers = [...servers, { host: '', port: 443 }];
    setServers(newServers);
  };

  const handleRemoveServer = (index: number) => {
    if (!editMode) return;
    const newServers = servers.filter((_, i) => i !== index);
    setServers(newServers);
  };

  const handleServerChange = (index: number, field: keyof Server, value: string | number) => {
    if (!editMode) return;
    const newServers = servers.map((server, i) => 
      i === index ? { ...server, [field]: value } : server
    );
    setServers(newServers);
  };

  const handleHealthCheckChange = (field: keyof HealthCheck, value: string | number) => {
    if (!editMode) return;
    const newHealthCheck = { ...healthCheck, [field]: value };
    setHealthCheck(newHealthCheck);
  };

  const handleSave = () => {
    onSave && onSave({
      ...element,
      servers,
      healthCheck
    });
    setEditMode(false);
  };

  if (!['geobalancer', 'geo-load-balancer'].includes(element.type.toLowerCase())) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Geo Balancer Configuration
        </Typography>
        {!editMode ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setEditMode(true)}
          >
            Редактировать
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
            >
              Сохранить
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setEditMode(false);
                setServers(element.servers || []);
                setHealthCheck(element.healthCheck || {
                  url: '',
                  port: 0,
                  interval: 0,
                  rise: 0,
                  fall: 0,
                  timeout: 0,
                  expect: ''
                });
              }}
            >
              Отмена
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Servers</Typography>
          {editMode && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddServer}
            >
              Add Server
            </Button>
          )}
        </Box>
        <List dense>
          {servers.map((server, index) => (
            <ListItem key={index}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                <TextField
                  size="small"
                  label="Host"
                  value={server.host}
                  onChange={(e) => handleServerChange(index, 'host', e.target.value)}
                  sx={{ flex: 1 }}
                  disabled={!editMode}
                  InputProps={
                    !editMode ? {
                      style: {
                        background: '#f5f5f5',
                        color: '#222',
                        opacity: 1
                      }
                    } : {}
                  }
                />
                <TextField
                  size="small"
                  label="Port"
                  type="number"
                  value={server.port}
                  onChange={(e) => handleServerChange(index, 'port', Number(e.target.value))}
                  sx={{ width: 100 }}
                  disabled={!editMode}
                  InputProps={
                    !editMode ? {
                      style: {
                        background: '#f5f5f5',
                        color: '#222',
                        opacity: 1
                      }
                    } : {}
                  }
                />
                {editMode && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveServer(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Health Check</Typography>
        <List dense>
          {[
            { label: 'URL', field: 'url', type: 'text' },
            { label: 'Port', field: 'port', type: 'number' },
            { label: 'Interval (ms)', field: 'interval', type: 'number' },
            { label: 'Rise', field: 'rise', type: 'number' },
            { label: 'Fall', field: 'fall', type: 'number' },
            { label: 'Timeout (ms)', field: 'timeout', type: 'number' },
            { label: 'Expect', field: 'expect', type: 'text' }
          ].map(({ label, field, type }) => (
            <ListItem key={field}>
              <TextField
                fullWidth
                size="small"
                label={label}
                type={type}
                value={healthCheck[field as keyof HealthCheck]}
                onChange={(e) => handleHealthCheckChange(
                  field as keyof HealthCheck,
                  type === 'number' ? Number(e.target.value) : e.target.value
                )}
                disabled={!editMode}
                InputProps={
                  !editMode ? {
                    style: {
                      background: '#f5f5f5',
                      color: '#222',
                      opacity: 1
                    }
                  } : {}
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

// Компонент для отображения сервиса внутри k8s
const ServiceNode = ({ data }: NodeProps) => {
  const warningCount = data.warn || 0;
  const errorCount = data.error || 0;
  const isSelected = data.selected;

  const borderStyle = {
    color: errorCount > 0 ? '#ef5350' : warningCount > 0 ? '#ffa726' : '#2196F3',
    width: errorCount > 0 ? 2 : warningCount > 0 ? 2 : 1
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#2196F3',
          width: '12px',
          height: '12px',
          border: '2px solid white',
          top: '50%',
          transform: 'translateY(-50%)',
          left: '-7px',
          boxShadow: '0 0 0 2px #2196F3',
          opacity: 0.8
        }}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.3
        }}
        style={{
          padding: '12px',
          borderRadius: '8px',
          border: `${borderStyle.width}px solid`,
          borderColor: borderStyle.color,
          background: isSelected ? '#f8f9fa' : 'white',
          width: '100%',
          minWidth: '140px',
          boxShadow: isSelected
            ? `0 8px 16px rgba(0,0,0,0.1), 0 0 0 4px ${borderStyle.color}22`
            : errorCount > 0
              ? '0 4px 25px rgba(239, 83, 80, 0.35)'
              : warningCount > 0
                ? '0 4px 25px rgba(255, 167, 38, 0.35)'
                : '0 4px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isSelected ? 'translateY(-2px)' : 'none',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          animation: errorCount > 0 
            ? 'pulseError 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
            : warningCount > 0 
              ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              : 'none',
        }}
      >
        <Typography sx={{ fontSize: '14px', fontWeight: 500, textAlign: 'center' }}>
          {data.label}
        </Typography>
        <Typography sx={{ fontSize: '12px', color: 'text.secondary', textAlign: 'center' }}>
          {data.subType || 'service'}
        </Typography>
        {(warningCount > 0 || errorCount > 0) && (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
            {warningCount > 0 && <Badge type="warning" count={warningCount} />}
            {errorCount > 0 && <Badge type="error" count={errorCount} />}
          </Box>
        )}
      </motion.div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#2196F3',
          width: '12px',
          height: '12px',
          border: '2px solid white',
          top: '50%',
          transform: 'translateY(-50%)',
          right: '-7px',
          boxShadow: '0 0 0 2px #2196F3',
          opacity: 0.8
        }}
      />
    </Box>
  );
};

const KubernetesSection = ({ element }: { element: Element }) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Добавляем узлы сервисов
  if (element.services) {
    element.services.forEach((service, index) => {
      const xPos = 50 + (index * 200);
      nodes.push({
        id: service.id.toString(),
        type: 'service',
        position: { x: xPos, y: 50 },
        data: { 
          label: service.service,
          subType: service.subType,
          warn: service.warn || 0,
          error: service.error || 0,
          selected: false
        },
        style: {
          width: 140,
          height: (service.warn && service.warn > 0) || (service.error && service.error > 0) ? 120 : 90
        },
      });

      // Добавляем связь между сервисами
      if (index > 0) {
        edges.push({
          id: `e${service.id}-${element.services![index - 1].id}`,
          source: element.services![index - 1].id.toString(),
          target: service.id.toString(),
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#2196F3',
            strokeWidth: 2,
            opacity: 0.8
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2196F3',
            width: 12,
            height: 12
          }
        });
      }
    });
  }

  return (
    <Box sx={{ 
      height: 600, 
      width: '100%', 
      bgcolor: 'rgba(33, 150, 243, 0.05)',
      borderRadius: '8px',
      p: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Kubernetes Configuration
        </Typography>
        {((element.warn && element.warn > 0) || (element.error && element.error > 0)) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {element.warn && element.warn > 0 && <Badge type="warning" count={element.warn} />}
            {element.error && element.error > 0 && <Badge type="error" count={element.error} />}
          </Box>
        )}
      </Box>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ service: ServiceNode }}
        fitView
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={true}
        panOnScroll={true}
        preventScrolling={false}
      >
        <Background color="#99999911" gap={16} size={1} />
        <Controls 
          position="top-right"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            padding: '8px',
            background: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
      </ReactFlow>
    </Box>
  );
};

export const ElementDetailsModal: React.FC<ElementDetailsModalProps> = ({ 
  element, 
  open, 
  onClose,
  onKafkaSave,
  onNginxSave,
  onGeoBalancerSave
}) => {
  const [currentElement, setCurrentElement] = useState<Element | Service | null>(element);

  useEffect(() => {
    setCurrentElement(element);
  }, [element]);

  if (!currentElement) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={currentElement?.type === 'k8s' ? false : 'sm'}
      fullWidth
      PaperProps={{
        sx: {
          width: currentElement?.type === 'k8s' ? '900px' : undefined,
          height: currentElement?.type === 'k8s' ? '600px' : undefined,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {isElement(currentElement) ? currentElement.name || currentElement.type : currentElement.service}
        </Typography>
        {isElement(currentElement) && currentElement.type === 'k8s' && (
          <Typography variant="subtitle1" color="text.secondary">
            Cluster: {currentElement.clusterName || 'Unknown'}
          </Typography>
        )}
        {isElement(currentElement) && currentElement.labels && currentElement.labels.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {currentElement.labels.map((label: string, index: number) => (
              <Chip
                key={index}
                label={label}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {isElement(currentElement) && isKafkaElement(currentElement) && (
          <KafkaSection element={currentElement} onSave={onKafkaSave} />
        )}
        {isElement(currentElement) && currentElement.type.toLowerCase() === 'nginx' && (
          <NginxSection element={currentElement} onSave={onNginxSave} />
        )}
        {isElement(currentElement) && ['geobalancer', 'geo-load-balancer'].includes(currentElement.type.toLowerCase()) && (
          <GeoBalancerSection element={currentElement} onSave={onGeoBalancerSave} />
        )}
        {isElement(currentElement) && currentElement.type.toLowerCase() === 'k8s' && (
          <KubernetesSection element={currentElement} />
        )}
      </DialogContent>
    </Dialog>
  );
}; 