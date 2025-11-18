const express = require('express');
const router = express.Router();

// Mock storybooks routes - replace with real implementation
router.get('/', (req, res) => {
  // Mock storybooks data
  const storybooks = [
    {
      id: 'sb-1',
      storyId: '1',
      title: 'The Enchanted Forest - Interactive Storybook',
      creatorId: '1',
      createdAt: new Date(),
      totalDuration: 420,
      pages: [
        {
          id: 'page-1',
          pageNumber: 1,
          content: 'Once upon a time, in a world where magic flowed like rivers through ancient oak trees, there lived a young adventurer named Luna.',
          imageUrl: '/api/images/forest-entrance.jpg'
        },
        {
          id: 'page-2',
          pageNumber: 2,
          content: 'She had always felt different from the other villagers, sensing whispers in the wind and seeing shadows dance when no one else was looking.',
          imageUrl: '/api/images/luna-village.jpg'
        }
      ]
    }
  ];
  
  res.json({ success: true, data: storybooks });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock single storybook
  const storybook = {
    id: id,
    storyId: '1',
    title: 'The Enchanted Forest - Interactive Storybook',
    creatorId: '1',
    createdAt: new Date(),
    totalDuration: 420,
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        content: 'Once upon a time, in a world where magic flowed like rivers through ancient oak trees, there lived a young adventurer named Luna.',
        imageUrl: '/api/images/forest-entrance.jpg',
        animationElements: [
          {
            id: 'sparkle-1',
            type: 'magical-element',
            x: 20,
            y: 30,
            width: 40,
            height: 40,
            animation: {
              element: 'sparkle-1',
              type: 'fadeIn',
              duration: 2000,
              delay: 0,
              properties: {
                from: { opacity: 0, scale: 0 },
                to: { opacity: 1, scale: 1 }
              }
            }
          }
        ]
      },
      {
        id: 'page-2',
        pageNumber: 2,
        content: 'She had always felt different from the other villagers, sensing whispers in the wind and seeing shadows dance when no one else was looking.',
        imageUrl: '/api/images/luna-village.jpg'
      },
      {
        id: 'page-3',
        pageNumber: 3,
        content: 'One misty morning, while gathering herbs, Luna discovered a peculiar path she had never noticed before.',
        imageUrl: '/api/images/magical-path.jpg'
      },
      {
        id: 'page-4',
        pageNumber: 4,
        content: 'The stones along the path seemed to pulse with a gentle, golden light, and the air smelled of jasmine and forgotten dreams.',
        imageUrl: '/api/images/glowing-stones.jpg'
      },
      {
        id: 'page-5',
        pageNumber: 5,
        content: 'As she followed the magical trail deeper into the unknown, Luna\'s heart beat with both excitement and trepidation.',
        imageUrl: '/api/images/deep-forest.jpg'
      }
    ]
  };
  
  res.json({ success: true, data: storybook });
});

router.post('/', (req, res) => {
  const { storyId, title, pages } = req.body;
  
  // Mock storybook creation
  const newStorybook = {
    id: 'sb-' + Date.now(),
    storyId,
    title,
    creatorId: '1', // Mock current user
    createdAt: new Date(),
    totalDuration: pages.length * 60, // Mock duration
    pages: pages.map((page, index) => ({
      ...page,
      id: 'page-' + (index + 1),
      pageNumber: index + 1
    }))
  };
  
  res.json({ success: true, data: newStorybook });
});

module.exports = router;