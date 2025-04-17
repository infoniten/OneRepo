import React from 'react';
import { motion } from 'framer-motion';
import { Paper, Typography, Box } from '@mui/material';
import { Element, Service } from '../../types/integration';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface NodeProps {
  element: Element | Service;
  isSelected: boolean;
  onClick: () => void;
  showArrow?: boolean;
}

const Node: React.FC<NodeProps> = ({ element, isSelected, onClick, showArrow = true }) => {
  const getNodeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'kafka':
        return '#4CAF50';
      case 'k8s':
        return '#2196F3';
      case 'nginx':
        return '#FF9800';
      case 'geo-load-balancer':
        return '#9C27B0';
      default:
        return '#607D8B';
    }
  };

  const isService = 'service' in element;
  const type = isService ? element.service : element.type;
  const name = isService ? element.service : element.name;
  const nodeColor = getNodeColor(type);

  return (
    <Box sx={{ 
      position: 'relative', 
      display: 'flex', 
      alignItems: 'center',
      minWidth: '200px',
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        style={{ width: '100%' }}
      >
        <Paper
          elevation={isSelected ? 3 : 1}
          onClick={onClick}
          sx={{
            p: 2,
            cursor: 'pointer',
            border: `2px solid ${nodeColor}`,
            borderRadius: '8px',
            backgroundColor: isSelected ? '#f8f9fa' : 'white',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#f8f9fa',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            position: 'relative',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 'bold',
              color: nodeColor,
              mb: 0.5,
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
            }}
          >
            {type}
          </Typography>
        </Paper>
      </motion.div>
      {showArrow && (
        <Box
          sx={{
            position: 'absolute',
            right: '-28px',
            display: 'flex',
            alignItems: 'center',
            color: '#9e9e9e',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ArrowForwardIcon />
          </motion.div>
        </Box>
      )}
    </Box>
  );
};

export default Node; 