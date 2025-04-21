import React, { useState, useMemo } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { Integration } from '../../types/integration';
import { motion, AnimatePresence } from 'framer-motion';

interface IntegrationListProps {
  integrations: Integration[];
  selectedIntegration: Integration | null;
  onSelectIntegration: (integration: Integration) => void;
}

interface IntegrationWithStand extends Integration {
  stand: string;
  flowName: string;
}

const IntegrationList: React.FC<IntegrationListProps> = ({
  integrations,
  selectedIntegration,
  onSelectIntegration,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedStand, setSelectedStand] = useState<string>('IFT');

  // Получаем уникальные стенды из всех интеграций и сортируем их в нужном порядке
  const stands = useMemo(() => {
    const standsSet = new Set<string>();
    (integrations as IntegrationWithStand[]).forEach(integration => {
      standsSet.add(integration.stand);
    });
    const standsArray = Array.from(standsSet);
    const standOrder: Record<string, number> = { 'IFT': 0, 'UAT': 1, 'NT': 2, 'PROM': 3 };
    return standsArray.sort((a, b) => (standOrder[a] ?? 999) - (standOrder[b] ?? 999));
  }, [integrations]);

  // Получаем уникальные сегменты из всех интеграций
  const availableSegments = useMemo(() => {
    const segments = new Set<string>();
    integrations.forEach(integration => {
      integration.segments.forEach(segment => {
        segments.add(segment.segment.toLowerCase());
      });
    });
    return Array.from(segments);
  }, [integrations]);

  // Фильтруем интеграции по стенду, поисковому запросу и выбранным сегментам
  const filteredIntegrations = useMemo(() => {
    return (integrations as IntegrationWithStand[]).filter(integration => {
      const matchesStand = integration.stand === selectedStand;

      const matchesSearch = 
        !searchQuery || 
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.segments.some(segment => 
          segment.segment.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesSegments = 
        selectedSegments.length === 0 || 
        integration.segments.some(segment => 
          selectedSegments.includes(segment.segment.toLowerCase())
        );

      return matchesStand && matchesSearch && matchesSegments;
    });
  }, [integrations, selectedStand, searchQuery, selectedSegments]);

  const handleSegmentToggle = (segment: string) => {
    setSelectedSegments(prev => 
      prev.includes(segment)
        ? prev.filter(s => s !== segment)
        : [...prev, segment]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearFilters = () => {
    setSelectedSegments([]);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRadius: 2,
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Интеграционные потоки
          </Typography>
          <Tooltip title={showFilters ? "Скрыть фильтры" : "Показать фильтры"}>
            <IconButton 
              size="small" 
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                bgcolor: showFilters ? 'primary.main' : 'transparent',
                color: showFilters ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: showFilters ? 'primary.dark' : 'primary.light',
                },
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <FormControl 
          fullWidth 
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              },
              '&.Mui-focused': {
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              },
            },
          }}
        >
          <Select
            value={selectedStand}
            onChange={(e) => setSelectedStand(e.target.value)}
            displayEmpty
            sx={{
              '& .MuiSelect-select': {
                py: 1.5,
              },
            }}
          >
            {stands.map((stand) => (
              <MenuItem 
                key={stand} 
                value={stand}
                sx={{
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                }}
              >
                {stand}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск интеграций..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            mb: showFilters ? 2 : 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Фильтры:
                </Typography>
                {selectedSegments.length > 0 && (
                  <Chip
                    label="Очистить"
                    size="small"
                    onDelete={clearFilters}
                    sx={{ ml: 'auto' }}
                  />
                )}
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {availableSegments.map((segment) => (
                  <motion.div
                    key={segment}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Chip
                      label={segment}
                      onClick={() => handleSegmentToggle(segment)}
                      color={selectedSegments.includes(segment) ? "primary" : "default"}
                      sx={{ 
                        textTransform: 'capitalize',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        },
                      }}
                    />
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <List sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        p: 1,
      }}>
        <AnimatePresence>
          {filteredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={selectedIntegration?.name === integration.name}
                  onClick={() => onSelectIntegration(integration)}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      '&:hover': {
                        bgcolor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {integration.name}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {integration.description || 'Нет описания'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {integration.segments.map((segment) => (
                            <Chip
                              key={segment.segment}
                              label={segment.segment}
                              size="small"
                              sx={{ 
                                height: '20px',
                                textTransform: 'capitalize',
                                bgcolor: 'background.default',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    }
                    sx={{ py: 1 }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredIntegrations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                Интеграции не найдены
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Попробуйте изменить параметры поиска
              </Typography>
            </Box>
          </motion.div>
        )}
      </List>
    </Paper>
  );
};

export default IntegrationList; 