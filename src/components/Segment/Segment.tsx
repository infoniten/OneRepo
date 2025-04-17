import React from 'react';
import { motion } from 'framer-motion';
import { Paper, Typography, Box } from '@mui/material';
import { Segment as SegmentType } from '../../types/integration';
import Node from '../Node/Node';

interface SegmentProps {
  segment: SegmentType;
  selectedElementId: string | number | null;
  onElementClick: (elementId: string | number) => void;
  isLastSegment?: boolean;
}

const Segment: React.FC<SegmentProps> = ({ 
  segment, 
  selectedElementId, 
  onElementClick,
  isLastSegment = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: 'transparent',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3,
            color: '#1976d2',
            fontWeight: 500,
          }}
        >
          Сегмент: {segment.segment}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 4,
            position: 'relative',
            minHeight: '300px'
          }}
        >
          {segment.elements.map((element, index) => (
            <Box 
              key={element.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                position: 'relative',
                minWidth: '220px'
              }}
            >
              <Node
                element={element}
                isSelected={selectedElementId === element.id}
                onClick={() => onElementClick(element.id)}
                showArrow={!(isLastSegment && index === segment.elements.length - 1)}
              />
              
              {element.services && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    mt: 2,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-18px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '2px',
                      height: '18px',
                      backgroundColor: '#e0e0e0',
                    }
                  }}
                >
                  {element.services.map((service, serviceIndex) => (
                    <Box
                      key={service.id}
                      sx={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          width: '40px',
                          height: '2px',
                          backgroundColor: '#e0e0e0',
                          transform: 'translateX(-20px)',
                        }
                      }}
                    >
                      <Node
                        element={service}
                        isSelected={selectedElementId === service.id}
                        onClick={() => onElementClick(service.id)}
                        showArrow={!(isLastSegment && index === segment.elements.length - 1)}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default Segment; 