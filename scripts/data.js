// Character Data
const characterData = [
    {
        id: 'emily',
        name: 'Emily',
        gender: 'female',
        personality: 'Cheerful, artistic, loves nature',
        interests: ['painting', 'hiking', 'indie music', 'photography', 'coffee'],
        background: 'Graphic designer with dreams of opening an art gallery',
        imageSeed: 1, // Fixed seed for consistent image generation
        promptTemplate: 'A cheerful woman with shoulder-length brown hair and green eyes, artistic looking, in her mid-20s, smiling warmly'
    },
    {
        id: 'james',
        name: 'James',
        gender: 'male',
        personality: 'Ambitious, witty, analytical',
        interests: ['technology', 'rock climbing', 'strategy games', 'sci-fi novels', 'trying new restaurants'],
        background: 'Software engineer with his own tech startup',
        imageSeed: 2,
        promptTemplate: 'A confident man with short dark hair and glasses, tech professional look, in his late 20s, slight smile'
    },
    {
        id: 'sophia',
        name: 'Sophia',
        gender: 'female',
        personality: 'Confident, adventurous, passionate',
        interests: ['traveling', 'dancing', 'cooking international cuisines', 'fashion', 'learning languages'],
        background: 'Travel journalist who has lived in five different countries',
        imageSeed: 3,
        promptTemplate: 'A confident woman with long wavy black hair, fashionable, diverse cultural aesthetic, in her mid-20s, adventurous expression'
    },
    {
        id: 'marcus',
        name: 'Marcus',
        gender: 'male',
        personality: 'Thoughtful, creative, kind',
        interests: ['writing poetry', 'playing guitar', 'documentaries', 'volunteering', 'quiet cafes'],
        background: 'Literature professor who publishes poetry',
        imageSeed: 4,
        promptTemplate: 'A thoughtful man with medium-length wavy hair, artistic style, in his early 30s, kind eyes, gentle expression'
    },
    {
        id: 'olivia',
        name: 'Olivia',
        gender: 'female',
        personality: 'Energetic, optimistic, competitive',
        interests: ['fitness', 'team sports', 'healthy cooking', 'motivational books', 'outdoor activities'],
        background: 'Personal trainer and former college athlete',
        imageSeed: 5,
        promptTemplate: 'An athletic woman with short blonde hair, fit build, sporty style, in her mid-20s, energetic and confident pose'
    }
];

// Location Data
const locationData = [
    {
        id: 'seasideCafe',
        name: 'Seaside Café',
        atmosphere: 'Relaxed, romantic, peaceful',
        description: 'A charming café with floor-to-ceiling windows offering stunning views of the ocean',
        imageSeed: 101,
        promptTemplate: 'A cozy, charming seaside café with large windows offering ocean views, soft lighting, romantic atmosphere, outdoor seating area'
    },
    {
        id: 'botanicalGardens',
        name: 'Botanical Gardens',
        atmosphere: 'Serene, beautiful, intimate',
        description: 'Winding paths through beautiful displays of plants from around the world',
        imageSeed: 102,
        promptTemplate: 'Lush botanical gardens with winding paths, colorful flowers, tranquil atmosphere, greenhouse with exotic plants, beautiful Japanese section'
    },
    {
        id: 'rooftopLounge',
        name: 'Rooftop Lounge',
        atmosphere: 'Sophisticated, trendy, exciting',
        description: 'Trendy spot offering breathtaking views of the city skyline',
        imageSeed: 103,
        promptTemplate: 'Stylish rooftop lounge with modern furniture, city skyline view at sunset, ambient lighting, cocktail bar, sophisticated atmosphere'
    },
    {
        id: 'artGallery',
        name: 'Art Gallery',
        atmosphere: 'Cultured, intellectual, inspiring',
        description: 'Modern space showcasing works from local and international artists',
        imageSeed: 104,
        promptTemplate: 'Contemporary art gallery with white walls, modern paintings and sculptures, minimalist design, people viewing artwork, bright lighting'
    },
    {
        id: 'lakesidePark',
        name: 'Lakeside Park',
        atmosphere: 'Natural, peaceful, casual',
        description: 'Picturesque park with a shimmering lake at its center',
        imageSeed: 105,
        promptTemplate: 'Beautiful park with a shimmering lake, walking paths, benches, trees with autumn colors, people enjoying nature, late afternoon light'
    },
    {
        id: 'vintageArcade',
        name: 'Vintage Arcade',
        atmosphere: 'Playful, nostalgic, energetic',
        description: 'Step back in time in this nostalgic arcade filled with classic games',
        imageSeed: 106,
        promptTemplate: 'Retro arcade with vintage video games, neon lights, pinball machines, nostalgic 80s atmosphere, colorful gaming cabinets'
    }
];

// Relationship Stages
const relationshipStages = [
    {
        name: 'Strangers',
        threshold: 0,
        description: 'You just met. Conversation is polite but reserved.'
    },
    {
        name: 'Acquaintances',
        threshold: 20,
        description: 'You recognize each other. Conversation flows a bit more naturally.'
    },
    {
        name: 'Friends',
        threshold: 40,
        description: 'You're comfortable around each other and enjoy each other's company.'
    },
    {
        name: 'Close Friends',
        threshold: 60,
        description: 'There's a special connection between you. Deeper feelings are developing.'
    },
    {
        name: 'Dating',
        threshold: 80,
        description: 'You're in a romantic relationship with genuine affection for each other.'
    }
];

// Response Impact Constants
const RESPONSE_IMPACT = {
    VERY_POSITIVE: 5,
    POSITIVE: 3,
    NEUTRAL: 1,
    NEGATIVE: -2
};

